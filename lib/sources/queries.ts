import "server-only";
import type { PrismaClient } from "@prisma/client";
import { getDatabase } from "@/lib/db/client";
import type { SettledLeg } from "@/lib/sources/scorecard";

/**
 * The settled record behind a source's score.
 *
 * Reads picks from cards that source supplied, whatever became of the card
 * afterwards — a hidden or deleted card still counts, so a losing week cannot
 * be tidied away to make a source look better than it was.
 */
export async function settledLegsForSource(source: string, database: PrismaClient = getDatabase()): Promise<SettledLeg[]> {
  const rows = await database.prediction.findMany({
    where: { result: { in: ["WON", "LOST", "VOID"] }, booking: { is: { source } } },
    select: { market: true, odds: true, result: true },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  return rows.map((row) => ({
    source,
    market: row.market,
    odds: Number(row.odds),
    grade: row.result as SettledLeg["grade"],
  }));
}

/** Cards collected from a source that are waiting for a human decision. */
export async function pendingReviewCards(database: PrismaClient = getDatabase()) {
  return database.booking.findMany({
    where: { reviewState: "PENDING_REVIEW", deletedAt: null },
    orderBy: [{ bookingDate: "desc" }, { createdAt: "desc" }],
    take: 50,
    select: {
      id: true,
      code: true,
      title: true,
      source: true,
      sourceUrl: true,
      totalOdds: true,
      bookingDate: true,
      deadline: true,
      createdAt: true,
      predictions: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          market: true,
          selection: true,
          odds: true,
          fixture: { select: { kickoffAt: true, homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } } },
        },
      },
    },
  });
}
