"use server";

import { countries, type CountryCode } from "@/lib/config/countries";

const countryCodes = Object.keys(countries) as [CountryCode, ...CountryCode[]];

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordAudit } from "@/lib/auth/audit";
import { requireAdmin, requireManagementAdmin } from "@/lib/auth/authorization";
import { createBookingFromSlip, labelByCategory } from "@/lib/bookings/create";
import { loadSportyBetSlip } from "@/lib/bookings/sportybet";
import { getDatabase } from "@/lib/db/client";
import { isDatabaseError } from "@/lib/db/errors";
import { fromDateKey, getFixtureDateWindows, getUtcDayRange } from "@/lib/football/dates";
import { invalidateBookingData, invalidateVipData } from "@/lib/cache/invalidate";
import { priceWithinRange, vipPriceRanges } from "@/lib/vip/pricing";

const loadSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{4,20}$/),
  category: z.enum(["FREE", "VIP1", "VIP2", "VIP3"]),
  countryCode: z.enum(countryCodes).default("GH"),
});

export type SlipLoaderState = { error?: string; success?: string };

function refreshPublicContent() {
  invalidateBookingData();
  revalidatePath("/");
  revalidatePath("/tips");
  revalidatePath("/vip");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/games");
  revalidatePath("/admin/games-control");
  revalidatePath("/admin/predictions");
  revalidatePath("/admin/results");
}

export async function loadBookingSlip(_state: SlipLoaderState, formData: FormData): Promise<SlipLoaderState> {
  const actor = await requireAdmin();
  const parsed = loadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter valid slip details." };

  try {
    const input = parsed.data;
    const country = countries[input.countryCode];
    if (!country.enabled) return { error: `${country.name} is not live yet.` };
    // A code only exists on the SportyBet site of the country it was made in.
    const loaded = await loadSportyBetSlip(input.code, fetch, country.sportyBetRegion);
    // An admin typing a code is the review, so the card is approved on arrival.
    const created = await createBookingFromSlip({
      slip: loaded,
      code: input.code,
      category: input.category,
      countryCode: input.countryCode,
      actorId: actor.id,
    });
    if (!created.ok) return { error: created.error };

    await recordAudit({ actorId: actor.id, action: "BOOKING_SLIP_LOADED", entityType: "Booking", entityId: created.bookingId, metadata: { code: input.code, category: input.category, games: created.games, priceMinor: created.priceMinor, bookingDate: created.bookingDate } });
    refreshPublicContent();
    return { success: `${labelByCategory[input.category]} loaded for ${created.bookingDate} with ${created.games} matches.${input.category === "FREE" ? "" : ` Price: ${country.currency} ${((created.priceMinor ?? 0) / 100).toFixed(2)}. Open sales in Games Control after reviewing the card.`}` };
  } catch (error) {
    if (error instanceof Error && (error.message.includes("expired transaction") || error.message.includes("Transaction API error"))) {
      return { error: "The slip took too long to save. Nothing was partially loaded, so please try the same code again." };
    }
    if (isDatabaseError(error)) {
      return { error: "Winning Tips could not save this slip. Please try again." };
    }
    return { error: error instanceof Error ? error.message : "The booking code could not be loaded." };
  }
}

export async function toggleBooking(formData: FormData) {
  const actor = await requireAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const isActive = formData.get("isActive") === "true";
  const updated = await getDatabase().booking.updateMany({ where: { id, deletedAt: null }, data: { isActive } });
  if (updated.count !== 1) throw new Error("Booking slip not found.");
  await recordAudit({ actorId: actor.id, action: isActive ? "BOOKING_PUBLISHED" : "BOOKING_HIDDEN", entityType: "Booking", entityId: id });
  refreshPublicContent();
}

export async function deleteBooking(formData: FormData) {
  const actor = await requireAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  await getDatabase().booking.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } });
  await recordAudit({ actorId: actor.id, action: "BOOKING_SLIP_DELETED", entityType: "Booking", entityId: id });
  refreshPublicContent();
}

