import "server-only";
import type { PrismaClient } from "@prisma/client";
import { automaticVipPrice, type VipCategory } from "@/lib/vip/pricing";

export async function getAutomaticVipPrice(database: PrismaClient, category: VipCategory, countryCode: string, now = new Date()) {
  // Include replaced/deleted cards so hiding a losing slip cannot raise prices.
  const cards = await database.booking.findMany({
    where: { category, countryCode, bookingDate: { gte: new Date(now.getTime() - 90 * 86_400_000), lt: now } },
    select: { createdAt: true, predictions: { select: { createdAt: true, publishAt: true, status: true, result: true, fixture: { select: { kickoffAt: true, provider: true } } } } },
    orderBy: { bookingDate: "desc" },
    take: 180,
  });
  let wins = 0;
  let settled = 0;
  for (const card of cards) {
    if (!card.predictions.length || card.predictions.some((p) =>
      p.fixture.provider === "mock" || p.status !== "PUBLISHED" || !p.publishAt ||
      p.publishAt >= p.fixture.kickoffAt || p.createdAt >= p.fixture.kickoffAt ||
      card.createdAt >= p.fixture.kickoffAt || p.fixture.kickoffAt >= now ||
      !["WON", "LOST"].includes(p.result))) continue;
    settled += 1;
    if (card.predictions.every((p) => p.result === "WON")) wins += 1;
  }
  return automaticVipPrice(category, wins, settled);
}
