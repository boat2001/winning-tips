"use server";

import { sportFromName } from "@/lib/sports/sport";
import { countries, type CountryCode } from "@/lib/config/countries";

const countryCodes = Object.keys(countries) as [CountryCode, ...CountryCode[]];

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordAudit } from "@/lib/auth/audit";
import { requireAdmin, requireManagementAdmin } from "@/lib/auth/authorization";
import { loadSportyBetSlip } from "@/lib/bookings/sportybet";
import { getDatabase } from "@/lib/db/client";
import { isDatabaseError } from "@/lib/db/errors";
import { fromDateKey, getFixtureDateWindows, getUtcDayRange } from "@/lib/football/dates";
import { invalidateBookingData, invalidateVipData } from "@/lib/cache/invalidate";
import { getAutomaticVipPrice } from "@/lib/vip/automatic-pricing";
import { priceWithinRange, vipPriceRanges } from "@/lib/vip/pricing";
import { slipSchedule } from "@/lib/bookings/schedule";

const loadSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{4,20}$/),
  category: z.enum(["FREE", "VIP1", "VIP2", "VIP3"]),
  countryCode: z.enum(countryCodes).default("GH"),
});

const deckSlugByCategory = { FREE: "free-deck", VIP1: "vip-deck", VIP2: "vip-2-deck", VIP3: "vip-3-deck" } as const;
const labelByCategory = { FREE: "Free Predictions", VIP1: "VIP 1 Predictions", VIP2: "VIP 2 Predictions", VIP3: "VIP 3 Predictions" } as const;

export type SlipLoaderState = { error?: string; success?: string };

function stableId(prefix: string, value: string) {
  return `${prefix}-${createHash("sha256").update(value.toLowerCase()).digest("hex").slice(0, 20)}`;
}

function splitPrediction(value: string | null | undefined) {
  const prediction = value?.trim() || "Selection unavailable";
  const match = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(prediction);
  return match ? { selection: match[1].trim(), market: match[2].trim() } : { selection: prediction, market: "SportyBet Selection" };
}

