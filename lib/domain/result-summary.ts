import type { PublishedTip } from "./tips";
import type { PerformanceRange, PerformanceSummary, GradedTipRow } from "./performance";

export function resultsForRange(tips: readonly PublishedTip[], range: PerformanceRange, now = new Date()) {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  if (range === "7d") start.setUTCDate(start.getUTCDate() - 6);
  if (range === "30d") start.setUTCDate(start.getUTCDate() - 29);
  return tips.filter(tip => tip.grade !== null && new Date(tip.kickoffAt) <= now && (range === "all" || new Date(tip.kickoffAt) >= start));
}

export function summarizeResults(tips: readonly PublishedTip[], range: PerformanceRange): PerformanceSummary {
  const won = tips.filter(t => t.grade === "WON").length;
  const lost = tips.filter(t => t.grade === "LOST").length;
  const voided = tips.filter(t => t.grade === "VOID" || t.grade === "PUSH").length;
  return { range, won, lost, voided, settled: won + lost + voided, winRate: won + lost ? won / (won + lost) : null, units: null };
}

export function toResultRows(tips: readonly PublishedTip[]): GradedTipRow[] {
  return tips.flatMap(t => t.grade ? [{ id: t.id, slug: t.slug, sport: t.sport, competition: t.competition, fixture: `${t.home.name} vs ${t.away.name}`, market: t.selection, odds: null, grade: t.grade, finalScore: t.finalScore, settledAt: t.kickoffAt }] : []);
}

export function dailyForm(tips: readonly PublishedTip[], now = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now); date.setUTCDate(date.getUTCDate() - 6 + i);
    const key = date.toISOString().slice(0, 10);
    const rows = tips.filter(t => t.kickoffAt.slice(0, 10) === key);
    return { day: new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(date), won: rows.filter(t => t.grade === "WON").length, lost: rows.filter(t => t.grade === "LOST").length };
  });
}
