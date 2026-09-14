import type { SportSlug, TipGrade } from "@/lib/domain/tips";

/**
 * Graded performance, per development guide §14.6.
 *
 * Two rules govern everything here. Losses stay as visible as wins — nothing in
 * this module may filter them out. And a win rate is meaningless without its
 * sample, so `winRate` never travels without `settled`.
 */

export type PerformanceRange = "today" | "7d" | "30d" | "all";

export const PERFORMANCE_RANGE_LABEL: Record<PerformanceRange, string> = {
  today: "Today",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  all: "All Time",
};

export interface PerformanceSummary {
  readonly range: PerformanceRange;
  /** Settled tips only. Pending tips are excluded from every figure here. */
  readonly settled: number;
  readonly won: number;
  readonly lost: number;
  readonly voided: number;
  /** 0-1, derived. Undefined rather than zero when nothing has settled. */
  readonly winRate: number | null;
  /**
   * Profit or loss in units, to one decimal place.
   *
   * Null until the staking assumption is signed off (§22) — the product must
   * not publish a units figure whose calculation it cannot disclose. Renderers
   * must handle null by omitting the figure, not by printing 0.
   */
  readonly units: number | null;
}

/** One point on the performance trend chart. */
export interface PerformancePoint {
  /** UTC ISO date, no time component. */
  readonly date: string;
  readonly units: number;
  readonly settled: number;
  readonly won: number;
}

export interface SportBreakdown {
  readonly sport: SportSlug;
  readonly won: number;
  readonly settled: number;
}

/** A graded tip as the results list renders it. */
export interface GradedTipRow {
  readonly id: string;
  readonly slug: string;
  readonly sport: SportSlug;
  readonly competition: string;
  readonly fixture: string;
  readonly market: string;
  readonly odds: number | null;
  readonly grade: TipGrade;
  readonly finalScore: string | null;
  readonly settledAt: string;
}

export function winRateOf(won: number, settled: number): number | null {
  return settled > 0 ? won / settled : null;
}

/** Whole-percent win rate for display, or null when there is no sample. */
export function winRatePercent(winRate: number | null): number | null {
  return winRate === null ? null : Math.round(winRate * 100);
}

/** Signed units, e.g. "+12.5" / "-3.2". Null stays null — never rendered as 0. */
export function formatUnits(units: number | null): string | null {
  if (units === null) return null;
  return `${units > 0 ? "+" : ""}${units.toFixed(2)}`;
}
