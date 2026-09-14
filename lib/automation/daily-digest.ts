import "server-only";
import type { PrismaClient } from "@prisma/client";
import { getDatabase } from "@/lib/db/client";
import { launchCountry } from "@/lib/config/countries";
import { getSiteUrl } from "@/lib/config/site";
import { getFixtureDateWindows, getUtcDayRange } from "@/lib/football/dates";
import { formatDailyDigest, resolveTelegram, sendTelegramMessage } from "@/lib/messaging/telegram";

export type DigestSummary =
  | { status: "skipped"; reason: string }
  | { status: "sent"; won: number; lost: number; void: number; freeCardPublished: boolean };

/**
 * The morning Telegram post: yesterday's settled results and today's free card.
 *
 * Runs after settlement so the results it reports are final. Counts every
 * published pick that kicked off yesterday, free and VIP alike, because the
 * settled record is public either way and a digest that dropped VIP losses
 * would be the concealment the guide forbids.
 */
export async function sendDailyDigest(
  database: PrismaClient = getDatabase(),
  now: Date = new Date(),
  env: NodeJS.ProcessEnv = process.env,
): Promise<DigestSummary> {
  const telegram = resolveTelegram(env);
  if (!telegram) return { status: "skipped", reason: "TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are not both set." };

  const [yesterday, today] = getFixtureDateWindows(now);
  const yesterdayRange = getUtcDayRange(yesterday.date);
  const todayRange = getUtcDayRange(today.date);

  const [graded, freeCard] = await Promise.all([
    database.prediction.findMany({
      where: {
        status: "PUBLISHED",
        result: { not: "PENDING" },
        fixture: { kickoffAt: { gte: yesterdayRange.start, lt: yesterdayRange.end } },
      },
      select: { result: true },
    }),
    database.booking.findFirst({
      where: {
        category: "FREE",
        isActive: true,
        countryCode: launchCountry.countryCode,
        bookingDate: { gte: todayRange.start, lt: todayRange.end },
      },
      select: { platform: true, code: true, _count: { select: { predictions: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const won = graded.filter((row) => row.result === "WON").length;
  const lost = graded.filter((row) => row.result === "LOST").length;
  const voided = graded.length - won - lost;

  const text = formatDailyDigest({
    dateLabel: new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: launchCountry.timezone }).format(now),
    settled: { won, lost, void: voided },
    freeCard: freeCard ? { platform: freeCard.platform, code: freeCard.code, games: freeCard._count.predictions } : null,
    siteUrl: getSiteUrl().toString(),
  });

  await sendTelegramMessage(telegram, text);
  return { status: "sent", won, lost, void: voided, freeCardPublished: Boolean(freeCard) };
}
