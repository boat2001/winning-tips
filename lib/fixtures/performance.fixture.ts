import type {
  GradedTipRow,
  PerformancePoint,
  PerformanceRange,
  PerformanceSummary,
  SportBreakdown,
} from "@/lib/domain/performance";

/** DEVELOPMENT FIXTURE — see lib/fixtures/index.ts. Not production data. */

/** `daysAgo(0)` is today, at midnight UTC. */
function daysAgo(days: number): string {
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function settledAt(days: number, time: `${number}:${number}`): string {
  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours, minutes));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

export const performanceSummaries: Record<PerformanceRange, PerformanceSummary> = {
  today: { range: "today", settled: 4, won: 3, lost: 1, voided: 0, winRate: 3 / 4, units: 2.36 },
  "7d": { range: "7d", settled: 18, won: 14, lost: 4, voided: 0, winRate: 14 / 18, units: 12.54 },
  "30d": { range: "30d", settled: 76, won: 57, lost: 18, voided: 1, winRate: 57 / 76, units: 41.8 },
  all: { range: "all", settled: 1284, won: 1001, lost: 265, voided: 18, winRate: 1001 / 1284, units: 287.6 },
};

export const weeklyTrend: readonly PerformancePoint[] = [
  { date: daysAgo(6), units: 0, settled: 2, won: 1 },
  { date: daysAgo(5), units: 2.6, settled: 3, won: 3 },
  { date: daysAgo(4), units: 0.4, settled: 2, won: 1 },
  { date: daysAgo(3), units: -1.8, settled: 3, won: 1 },
  { date: daysAgo(2), units: 1.9, settled: 2, won: 2 },
  { date: daysAgo(1), units: 2.9, settled: 3, won: 3 },
  { date: daysAgo(0), units: 5.4, settled: 3, won: 3 },
];

/**
 * The seven-bar strip on the home and profile screens. Won and lost counts per
 * weekday, so the bar heights and their colours both come from data rather than
 * being drawn.
 */
export const recentFormBars: readonly { readonly day: string; readonly won: number; readonly lost: number }[] = [
  { day: "M", won: 2, lost: 0 },
  { day: "T", won: 3, lost: 0 },
  { day: "W", won: 0, lost: 1 },
  { day: "T", won: 2, lost: 0 },
  { day: "F", won: 3, lost: 0 },
  { day: "S", won: 0, lost: 2 },
  { day: "S", won: 3, lost: 0 },
];

export const recentGradedTips: readonly GradedTipRow[] = [
  {
    id: "fx-graded-1",
    slug: "man-city-vs-arsenal-btts",
    sport: "football",
    competition: "Premier League",
    fixture: "Man City vs Arsenal",
    market: "Both Teams to Score (Yes)",
    odds: 1.65,
    grade: "WON",
    finalScore: "2 - 2",
    settledAt: settledAt(0, "20:00"),
  },
  {
    id: "fx-graded-2",
    slug: "lakers-vs-nuggets-over-2155",
    sport: "basketball",
    competition: "NBA",
    fixture: "Lakers vs Nuggets",
    market: "Over 215.5 Points",
    odds: 1.72,
    grade: "LOST",
    finalScore: "102 - 110",
    settledAt: settledAt(0, "03:30"),
  },
  {
    id: "fx-graded-3",
    slug: "djokovic-vs-alcaraz-match-winner",
    sport: "tennis",
    competition: "ATP Finals",
    fixture: "Djokovic vs Alcaraz",
    market: "Player A to Win (Djokovic)",
    odds: 1.58,
    grade: "WON",
    finalScore: "3 - 1",
    settledAt: settledAt(1, "15:00"),
  },
  {
    id: "fx-graded-4",
    slug: "spain-vs-italy-match-winner",
    sport: "football",
    competition: "Euro 2024",
    fixture: "Spain vs Italy",
    market: "Spain to Win",
    odds: 1.9,
    grade: "WON",
    finalScore: "1 - 0",
    settledAt: settledAt(1, "20:00"),
  },
  {
    id: "fx-graded-5",
    slug: "celtics-vs-mavericks-over-2085",
    sport: "basketball",
    competition: "NBA",
    fixture: "Celtics vs Mavericks",
    market: "Over 208.5 Points",
    odds: 1.85,
    grade: "WON",
    finalScore: "115 - 106",
    settledAt: settledAt(2, "03:30"),
  },
];

export const sportBreakdowns: readonly SportBreakdown[] = [
  { sport: "football", won: 8, settled: 10 },
  { sport: "basketball", won: 4, settled: 6 },
  { sport: "tennis", won: 2, settled: 2 },
];

/**
 * The three figures the home hero leads with.
 *
 * Held as data rather than written into the hero component so the guide's
 * "never hardcode metrics in the component" rule (§13.3) holds, and so the
 * accuracy figure stays consistent with the performance summaries above rather
 * than drifting into a second, prettier number.
 */
export const homeHighlights = {
  accuracyRate: performanceSummaries.all.winRate,
  accuracyTrendLabel: "+12% this month",
  happyWinners: 1240,
  winningStreakDays: 7,
} as const;
