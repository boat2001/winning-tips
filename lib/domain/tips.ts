/**
 * The published-tip domain, per development guide §8.
 *
 * This is the *new* prediction system. The VIP-slip / deck domain in
 * lib/predictions and lib/vip is the existing one and stays untouched — both
 * run side by side during the transition, so anything ambiguous should say
 * which it means. See docs/design-decisions.md.
 *
 * These types are the contract between the screens and their data source. The
 * fixtures in lib/fixtures satisfy them today; Prisma-backed queries will
 * satisfy them later without any screen changing.
 */

export type SportSlug = "football" | "basketball" | "tennis";

/**
 * Model strength, not certainty. The product must never render HIGH as
 * "sure win" (§8) — the copy helpers below are the only approved labels.
 */
export type ConfidenceBand = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "AVOID";

export type TipStatus = "PUBLISHED" | "SUSPENDED" | "GRADED";

/**
 * The database stores a sport per league as an enum; the screens use a slug.
 * Anything unrecognised falls back to football, which is what every row that
 * predates the column actually is.
 */
export function toSportSlug(value: string | null | undefined): SportSlug {
  const slug = (value ?? "").toLowerCase();
  return slug === "basketball" || slug === "tennis" ? slug : "football";
}

export type TipGrade = "WON" | "LOST" | "VOID" | "PUSH";

export interface Participant {
  readonly name: string;
  /** Three-letter code where a provider supplies one; used on narrow screens. */
  readonly shortName?: string;
}

/**
 * Decimal odds captured from one operator at a point in time.
 *
 * Never rendered as a live or guaranteed price. If `capturedAt` is older than
 * the freshness threshold the UI must hide the number and say
 * "Open bookmaker to see current odds" (§6).
 */
export interface OddsSnapshot {
  readonly decimal: number;
  readonly capturedAt: string;
  readonly operatorName: string;
}

export interface PublishedTip {
  readonly id: string;
  readonly slug: string;
  readonly sport: SportSlug;
  readonly competition: string;
  readonly home: Participant;
  readonly away: Participant;
  /** UTC ISO 8601. Rendered in the country's timezone, never stored local (§4). */
  readonly kickoffAt: string;
  readonly market: string;
  readonly selection: string;
  /** 0-1. The model's probability, not the market's. */
  readonly modelProbability: number | null;
  readonly confidenceBand: ConfidenceBand | null;
  /** 0-1. Low quality suppresses a tip rather than publishing it quietly. */
  readonly dataQuality: number | null;
  readonly locked?: boolean;
  readonly updatedAt?: string;
  readonly modelVersion?: string | null;
  readonly odds: OddsSnapshot | null;
  readonly status: TipStatus;
  /** Present only once status is GRADED. */
  readonly grade: TipGrade | null;
  /** Final score as shown on the results screen, e.g. "2 - 2". */
  readonly finalScore: string | null;
  readonly premium: boolean;
  readonly savedByViewer: boolean;
  /** One-sentence model explanation. Traceable to factors; never invented (§9). */
  readonly summary: string | null;
}

/** How long a captured price may be shown before it is treated as stale (§6). */
export const ODDS_FRESHNESS_MINUTES = 15;

export function isOddsStale(snapshot: OddsSnapshot, now: Date = new Date()): boolean {
  const ageMinutes = (now.getTime() - new Date(snapshot.capturedAt).getTime()) / 60_000;
  return !Number.isFinite(ageMinutes) || ageMinutes < 0 || ageMinutes > ODDS_FRESHNESS_MINUTES;
}

/**
 * Approved band labels. Deliberately descriptive of the model rather than of the
 * outcome: "Very high" describes the signal, "sure thing" would describe a
 * result the product cannot promise.
 */
const CONFIDENCE_LABEL: Record<ConfidenceBand, string> = {
  VERY_HIGH: "Very high confidence",
  HIGH: "High confidence",
  MEDIUM: "Medium confidence",
  LOW: "Low confidence",
  AVOID: "Not recommended",
};

export function confidenceLabel(band: ConfidenceBand | null): string {
  return band ? CONFIDENCE_LABEL[band] : "Not model-rated";
}

/** Bands that qualify for the "High Confidence" filters and sections. */
export function isHighConfidence(band: ConfidenceBand | null): boolean {
  return band === "VERY_HIGH" || band === "HIGH";
}

const GRADE_LABEL: Record<TipGrade, string> = {
  WON: "Won",
  LOST: "Lost",
  VOID: "Void",
  PUSH: "Push",
};

export function gradeLabel(grade: TipGrade): string {
  return GRADE_LABEL[grade];
}

/** Probability as a whole percentage, for display. */
export function probabilityPercent(probability: number): number {
  return Math.round(probability * 100);
}

/**
 * Selections that mean nothing without their market. "Yes" on its own is not a
 * prediction; "Both Teams to Score: Yes" is. Anything longer ("Over 2.5 Goals",
 * "Lakers to Win") already names what it is predicting.
 */
const MARKET_DEPENDENT_SELECTION = /^(yes|no|draw|home|away|1|x|2|1x|x2|12|odd|even)$/i;

/** The one-line pick as a row shows it when there is no room for a market column. */
export function pickText(tip: Pick<PublishedTip, "market" | "selection">): string {
  const selection = tip.selection.trim();
  return MARKET_DEPENDENT_SELECTION.test(selection) ? `${tip.market}: ${selection}` : selection;
}
