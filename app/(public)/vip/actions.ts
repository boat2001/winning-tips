"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordAudit } from "@/lib/auth/audit";
import { requireUser } from "@/lib/auth/authorization";
import { getDatabase } from "@/lib/db/client";
import { getFixtureDateWindows, getUtcDayRange } from "@/lib/football/dates";
import { PaystackProvider } from "@/lib/payments/paystack";

export type CheckoutState = { error?: string };

export async function initializeCheckoutAction(_state: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const user = await requireUser();
  const planId = z.string().min(1).parse(formData.get("planId"));
  if (!process.env.PAYSTACK_SECRET_KEY) return { error: "Online payment is not configured yet. Please contact support." };
  const database = getDatabase();
  const plan = await database.plan.findFirst({ where: { id: planId, isActive: true, isSoldOut: false }, include: { deck: { select: { slug: true } } } });
  if (!plan || plan.priceMinor <= 0 || !["GHS"].includes(plan.currency)) return { error: "This VIP plan is currently unavailable." };
  if (plan.scope === "DECK" && !plan.deckId) return { error: "This Deck plan is not configured correctly." };
  const categoryByDeckSlug = { "vip-deck": "VIP1", "vip-2-deck": "VIP2", "vip-3-deck": "VIP3" } as const;
  const category = plan.deck?.slug ? categoryByDeckSlug[plan.deck.slug as keyof typeof categoryByDeckSlug] : undefined;
  if (!category) return { error: "This VIP plan is currently unavailable." };
  const { start, end } = getUtcDayRange(getFixtureDateWindows()[1].date);
  const currentSlip = await database.booking.findFirst({
    where: { category, bookingDate: { gte: start, lt: end }, isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      predictions: {
        where: { status: "PUBLISHED", visibility: "PREMIUM" },
        select: { result: true },
      },
    },
  });
  if (!currentSlip?.predictions.length || currentSlip.predictions.some((prediction) => prediction.result !== "PENDING")) {
    return { error: "This VIP plan is currently unavailable." };
  }
  const recent = await database.payment.count({ where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } } });
  if (recent >= 5) return { error: "Too many checkout attempts. Please wait a few minutes." };

  const reference = `td_${Date.now().toString(36)}_${randomBytes(9).toString("hex")}`;
  const payment = await database.payment.create({ data: { reference, userId: user.id, planId: plan.id, bookingId: currentSlip.id, amountMinor: plan.priceMinor, currency: plan.currency } });
  const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  let authorizationUrl: string;
  try {
    const initialized = await new PaystackProvider().initialize({ email: user.email, amountMinor: plan.priceMinor, currency: plan.currency, reference, callbackUrl: new URL("/payments/verify", appUrl).toString(), metadata: { paymentId: payment.id, userId: user.id, planId: plan.id } });
    authorizationUrl = initialized.authorizationUrl;
    await database.payment.update({ where: { id: payment.id }, data: { authorizationUrl, accessCode: initialized.accessCode } });
  } catch {
    await database.payment.update({ where: { id: payment.id }, data: { status: "FAILED", gatewayResponse: "Initialization failed" } });
    return { error: "We could not start the payment. Please try again." };
  }
  await recordAudit({ actorId: user.id, action: "PAYMENT_INITIALIZED", entityType: "Payment", entityId: payment.id, metadata: { reference, planId: plan.id, amountMinor: plan.priceMinor, currency: plan.currency } });
  redirect(authorizationUrl);
}