function refreshPublicContent() {
  invalidateBookingData();
  revalidatePath("/");
  revalidatePath("/predictions");
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
    // Refuse the whole slip before writing anything if a leg is a sport we do
    // not publish for, including virtual and e-sports variants (guide §2).
    const unsupported = loaded.games.find((game) => sportFromName(game.sport) === null);
    if (unsupported) return { error: `This slip includes ${unsupported.sport}, which Winning Tips does not publish predictions for.` };
    // Tomorrow's slips can be prepared today without appearing as today's card.
    const { deadline, bookingDate } = slipSchedule(loaded.games.map((game) => game.kickoffAt), loaded.deadline);
    const database = getDatabase();
    const exists = await database.booking.findUnique({ where: { code: input.code }, select: { id: true } });
    if (exists) return { error: "That booking code has already been loaded." };
    const deck = await database.deck.findUnique({ where: { slug: deckSlugByCategory[input.category] }, select: { id: true } });
    if (!deck) return { error: `The ${labelByCategory[input.category]} deck is not configured.` };
    const plan = input.category === "FREE" ? null : await database.plan.findFirst({ where: { deckId: deck.id, isActive: true }, select: { id: true, priceMinor: true, isSoldOut: true, currency: true } });
    if (input.category !== "FREE" && !plan) return { error: `The ${labelByCategory[input.category]} plan is not configured.` };
    // The tier default is only a price in its own currency. Another edition's
    // card starts unpriced and is priced from games control.
    const pricing = input.category !== "FREE" && country.currency === "GHS" ? await getAutomaticVipPrice(database, input.category, country.countryCode) : null;
    const priceMinor = pricing?.priceMinor ?? null;

    const totalOdds = loaded.totalOdds ?? loaded.games.reduce((total, game) => total * game.odd, 1);
    const bookingDateValue = new Date(`${bookingDate}T00:00:00.000Z`);
    const booking = await database.$transaction(async (transaction) => {
      if (input.category !== "FREE") {
        await transaction.booking.updateMany({
          where: { countryCode: country.countryCode, category: input.category, bookingDate: bookingDateValue, isActive: true },
          data: { isActive: false },
        });
      }
      const created = await transaction.booking.create({
        data: {
          title: labelByCategory[input.category],
          platform: "SportyBet",
          code: input.code,
          category: input.category,
          countryCode: country.countryCode,
          currency: country.currency,
          shareUrl: loaded.shareURL || null,
          totalOdds: totalOdds.toFixed(2),
          priceMinor,
          // A tier closed for sales stays closed when tomorrow's card loads.
          isSoldOut: input.category !== "FREE",
          deadline,
          bookingDate: bookingDateValue,
          isActive: true,
        },
      });

      for (const [index, game] of loaded.games.entries()) {
        const leagueExternalId = game.sportybet.tournamentId;
        const league = await transaction.league.upsert({
          where: { externalId: leagueExternalId },
          update: { name: game.tournament, country: game.category, sport: sportFromName(game.sport) ?? "FOOTBALL" },
          create: { externalId: leagueExternalId, name: game.tournament, slug: leagueExternalId, country: game.category, sport: sportFromName(game.sport) ?? "FOOTBALL" },
          select: { id: true },
        });
        const homeExternalId = stableId("sportybet-team", `${game.sport}:${game.home}`);
        const awayExternalId = stableId("sportybet-team", `${game.sport}:${game.away}`);
        const [homeTeam, awayTeam] = await Promise.all([
          transaction.team.upsert({ where: { externalId: homeExternalId }, update: { name: game.home }, create: { externalId: homeExternalId, name: game.home }, select: { id: true } }),
          transaction.team.upsert({ where: { externalId: awayExternalId }, update: { name: game.away }, create: { externalId: awayExternalId, name: game.away }, select: { id: true } }),
        ]);
        const fixtureExternalId = game.sportybet.eventId;
        const kickoffAt = new Date(game.kickoffAt);
        const providerData = {
          source: `SportyBet ${country.name} booking code`,
          bookingCode: input.code,
          country: country.sportyBetRegion,
          sportId: game.sportybet.sportId,
          categoryId: game.sportybet.categoryId,
          tournamentId: game.sportybet.tournamentId,
          eventId: game.sportybet.eventId,
          marketId: game.sportybet.marketId,
          outcomeId: game.sportybet.outcomeId,
          specifier: game.sportybet.specifier ?? null,
        };
        const fixture = await transaction.fixture.upsert({
          where: { externalId: fixtureExternalId },
          update: { leagueId: league.id, homeTeamId: homeTeam.id, awayTeamId: awayTeam.id, kickoffAt, providerData },
          create: { externalId: fixtureExternalId, leagueId: league.id, homeTeamId: homeTeam.id, awayTeamId: awayTeam.id, kickoffAt, provider: "sportybet", providerData },
          select: { id: true },
        });
        const prediction = splitPrediction(game.prediction);
        await transaction.prediction.create({
          data: {
            slug: `${input.code.toLowerCase()}-${index + 1}-${Date.now().toString(36)}`,
            fixtureId: fixture.id,
            deckId: deck.id,
            bookingId: created.id,
            market: prediction.market,
            selection: prediction.selection,
            sourceData: { marketId: game.sportybet.marketId, outcomeId: game.sportybet.outcomeId, specifier: game.sportybet.specifier ?? null },
            odds: game.odd.toFixed(2),
            confidence: 70,
            analysis: `Imported from SportyBet booking code ${input.code}. The admin can edit this selection and analysis before or after publication.`,
            visibility: input.category === "FREE" ? "FREE" : "PREMIUM",
            status: "PUBLISHED",
            result: "PENDING",
            publishAt: new Date(),
            createdById: actor.id,
          },
        });
      }
      return created;
    }, {
      maxWait: 10_000,
      timeout: 60_000,
    });

    await recordAudit({ actorId: actor.id, action: "BOOKING_SLIP_LOADED", entityType: "Booking", entityId: booking.id, metadata: { code: input.code, category: input.category, games: loaded.games.length, totalOdds: totalOdds.toFixed(2), priceMinor, pricing, bookingDate } });
    refreshPublicContent();
    return { success: `${labelByCategory[input.category]} loaded for ${bookingDate} with ${loaded.games.length} matches.${input.category === "FREE" ? "" : ` Price: ${country.currency} ${((priceMinor ?? 0) / 100).toFixed(2)}. Open sales in Games Control after reviewing the card.`}` };
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
  revalidatePath("/predictions");
  revalidatePath("/vip");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/games");
  revalidatePath("/admin/games-control");
  revalidatePath("/admin/plans");
  if (formData.get("appliedPlanId") === parsed.id) redirect(`/admin/games-control?applied=${parsed.id}&country=${country.countryCode}&date=${today}`);
}
