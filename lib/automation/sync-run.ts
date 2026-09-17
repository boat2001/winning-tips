import "server-only";
import { getFixtureDateWindows, getUpcomingDateKeys } from "@/lib/football/dates";
import { resolveSportProvider } from "@/lib/football/provider-registry";
import { syncFixturesForDates } from "@/lib/football/sync";
import { PUBLISHED_SPORTS } from "@/lib/sports/sport";

export type SportRun =
  | { sport: string; provider: string; status: "synced"; fixturesProcessed: number; leaguesProcessed: number; teamsProcessed: number }
  | { sport: string; provider: string; status: "skipped"; reason: string }
  | { sport: string; provider: string; status: "failed"; reason: string };

export type FixtureSyncResult = { dates: string[]; sports: SportRun[]; synced: number; failed: number };

/** Yesterday, for final scores, plus the days ahead a card can be built from. */
export function syncDates(days: number): string[] {
  return [getFixtureDateWindows()[0].date, ...getUpcomingDateKeys(days)];
}

export function clampSyncDays(requested: unknown, fallback = 3): number {
  const days = Number(requested ?? fallback);
  return Number.isInteger(days) ? Math.min(7, Math.max(1, days)) : fallback;
}

/**
 * Fixture and score sync, one sport after another. Shared by the 02:00 cron and
 * the admin panel's "Sync fixtures now" button.
 *
 * Each sport resolves its own feed and fails on its own: a basketball quota
 * error must not cost the night's football. A sport switched off on purpose is
 * reported as skipped, not failed.
 */
export async function runFixtureSync(days = 3): Promise<FixtureSyncResult> {
  const dates = syncDates(days);
  const sports: SportRun[] = [];

  for (const sport of PUBLISHED_SPORTS) {
    // Resolved per run so a key added to the environment takes effect on the
    // next run without a redeploy.
    const resolved = resolveSportProvider(sport);
    if (!resolved.ok) {
      sports.push({ sport, provider: resolved.name, status: resolved.disabled ? "skipped" : "failed", reason: resolved.reason });
      continue;
    }
    try {
      const summary = await syncFixturesForDates(resolved.provider, dates);
      sports.push({
        sport,
        provider: resolved.name,
        status: "synced",
        fixturesProcessed: summary.fixturesProcessed,
        leaguesProcessed: summary.leaguesProcessed,
        teamsProcessed: summary.teamsProcessed,
      });
    } catch (error) {
      sports.push({ sport, provider: resolved.name, status: "failed", reason: error instanceof Error ? error.message : "Sync failed." });
    }
  }

  return {
    dates,
    sports,
    synced: sports.filter((run) => run.status === "synced").length,
    failed: sports.filter((run) => run.status === "failed").length,
  };
}