export async function deleteBookings(formData: FormData) {
  const actor = await requireAdmin();
  const ids = z.array(z.string().min(1)).max(100).parse(formData.getAll("bookingIds"));
  if (!ids.length) return;
  const deleted = await getDatabase().booking.updateMany({ where: { id: { in: ids }, deletedAt: null }, data: { isActive: false, deletedAt: new Date() } });
  await recordAudit({ actorId: actor.id, action: "BOOKING_SLIPS_DELETED", entityType: "Booking", metadata: { ids, count: deleted.count } });
  refreshPublicContent();
}

export async function updateVipControl(formData: FormData) {
  const actor = await requireManagementAdmin();
  const parsed = z.object({
    id: z.string().min(1),
    price: z.coerce.number().positive().max(100_000),
    availability: z.enum(["AVAILABLE", "SOLD_OUT"]),
    countryCode: z.enum(countryCodes).default("GH"),
    date: z.string().refine((value) => Boolean(fromDateKey(value)), "Choose a valid card date.").optional(),
  }).parse(Object.fromEntries(formData));
  const country = countries[parsed.countryCode];
  const priceMinor = Math.round(parsed.price * 100);
  const isSoldOut = parsed.availability === "SOLD_OUT";
  const database = getDatabase();
  const existingPlan = await database.plan.findUnique({ where: { id: parsed.id }, include: { deck: { select: { slug: true } } } });
  if (!existingPlan) throw new Error("VIP plan not found.");
  const categoryByDeckSlug = { "vip-deck": "VIP1", "vip-2-deck": "VIP2", "vip-3-deck": "VIP3" } as const;
  const category = existingPlan.deck?.slug ? categoryByDeckSlug[existingPlan.deck.slug as keyof typeof categoryByDeckSlug] : undefined;
  if (category && country.currency === "GHS" && !priceWithinRange(category, priceMinor)) {
    const range = vipPriceRanges[category];
    throw new Error(`Price must be between GHS ${range.min / 100} and GHS ${range.max / 100}.`);
  }
  const today = parsed.date ?? getFixtureDateWindows()[1].date;
  const { start, end } = getUtcDayRange(today);
  const currentSlip = category ? await database.booking.findFirst({ where: { countryCode: country.countryCode, category, bookingDate: { gte: start, lt: end }, isActive: true, deletedAt: null }, orderBy: { createdAt: "desc" }, select: { id: true, deadline: true } }) : null;
  if (!isSoldOut && !currentSlip) throw new Error("Load and publish today's VIP slip before marking it Available.");
  if (!isSoldOut && (!currentSlip?.deadline || currentSlip.deadline <= new Date())) throw new Error("This card's sales deadline has passed.");
  const plan = await database.$transaction(async (transaction) => {
    // The plan keeps the tier default for the next card; the card itself
    // carries what checkout actually reads.
    // Only a price in the plan's own currency is written back to it; another
    // edition prices its card alone.
    const updated = existingPlan.currency === country.currency
      ? await transaction.plan.update({ where: { id: parsed.id }, data: { isSoldOut, priceMinor }, select: { name: true } })
      : { name: existingPlan.name };
    if (currentSlip) await transaction.booking.update({ where: { id: currentSlip.id }, data: { priceMinor, isSoldOut, currency: country.currency } });
    return updated;
  });
  await recordAudit({ actorId: actor.id, action: isSoldOut ? "VIP_MARKED_SOLD_OUT" : "VIP_MARKED_AVAILABLE", entityType: "Plan", entityId: parsed.id, metadata: { name: plan.name, priceMinor } });
  invalidateVipData();
  revalidatePath("/tips");
  revalidatePath("/vip");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/games");
  revalidatePath("/admin/games-control");
  revalidatePath("/admin/plans");
  if (formData.get("appliedPlanId") === parsed.id) redirect(`/admin/games-control?applied=${parsed.id}&country=${country.countryCode}&date=${today}`);
}
