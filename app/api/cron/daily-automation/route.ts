import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/automation/cron-auth";
import { isAutomationPaused } from "@/lib/automation/controls";
import { runDailyAutomation } from "@/lib/automation/daily";
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
 * The sequence itself lives in lib/automation/daily.ts, so the admin panel's
 * "Run tonight's automation" button and this schedule cannot drift apart.
 *
 * An admin can hold the schedule from the panel; a held night answers 200 with
 * `paused`, because a refusal would look like an outage to the scheduler.
 */
async function handleAutomation(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Automation is not configured." }, { status: 503 });
  }
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (await isAutomationPaused()) {
    return NextResponse.json({ ok: true, paused: true, runs: [] });
  }

  try {
    const { runs, resultsChanged, failed } = await runDailyAutomation();
    if (resultsChanged) expireResultsFromRouteHandler();

    return NextResponse.json({ ok: failed === 0, runs }, { status: failed === runs.length ? 503 : 200 });
  } catch (error) {
    // Reaching here means a run could not even be recorded, which almost always
    // means the automation_runs migration has not been applied.
    const message = error instanceof Error ? error.message : "Automation failed.";
    return NextResponse.json({ error: `Automation could not record its runs. Apply pending migrations. (${message})` }, { status: 500 });
  }
}

export const GET = handleAutomation;
export const POST = handleAutomation;
