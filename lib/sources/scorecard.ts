import { wilsonLowerBound, winRateOf } from "@/lib/domain/performance";

/**
 * What a source's slips have actually done, from our own settled record.
 *
 * This is the only honest basis for trusting a source: not its claims, and not
 * an editor's confidence, but the graded outcome of what it sent us before.
 * Every figure here carries its sample, and a record too small to judge reports
 * a null bound rather than a flattering percentage.
 *
 * Pure: the caller supplies rows from the database.
 */
export type SettledGrade = "WON" | "LOST" | "VOID";

export interface SettledLeg {
  readonly source: string;
  readonly market: string;
  readonly odds: number;
  readonly grade: SettledGrade;
}

export interface RecordSummary {
  /** Wins and losses only: a void stakes nothing and decides nothing. */
  readonly settled: number;
  readonly won: number;
  readonly lost: number;
  readonly voided: number;
  readonly winRate: number | null;
  readonly lowerBound: number | null;
}

export interface SourceThresholds {
  /** Below this, the record is too small to judge and the slip waits for review. */
  readonly minSettled: number;
  readonly minLowerBound: number;
}

export const defaultSourceThresholds: SourceThresholds = {
  minSettled: 30,
  minLowerBound: 0.5,
};

export function summariseRecord(legs: readonly SettledLeg[]): RecordSummary {
  const won = legs.filter((leg) => leg.grade === "WON").length;
  const lost = legs.filter((leg) => leg.grade === "LOST").length;
  const voided = legs.filter((leg) => leg.grade === "VOID").length;
  const settled = won + lost;

  return { settled, won, lost, voided, winRate: winRateOf(won, settled), lowerBound: wilsonLowerBound(won, settled) };
}

export function summariseBySource(legs: readonly SettledLeg[]): Map<string, RecordSummary> {
  return groupSummary(legs, (leg) => leg.source);
}

export function summariseByMarket(legs: readonly SettledLeg[]): Map<string, RecordSummary> {
  return groupSummary(legs, (leg) => leg.market.trim().toLowerCase());
}

function groupSummary(legs: readonly SettledLeg[], keyOf: (leg: SettledLeg) => string): Map<string, RecordSummary> {
  const groups = new Map<string, SettledLeg[]>();
  for (const leg of legs) {
    const key = keyOf(leg);
    const bucket = groups.get(key);
    if (bucket) bucket.push(leg);
    else groups.set(key, [leg]);
  }
  return new Map([...groups].map(([key, rows]) => [key, summariseRecord(rows)]));
}

export interface TrustVerdict {
  readonly trusted: boolean;
  /** Plain reason, shown beside the slip in the review queue. */
  readonly reason: string;
}

/**
 * Whether a source has earned automatic publication. Anything short of the bar
 * is not rejected — it waits for a human in the review queue.
 */
export function judgeSource(summary: RecordSummary, thresholds: SourceThresholds = defaultSourceThresholds): TrustVerdict {
  if (summary.settled < thresholds.minSettled) {
    return { trusted: false, reason: `Only ${summary.settled} settled picks; ${thresholds.minSettled} needed before automatic publishing.` };
  }
  if (summary.lowerBound === null || summary.lowerBound < thresholds.minLowerBound) {
    const bound = summary.lowerBound === null ? "—" : `${Math.round(summary.lowerBound * 100)}%`;
    return { trusted: false, reason: `Record's lower bound is ${bound}, under the ${Math.round(thresholds.minLowerBound * 100)}% bar.` };
  }
  return { trusted: true, reason: `${summary.won}/${summary.settled} settled, lower bound ${Math.round(summary.lowerBound * 100)}%.` };
}
