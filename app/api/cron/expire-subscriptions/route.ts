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
  // A card is bought for one day, so no access expires on a schedule. What does
  // need clearing is a checkout the member started and never completed.
  const payments = await getDatabase().payment.updateMany({
    where: { status: "PENDING", createdAt: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    data: { status: "CANCELLED", gatewayResponse: "Checkout expired" },
  });
  return Response.json({ cancelledPayments: payments.count });
}

export const GET = handleExpiration;
export const POST = handleExpiration;
