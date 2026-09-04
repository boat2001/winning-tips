import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyHmacSha512 } from "@/lib/payments/signature";
import { verifiedPaymentMatches } from "@/lib/payments/validation";
import type { VerifiedPayment } from "@/lib/payments/provider";

const verified: VerifiedPayment = { reference: "td_ref", providerReference: "123", status: "success", amountMinor: 2000, currency: "GHS", customerEmail: "fan@example.com", gatewayResponse: "Successful", paidAt: new Date(), raw: {} };

describe("payment security", () => {
  it("verifies Paystack-compatible SHA-512 signatures without trusting the payload alone", () => {
    const body = JSON.stringify({ event: "charge.success", data: { reference: "td_ref" } });
    const signature = createHmac("sha512", "secret").update(body).digest("hex");
    expect(verifyHmacSha512(body, signature, "secret")).toBe(true);
    expect(verifyHmacSha512(`${body}x`, signature, "secret")).toBe(false);
    expect(verifyHmacSha512(body, "bad", "secret")).toBe(false);
  });

  it("requires an exact reference, amount, currency, email and success status", () => {
    const expected = { reference: "td_ref", amountMinor: 2000, currency: "GHS", email: "fan@example.com" };
    expect(verifiedPaymentMatches(expected, verified)).toBe(true);
    expect(verifiedPaymentMatches({ ...expected, amountMinor: 1999 }, verified)).toBe(false);
    expect(verifiedPaymentMatches(expected, { ...verified, status: "failed" })).toBe(false);
    expect(verifiedPaymentMatches(expected, { ...verified, customerEmail: "other@example.com" })).toBe(false);
  });
});
