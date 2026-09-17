import { canAutoSettle } from "@/lib/results/settlement";
import { sportFromName } from "@/lib/sports/sport";

/**
 * The quality bar an incoming slip has to clear.
 *
 * None of this predicts a winner — nothing can, before the matches are played.
 * It refuses legs we cannot sell honestly: ones that have effectively started,
 * ones priced outside the band a card is built from, and ones no rule can settle
 * from a final score, which would leave the public record depending on someone
 * remembering to type a result in.
 *
 * Pure: no database, no clock of its own. Callers pass `now`.
 */
export interface ScreenableLeg {
  readonly market: string;
  readonly selection: string;
  readonly odds: number;
  readonly kickoffAt: string | Date;
  readonly sport: string;
  readonly specifier?: string | null;
  readonly homeTeam?: string;
  readonly awayTeam?: string;
}

export interface ScreenRules {
  /** A leg this close to kick-off cannot be reviewed, priced and sold in time. */
  readonly minMinutesToKickoff: number;
  readonly minOdds: number;
  readonly maxOdds: number;
  readonly maxLegs: number;
  readonly requireAutoGradable: boolean;
}

export const defaultScreenRules: ScreenRules = {
  minMinutesToKickoff: 45,
  minOdds: 1.2,
  maxOdds: 3.5,
  maxLegs: 6,
  requireAutoGradable: true,
};

export type RejectionReason = "kickoff-too-soon" | "odds-out-of-band" | "unsupported-sport" | "not-auto-gradable" | "too-many-legs";

export interface LegVerdict {
  readonly leg: ScreenableLeg;
  readonly reason: RejectionReason;
  readonly detail: string;
}

export interface SlipVerdict {
  readonly accepted: ScreenableLeg[];
  readonly rejected: LegVerdict[];
  /** A slip is only sellable whole: one bad leg loses the ticket. */
  readonly sellable: boolean;
}

export function screenLeg(leg: ScreenableLeg, rules: ScreenRules = defaultScreenRules, now: Date = new Date()): LegVerdict | null {
  const kickoff = new Date(leg.kickoffAt);
  const minutesAway = (kickoff.getTime() - now.getTime()) / 60_000;

  if (!Number.isFinite(minutesAway) || minutesAway < rules.minMinutesToKickoff) {
    return { leg, reason: "kickoff-too-soon", detail: `Kicks off in ${Math.round(minutesAway)} min; ${rules.minMinutesToKickoff} min needed.` };
  }
  if (sportFromName(leg.sport) === null) {
    return { leg, reason: "unsupported-sport", detail: `${leg.sport} is not published here.` };
  }
  if (!(leg.odds >= rules.minOdds && leg.odds <= rules.maxOdds)) {
    return { leg, reason: "odds-out-of-band", detail: `Odds ${leg.odds.toFixed(2)} outside ${rules.minOdds}–${rules.maxOdds}.` };
  }
  if (rules.requireAutoGradable && !canAutoSettle({ market: leg.market, selection: leg.selection, specifier: leg.specifier ?? null, homeTeam: leg.homeTeam, awayTeam: leg.awayTeam })) {
    return { leg, reason: "not-auto-gradable", detail: `"${leg.market}" cannot be settled from a final score.` };
  }
  return null;
}

export function screenSlip(legs: readonly ScreenableLeg[], rules: ScreenRules = defaultScreenRules, now: Date = new Date()): SlipVerdict {
  const accepted: ScreenableLeg[] = [];
  const rejected: LegVerdict[] = [];

  for (const leg of legs) {
    const verdict = screenLeg(leg, rules, now);
    if (verdict) rejected.push(verdict);
    else accepted.push(leg);
  }

  if (legs.length > rules.maxLegs) {
    rejected.push({ leg: legs[0], reason: "too-many-legs", detail: `${legs.length} legs; at most ${rules.maxLegs} are sold.` });
  }

  return { accepted, rejected, sellable: rejected.length === 0 && accepted.length > 0 };
}
