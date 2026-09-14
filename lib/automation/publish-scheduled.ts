import "server-only";
import type { PrismaClient } from "@prisma/client";
import { getDatabase } from "@/lib/db/client";

export type PublishSummary = { published: number };

/**
 * Publishes every pick an editor scheduled for a time that has now passed.
 *
 * The SCHEDULED status and publish time already existed in the admin form;
 * nothing ever acted on them, so a scheduled pick stayed invisible forever.
 */
export async function publishScheduledPredictions(database: PrismaClient = getDatabase(), now: Date = new Date()): Promise<PublishSummary> {
  const result = await database.prediction.updateMany({
    where: { status: "SCHEDULED", publishAt: { lte: now }, fixture: { kickoffAt: { gt: now }, status: "SCHEDULED", provider: { not: "mock" } }, OR: [{ bookingId: null }, { booking: { isActive: true, deletedAt: null } }] },
    data: { status: "PUBLISHED" },
  });
  return { published: result.count };
}
