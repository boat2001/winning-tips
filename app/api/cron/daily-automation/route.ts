import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/automation/cron-auth";
import { sendDailyDigest } from "@/lib/automation/daily-digest";
import { publishScheduledPredictions } from "@/lib/automation/publish-scheduled";
import { recordRun } from "@/lib/automation/runs";
import { settleFinishedPredictions } from "@/lib/automation/settle-results";
import { expireResultsFromRouteHandler } from "@/lib/cache/invalidate";

export const runtime = "nodejs";

/**
 * The daily automation, run after the nightly fixture sync has brought in
 * final scores.
 *
 *   1. publish picks whose scheduled time has passed
 *   2. settle finished fixtures the engine can grade with certainty
 *   3. post the results and today's free card to Telegram
 *
 * Every step records its own run and fails on its own, so a Telegram outage
 * never stops results from settling. Steps run in this order because the digest
 * must report results that are already final.
 */
async function handleAutomation(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Automation is not configured." }, { status: 503 });
  }
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const publish = await recordRun("publish-scheduled", async () => ({
      status: "SUCCEEDED",
      summary: await publishScheduledPredictions(),
    }));

    const settle = await recordRun("settle-results", async () => ({
      status: "SUCCEEDED",
      summary: await settleFinishedPredictions(),
    }));

    const settled = settle.summary ? settle.summary.won + settle.summary.lost + settle.summary.void : 0;
    if ((publish.summary?.published ?? 0) > 0 || settled > 0) expireResultsFromRouteHandler();

    const digest = await recordRun("telegram-digest", async () => {
      const summary = await sendDailyDigest();
      return { status: summary.status === "skipped" ? "SKIPPED" : "SUCCEEDED", summary };
    });

    const runs = [publish, settle, digest];
    const failed = runs.filter((run) => run.status === "FAILED").length;
    return NextResponse.json(
      { ok: failed === 0, runs: runs.map(({ job, status, summary, error }) => ({ job, status, summary, error })) },
      { status: failed === runs.length ? 503 : 200 },
    );
  } catch (error) {
    // Reaching here means a run could not even be recorded, which almost always
    // means the automation_runs migration has not been applied.
    const message = error instanceof Error ? error.message : "Automation failed.";
    return NextResponse.json({ error: `Automation could not record its runs. Apply pending migrations. (${message})` }, { status: 500 });
  }
}

export const GET = handleAutomation;
export const POST = handleAutomation;
