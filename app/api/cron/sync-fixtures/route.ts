import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getFixtureDateWindows, getUpcomingDateKeys } from "@/lib/football/dates";
import { resolveSportProvider } from "@/lib/football/provider-registry";
import { syncFixturesForDates } from "@/lib/football/sync";
import { PUBLISHED_SPORTS } from "@/lib/sports/sport";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const configuredSecret = process.env.CRON_SECRET;
  const suppliedSecret =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.headers.get("x-cron-secret") ??
    "";

  if (!configuredSecret || !suppliedSecret) return false;

  const configured = Buffer.from(configuredSecret);
  const supplied = Buffer.from(suppliedSecret);
  return configured.length === supplied.length && timingSafeEqual(configured, supplied);
}

type SportRun =
  | { sport: string; provider: string; status: "synced"; fixturesProcessed: number; leaguesProcessed: number; teamsProcessed: number }
  | { sport: string; provider: string; status: "skipped"; reason: string }
  | { sport: string; provider: string; status: "failed"; reason: string };

/**
 * Nightly fixture and score sync, one sport after another.
 *
 * Each sport resolves its own feed and fails on its own: a basketball quota
 * error must not cost the night's football. A sport switched off on purpose is
 * reported as skipped, not failed. The run answers 503 only when a configured
 * feed broke and nothing synced at all, so the scheduler flags a real outage
 * rather than a sport that was never enabled.
 */
async function handleSync(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Fixture sync is not configured." }, { status: 503 });
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const requestedDays = Number(url.searchParams.get("days") ?? "3");
  const days = Number.isInteger(requestedDays) ? Math.min(7, Math.max(1, requestedDays)) : 3;
  const yesterday = getFixtureDateWindows()[0].date;
  const dates = [yesterday, ...getUpcomingDateKeys(days)];

  const runs: SportRun[] = [];
  for (const sport of PUBLISHED_SPORTS) {
    // Resolved per request so a key added to the environment takes effect on
    // the next run without a redeploy.
    const resolved = resolveSportProvider(sport);
    if (!resolved.ok) {
      runs.push({ sport, provider: resolved.name, status: resolved.disabled ? "skipped" : "failed", reason: resolved.reason });
      continue;
    }
    try {
      const summary = await syncFixturesForDates(resolved.provider, dates);
      runs.push({
        sport,
        provider: resolved.name,
        status: "synced",
        fixturesProcessed: summary.fixturesProcessed,
        leaguesProcessed: summary.leaguesProcessed,
        teamsProcessed: summary.teamsProcessed,
      });
    } catch (error) {
      runs.push({ sport, provider: resolved.name, status: "failed", reason: error instanceof Error ? error.message : "Sync failed." });
    }
  }

  const failed = runs.filter((run) => run.status === "failed").length;
  const synced = runs.filter((run) => run.status === "synced").length;
  const status = failed > 0 && synced === 0 ? 503 : 200;

  return NextResponse.json({ ok: failed === 0, dates, sports: runs }, { status });
}

export const GET = handleSync;
export const POST = handleSync;
