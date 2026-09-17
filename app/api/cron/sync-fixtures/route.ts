import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/automation/cron-auth";
import { clampSyncDays, runFixtureSync } from "@/lib/automation/sync-run";

export const runtime = "nodejs";

/**
 * Nightly fixture and score sync.
 *
 * The work lives in lib/automation/sync-run.ts, shared with the admin panel's
 * "Sync fixtures now" button. The run answers 503 only when a configured feed
 * broke and nothing synced at all, so the scheduler flags a real outage rather
 * than a sport that was never enabled.
 *
 * The pause switch deliberately does not hold this job: fetching fixtures and
 * scores publishes nothing, and stale fixtures would only make a held night
 * harder to resume.
 */
async function handleSync(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Fixture sync is not configured." }, { status: 503 });
  }

  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const { dates, sports, synced, failed } = await runFixtureSync(clampSyncDays(url.searchParams.get("days")));
  const status = failed > 0 && synced === 0 ? 503 : 200;

  return NextResponse.json({ ok: failed === 0, dates, sports }, { status });
}

export const GET = handleSync;
export const POST = handleSync;
