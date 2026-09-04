import "server-only";
import { z } from "zod";
import type { JsonObject } from "@/lib/football/types";
import type { InitializePaymentInput, PaymentProviderAdapter } from "@/lib/payments/provider";
import { verifyHmacSha512 } from "@/lib/payments/signature";

const initializeResponseSchema = z.object({ status: z.literal(true), data: z.object({ authorization_url: z.string().url().refine((value) => new URL(value).hostname === "checkout.paystack.com", "Unexpected checkout host."), access_code: z.string().min(1), reference: z.string().min(1) }) });
const verifyResponseSchema = z.object({ status: z.literal(true), data: z.object({ id: z.union([z.number(), z.string()]), status: z.string(), reference: z.string(), amount: z.number().int().nonnegative(), currency: z.string(), gateway_response: z.string().nullable().optional(), paid_at: z.string().nullable().optional(), customer: z.object({ email: z.string().email() }) }).passthrough() });

async function paystackRequest(path: string, init?: RequestInit) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Paystack is not configured.");
  const response = await fetch(`https://api.paystack.co${path}`, { ...init, headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json", ...init?.headers }, cache: "no-store", signal: AbortSignal.timeout(15_000) });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Paystack request failed with status ${response.status}.`);
  return body;
}

export class PaystackProvider implements PaymentProviderAdapter {
  async initialize(input: InitializePaymentInput) {
    const body = await paystackRequest("/transaction/initialize", { method: "POST", body: JSON.stringify({ email: input.email, amount: input.amountMinor, currency: input.currency, reference: input.reference, callback_url: input.callbackUrl, channels: ["card", "mobile_money"], metadata: input.metadata }) });
    const parsed = initializeResponseSchema.parse(body);
    return { authorizationUrl: parsed.data.authorization_url, accessCode: parsed.data.access_code, reference: parsed.data.reference };
  }

  async verify(reference: string) {
    const body = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
    const parsed = verifyResponseSchema.parse(body);
    const data = parsed.data;
    return { reference: data.reference, providerReference: String(data.id), status: data.status, amountMinor: data.amount, currency: data.currency.toUpperCase(), customerEmail: data.customer.email.toLowerCase(), gatewayResponse: data.gateway_response ?? null, paidAt: data.paid_at ? new Date(data.paid_at) : null, raw: JSON.parse(JSON.stringify(data)) as JsonObject };
  }
}

export function verifyPaystackSignature(rawBody: string, signature: string | null, secret = process.env.PAYSTACK_SECRET_KEY) {
  return verifyHmacSha512(rawBody, signature, secret);
}
