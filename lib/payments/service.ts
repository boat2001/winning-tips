import "server-only";
import { getDatabase } from "@/lib/db/client";
import { PaystackProvider } from "@/lib/payments/paystack";
import { verifiedPaymentMatches } from "@/lib/payments/validation";

export async function verifyAndFulfilPayment(reference: string) {
  if (!/^td_[a-z0-9]+_[a-f0-9]{18}$/.test(reference)) return { status: "not_found" as const };
  const database = getDatabase();
  const payment = await database.payment.findUnique({ where: { reference }, include: { user: true, plan: true, subscription: true } });
  if (!payment) return { status: "not_found" as const };
  if (payment.status === "SUCCESS") return { status: "success" as const, payment, subscription: payment.subscription };

  const verified = await new PaystackProvider().verify(reference);
  const valid = verifiedPaymentMatches({ reference: payment.reference, amountMinor: payment.amountMinor, currency: payment.currency, email: payment.user.email }, verified);
  if (!valid) {
    if (["pending", "processing", "ongoing", "queued"].includes(verified.status)) {
      await database.payment.update({ where: { id: payment.id }, data: { providerReference: verified.providerReference, gatewayResponse: verified.gatewayResponse, verifiedAt: new Date(), providerData: verified.raw } });
      return { status: "pending" as const };
    }
    const status = ["abandoned", "cancelled"].includes(verified.status) ? "CANCELLED" : "FAILED";
    await database.payment.update({ where: { id: payment.id }, data: { status, providerReference: verified.providerReference, gatewayResponse: verified.gatewayResponse, verifiedAt: new Date(), providerData: verified.raw } });
    return { status: status === "CANCELLED" ? "cancelled" as const : "failed" as const };
  }

  const result = await database.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${payment.userId} FOR UPDATE`;
    const current = await transaction.payment.findUniqueOrThrow({ where: { id: payment.id }, include: { subscription: true } });
    if (current.status === "SUCCESS") return current;
    const now = new Date();
    return transaction.payment.update({
      where: { id: payment.id },
      data: { status: "SUCCESS", providerReference: verified.providerReference, gatewayResponse: verified.gatewayResponse, paidAt: verified.paidAt ?? now, verifiedAt: now, providerData: verified.raw },
      include: { subscription: true },
    });
  }, { maxWait: 10_000, timeout: 30_000 });
  return { status: "success" as const, payment: result, subscription: result.subscription };
}

export async function markPaymentRefunded(reference: string) {
  const database = getDatabase();
  const payment = await database.payment.findUnique({ where: { reference }, include: { subscription: true } });
  if (!payment) return false;
  await database.$transaction(async (transaction) => {
    await transaction.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED", verifiedAt: new Date() } });
    if (payment.subscription) await transaction.subscription.update({ where: { id: payment.subscription.id }, data: { status: "CANCELLED", expiresAt: new Date() } });
    const next = await transaction.subscription.findFirst({ where: { userId: payment.userId, status: "ACTIVE", grantsAllPremium: true, expiresAt: { gt: new Date() }, paymentId: { not: payment.id } }, orderBy: { expiresAt: "desc" } });
    await transaction.user.update({ where: { id: payment.userId }, data: { premiumAccessUntil: next?.expiresAt ?? null } });
  }, { maxWait: 10_000, timeout: 30_000 });
  return true;
}
