import "server-only";
import { getDatabase } from "@/lib/db/client";
import { PaystackProvider } from "@/lib/payments/paystack";
import { verifiedPaymentMatches } from "@/lib/payments/validation";

export async function verifyAndFulfilPayment(reference: string) {
  if (!/^td_[a-z0-9]+_[a-f0-9]{18}$/.test(reference)) return { status: "not_found" as const };
  const database = getDatabase();
  const payment = await database.payment.findUnique({ where: { reference }, include: { user: true, plan: true } });
  if (!payment) return { status: "not_found" as const };
  if (payment.status === "SUCCESS") return { status: "success" as const, payment };
  if (payment.status === "REFUNDED") return { status: "refunded" as const };

  const verified = await new PaystackProvider().verify(reference);
  const valid = verifiedPaymentMatches({ reference: payment.reference, amountMinor: payment.amountMinor, currency: payment.currency, email: payment.user.email }, verified);
  return database.$transaction(async (transaction) => {
    // Every writer locks the payment, including refunds. A delayed callback
    // must neither undo a refund nor downgrade a concurrent successful webhook.
    await transaction.$queryRaw`SELECT "id" FROM "payments" WHERE "id" = ${payment.id} FOR UPDATE`;
    const current = await transaction.payment.findUniqueOrThrow({ where: { id: payment.id } });
    if (current.status === "REFUNDED") return { status: "refunded" as const };
    if (current.status === "SUCCESS") return { status: "success" as const, payment: current };
    const now = new Date();
    const details = { providerReference: verified.providerReference, gatewayResponse: verified.gatewayResponse, verifiedAt: now, providerData: verified.raw };
    if (!valid) {
      if (["pending", "processing", "ongoing", "queued"].includes(verified.status)) {
        await transaction.payment.update({ where: { id: payment.id }, data: details });
        return { status: "pending" as const };
      }
      const status = ["abandoned", "cancelled"].includes(verified.status) ? "CANCELLED" : "FAILED";
      await transaction.payment.update({ where: { id: payment.id }, data: { ...details, status } });
      return { status: status === "CANCELLED" ? "cancelled" as const : "failed" as const };
    }
    const result = await transaction.payment.update({
      where: { id: payment.id },
      data: { ...details, status: "SUCCESS", paidAt: verified.paidAt ?? now },
    });
    return { status: "success" as const, payment: result };
  }, { maxWait: 10_000, timeout: 30_000 });
}

export async function markPaymentRefunded(reference: string) {
  const database = getDatabase();
  const payment = await database.payment.findUnique({ where: { reference } });
  if (!payment) return false;
  // Access to a card is the payment itself: every unlock query requires a
  // SUCCESS payment, so marking this one refunded withdraws the card with it.
  await database.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT "id" FROM "payments" WHERE "id" = ${payment.id} FOR UPDATE`;
    await transaction.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED", verifiedAt: new Date() } });
  });
  return true;
}
