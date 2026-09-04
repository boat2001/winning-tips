import type { VerifiedPayment } from "@/lib/payments/provider";

export function verifiedPaymentMatches(expected: { reference: string; amountMinor: number; currency: string; email: string }, verified: VerifiedPayment) {
  return verified.status === "success" && verified.reference === expected.reference && verified.amountMinor === expected.amountMinor && verified.currency === expected.currency.toUpperCase() && verified.customerEmail === expected.email.toLowerCase();
}
