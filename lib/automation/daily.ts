import "server-only";
import { sendDailyDigest } from "@/lib/automation/daily-digest";
import { publishScheduledPredictions } from "@/lib/automation/publish-scheduled";
import { recordRun } from "@/lib/automation/runs";
import { settleFinishedPredictions } from "@/lib/automation/settle-results";

export type DailyRunReport = {
  job: string;
  status: string;
  summary?: unknown;
  error?: string;
};

export type DailyAutomationResult = {
  runs: DailyRunReport[];
  /** Whether published or settled data changed, so the caller expires its caches. */
  resultsChanged: boolean;
  failed: number;
};

/**
 * The nightly sequence, shared by the 02:30 cron and the admin panel's "Run
 * tonight's automation" button so both do exactly the same thing:
 *
 *   1. publish picks whose scheduled time has passed
 *   2. settle finished fixtures the engine can grade with certainty
 *   3. post the results and today's free card to Telegram
 *
 * Every step records its own run and fails on its own, so a Telegram outage
 * never stops results from settling. The digest runs last because it must report
 * results that are already final.
 *
 * Cache expiry is left to the caller: a route handler and a server action are
 * allowed different revalidation calls.
 */
export async function runDailyAutomation(): Promise<DailyAutomationResult> {
  const publish = await recordRun("publish-scheduled", async () => ({
    status: "SUCCEEDED",
    summary: await publishScheduledPredictions(),
  }));

  const settle = await recordRun("settle-results", async () => ({
    status: "SUCCEEDED",
    summary: await settleFinishedPredictions(),
  }));

  const settled = settle.summary ? settle.summary.won + settle.summary.lost + settle.summary.void : 0;

  const digest = await recordRun("telegram-digest", async () => {
    const summary = await sendDailyDigest();
    return { status: summary.status === "skipped" ? "SKIPPED" : "SUCCEEDED", summary };
  });

  const runs: DailyRunReport[] = [publish, settle, digest].map(({ job, status, summary, error }) => ({ job, status, summary, error }));

  return {
    runs,
    resultsChanged: (publish.summary?.published ?? 0) > 0 || settled > 0,
    failed: runs.filter((run) => run.status === "FAILED").length,
  };
}
