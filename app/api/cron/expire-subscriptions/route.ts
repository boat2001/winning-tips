import { timingSafeEqual } from "node:crypto";
import { getDatabase } from "@/lib/db/client";

export const runtime = "nodejs";

function authorized(request: Request) {
  const configured = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? request.headers.get("x-cron-secret") ?? "";
  if (!configured || !supplied) return false;
  const left = Buffer.from(configured); const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

async function handleExpiration(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const [subscriptions, payments] = await Promise.all([
    getDatabase().subscription.updateMany({ where: { status: "ACTIVE", expiresAt: { lte: new Date() } }, data: { status: "EXPIRED" } }),
    getDatabase().payment.updateMany({ where: { status: "PENDING", createdAt: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, data: { status: "CANCELLED", gatewayResponse: "Checkout expired" } }),
  ]);
  return Response.json({ expiredSubscriptions: subscriptions.count, cancelledPayments: payments.count });
}

export const GET = handleExpiration;
export const POST = handleExpiration;
