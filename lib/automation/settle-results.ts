import "server-only";
import type { PrismaClient } from "@prisma/client";
import { getDatabase } from "@/lib/db/client";
import { settlePrediction } from "@/lib/results/settlement";

export type SettleSummary = {
  examined: number;
  won: number;
  lost: number;
  void: number;
  /** Finished fixtures whose market the engine would not grade. An admin settles these. */
  leftForReview: number;
};

/** The SportyBet market specifier stored on the fixture, e.g. "total=2.5". */
function specifierOf(providerData: unknown): string | null {
  if (typeof providerData !== "object" || providerData === null || Array.isArray(providerData)) return null;
  const value = (providerData as Record<string, unknown>).specifier;
  return typeof value === "string" ? value : null;
}

/**
 * Grades every published, still-pending pick whose fixture has finished or been
 * cancelled, using the rules in lib/results/settlement.
 *
 * Each grade is written together with its audit row, and only onto a pick that
 * is still PENDING at that moment. A result an admin entered while the job was
 * running is therefore never overwritten.
 */
export async function settleFinishedPredictions(database: PrismaClient = getDatabase(), limit = 500): Promise<SettleSummary> {
  const pending = await database.prediction.findMany({
    where: { status: "PUBLISHED", result: "PENDING", fixture: { status: { in: ["FINISHED", "CANCELLED"] } } },
    select: {
      id: true,
      market: true,
      selection: true,
      sourceData: true,
      fixture: {
        select: {
          status: true,
          homeScore: true,
          awayScore: true,
          providerData: true,
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const summary: SettleSummary = { examined: pending.length, won: 0, lost: 0, void: 0, leftForReview: 0 };

  for (const prediction of pending) {
    const { fixture } = prediction;
    const decision = settlePrediction({
      market: prediction.market,
      selection: prediction.selection,
      fixtureStatus: fixture.status,
      homeScore: fixture.homeScore,
      awayScore: fixture.awayScore,
      homeTeam: fixture.homeTeam.name,
      awayTeam: fixture.awayTeam.name,
      specifier: specifierOf(prediction.sourceData),
    });

    if (!decision) {
      summary.leftForReview += 1;
      continue;
    }

    const applied = await database.$transaction(async (transaction) => {
      const updated = await transaction.prediction.updateMany({
        where: { id: prediction.id, result: "PENDING" },
        data: { result: decision.grade },
      });
      if (updated.count === 0) return false;
      await transaction.auditLog.create({
        data: {
          actorId: null,
          action: "PREDICTION_AUTO_SETTLED",
          entityType: "Prediction",
          entityId: prediction.id,
          metadata: {
            grade: decision.grade,
            rule: decision.rule,
            fixtureStatus: fixture.status,
            score: fixture.homeScore === null || fixture.awayScore === null ? null : `${fixture.homeScore}-${fixture.awayScore}`,
          },
        },
      });
      return true;
    });

    if (!applied) continue;
    if (decision.grade === "WON") summary.won += 1;
    else if (decision.grade === "LOST") summary.lost += 1;
    else summary.void += 1;
  }

  return summary;
}
