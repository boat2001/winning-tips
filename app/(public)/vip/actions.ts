"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordAudit } from "@/lib/auth/audit";
import { requireUser } from "@/lib/auth/authorization";
import { getDatabase } from "@/lib/db/client";
import { getFixtureDateWindows, getUtcDayRange } from "@/lib/football/dates";
import { PaystackProvider } from "@/lib/payments/paystack";
import { getMemberCountryCode } from "@/lib/app/preferences";
import { resolveMemberCountry } from "@/lib/config/countries";
import { getSiteUrl } from "@/lib/config/site";

export type CheckoutState = { error?: string };

export async function initializeCheckoutAction(_state: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const user = await requireUser("/vip");
  const parsed = z.string().min(1).safeParse(formData.get("planId"));
  if (!parsed.success) return { error: "Choose a VIP card to continue." };
  const planId = parsed.data;
  if (!process.env.PAYSTACK_SECRET_KEY) return { error: "Online payment is not configured yet. Please contact support." };
  const database = getDatabase();
  const country = resolveMemberCountry(await getMemberCountryCode(user.id));
  if (!country.paymentsEnabled) return { error: `VIP cards are not on sale in ${country.name} yet.` };
  const plan = await database.plan.findFirst({ where: { id: planId, isActive: true }, include: { deck: { select: { slug: true } } } });
  if (!plan) return { error: "This VIP card is currently unavailable." };
  const categoryByDeckSlug = { "vip-deck": "VIP1", "vip-2-deck": "VIP2", "vip-3-deck": "VIP3" } as const;
  const category = plan.deck?.slug ? categoryByDeckSlug[plan.deck.slug as keyof typeof categoryByDeckSlug] : undefined;
  if (!category) return { error: "This VIP plan is currently unavailable." };
  const { start, end } = getUtcDayRange(getFixtureDateWindows()[1].date);
  const currentSlip = await database.booking.findFirst({
    where: { countryCode: country.countryCode, category, bookingDate: { gte: start, lt: end }, isActive: true, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      priceMinor: true,
      currency: true,
      isSoldOut: true,
      deadline: true,
      predictions: {
        where: { status: "PUBLISHED", visibility: "PREMIUM" },
        select: { result: true, fixture: { select: { kickoffAt: true, provider: true } } },
      },
    },
  });
  // Everything that decides whether today's card can be sold lives on the card.
  if (!currentSlip?.predictions.length) return { error: "Today's card has not been published yet." };
  const alreadyOwned = await database.payment.findFirst({ where: { userId: user.id, bookingId: currentSlip.id, status: "SUCCESS" }, select: { id: true } });
  if (alreadyOwned) return { error: "You already own this card. View it under Your games." };
  if (currentSlip.isSoldOut) return { error: "Today's card is closed for sales." };
  const now = new Date();
  if (!currentSlip.deadline || currentSlip.deadline <= now || currentSlip.predictions.some((prediction) => prediction.fixture.kickoffAt <= now)) return { error: "Sales for today's card are closed." };
  if (currentSlip.predictions.some((prediction) => prediction.fixture.provider === "mock")) return { error: "This card is not available for purchase." };
  if (currentSlip.predictions.some((prediction) => prediction.result !== "PENDING")) return { error: "Today's card has already started settling." };
  const priceMinor = currentSlip.priceMinor ?? 0;
  const currency = currentSlip.currency;
  if (priceMinor <= 0 || currency !== country.currency) return { error: "Today's card is not priced yet." };
  const recent = await database.payment.count({ where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } } });
  if (recent >= 5) return { error: "Too many checkout attempts. Please wait a few minutes." };

  const reference = `td_${Date.now().toString(36)}_${randomBytes(9).toString("hex")}`;
  const payment = await database.payment.create({ data: { reference, userId: user.id, planId: plan.id, bookingId: currentSlip.id, amountMinor: priceMinor, currency } });
  const appUrl = getSiteUrl();
  let authorizationUrl: string;
  try {
    const initialized = await new PaystackProvider().initialize({ email: user.email, amountMinor: priceMinor, currency, reference, callbackUrl: new URL("/payments/verify", appUrl).toString(), metadata: { paymentId: payment.id, userId: user.id, planId: plan.id } });
    authorizationUrl = initialized.authorizationUrl;
    await database.payment.update({ where: { id: payment.id }, data: { authorizationUrl, accessCode: initialized.accessCode } });
  } catch {
    await database.payment.update({ where: { id: payment.id }, data: { status: "FAILED", gatewayResponse: "Initialization failed" } });
    return { error: "We could not start the payment. Please try again." };
  }
  await recordAudit({ actorId: user.id, action: "PAYMENT_INITIALIZED", entityType: "Payment", entityId: payment.id, metadata: { reference, planId: plan.id, bookingId: currentSlip.id, amountMinor: priceMinor, currency } });
  redirect(authorizationUrl);
}
