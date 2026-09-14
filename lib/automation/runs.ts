import "server-only";
import type { AutomationStatus, Prisma, PrismaClient } from "@prisma/client";
import { getDatabase } from "@/lib/db/client";

export type RunOutcome<T extends Prisma.InputJsonValue> = {
  status: Exclude<AutomationStatus, "FAILED">;
  summary: T;
};

export type RunRecord<T> = {
  id: string;
  job: string;
  status: AutomationStatus;
  summary?: T;
  error?: string;
};

/**
 * Runs one job and records how it ended.
 *
 * The row is written as FAILED before the work starts and only moves to a
 * success state when the work returns. A run that crashes the process, or times
 * out on the platform, therefore stays FAILED with no finish time — which is
 * exactly what it was — instead of vanishing without a trace.
 */
export async function recordRun<T extends Prisma.InputJsonValue>(
  job: string,
  work: () => Promise<RunOutcome<T>>,
  database: PrismaClient = getDatabase(),
): Promise<RunRecord<T>> {
  const run = await database.automationRun.create({ data: { job, status: "FAILED" }, select: { id: true } });

  try {
    const outcome = await work();
    await database.automationRun.update({
      where: { id: run.id },
      data: { status: outcome.status, finishedAt: new Date(), summary: outcome.summary },
    });
    return { id: run.id, job, status: outcome.status, summary: outcome.summary };
  } catch (error) {
    const message = error instanceof Error ? error.message : "The job failed without a message.";
    await database.automationRun.update({
      where: { id: run.id },
      data: { status: "FAILED", finishedAt: new Date(), error: message.slice(0, 2000) },
    });
    return { id: run.id, job, status: "FAILED", error: message };
  }
}
