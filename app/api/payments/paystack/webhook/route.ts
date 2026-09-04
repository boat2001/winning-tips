import { z } from "zod";
import { verifyPaystackSignature } from "@/lib/payments/paystack";
import { markPaymentRefunded, verifyAndFulfilPayment } from "@/lib/payments/service";

export const runtime = "nodejs";

const eventSchema = z.object({ event: z.string(), data: z.record(z.string(), z.unknown()) });
const maxWebhookBytes = 256_000;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maxWebhookBytes) return Response.json({ error: "Payload too large" }, { status: 413 });
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > maxWebhookBytes) return Response.json({ error: "Payload too large" }, { status: 413 });
  if (!verifyPaystackSignature(rawBody, request.headers.get("x-paystack-signature"))) return Response.json({ error: "Invalid signature" }, { status: 401 });
  let payload: unknown;
  try { payload = JSON.parse(rawBody); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = eventSchema.safeParse(payload);
  if (!parsed.success) return Response.json({ error: "Invalid event" }, { status: 400 });
  const data = parsed.data.data;
  if (parsed.data.event === "charge.success" && typeof data.reference === "string") await verifyAndFulfilPayment(data.reference);
  if (parsed.data.event === "refund.processed") {
    const reference = typeof data.transaction_reference === "string" ? data.transaction_reference : typeof data.reference === "string" ? data.reference : null;
    if (reference) await markPaymentRefunded(reference);
  }
  return Response.json({ received: true });
}
