import type { ProviderFixtureStatus } from "@/lib/football/types";

/**
 * Automatic settlement: a final score plus a published pick → WON, LOST or VOID.
 *
 * This is the one place a result is decided without a human, so its rule is
 * simple and strict: grade only what can be graded with certainty from the
 * final score, and return null for everything else. A null leaves the pick
 * PENDING for an admin to settle by hand. A wrong automatic grade would put a
 * false result on the public record, which is worse than a late one.
 *
 * Markets arrive as free text from SportyBet slips ("1X2 & Over/Under 1.5" /
 * "Away & Over 1.5") and from editors ("Both Teams to Score" / "Yes"), so the
 * parser matches the common wordings of a small set of markets and refuses
 * anything it does not recognise, including half-time, corners, cards, handicaps
 * and player markets, none of which a full-time score can settle.
 *
 * Pure: no database, no clock. The settle job supplies the inputs.
 */

export type SettlementGrade = "WON" | "LOST" | "VOID";

export interface SettlementInput {
  market: string;
  selection: string;
  fixtureStatus: ProviderFixtureStatus;
  homeScore: number | null;
  awayScore: number | null;
  /** Team names, so "Lakers to Win" can be matched to a side. */
  homeTeam?: string | null;
  awayTeam?: string | null;
  /** SportyBet market specifier such as "total=2.5", when the slip carried one. */
  specifier?: string | null;
}

export interface SettlementDecision {
  grade: SettlementGrade;
  /** Which rule decided it, recorded in the audit log so a grade can be explained. */
  rule: string;
}

type Side = "home" | "draw" | "away";

const normalise = (text: string) => text.toLowerCase().replace(/[()]/g, " ").replace(/\s+/g, " ").trim();

/** Markets a full-time score cannot settle, refused before any other matching. */
const UNSETTLEABLE = /\b(half|1st|2nd|first|second|period|quarter|set\b|corner|card|booking|handicap|asian|player|scorer|goalscorer|exact|correct score|odd\/even|odd or even|interval|minute|penalt)/;

function sideOf(raw: string, input: SettlementInput): Side | null {
  const text = normalise(raw).replace(/\s+to win$/, "").replace(/\s+win$/, "");
  if (["home", "1", "w1", "home team"].includes(text)) return "home";
  if (["draw", "x", "tie"].includes(text)) return "draw";
  if (["away", "2", "w2", "away team"].includes(text)) return "away";
  if (input.homeTeam && text === normalise(input.homeTeam)) return "home";
  if (input.awayTeam && text === normalise(input.awayTeam)) return "away";
  return null;
}

function outcomeOf(home: number, away: number): Side {
  return home > away ? "home" : home < away ? "away" : "draw";
}

function totalLine(selection: string, specifier: string | null | undefined): { direction: "over" | "under"; line: number } | null {
  const text = normalise(selection);
  const explicit = /\b(over|under)\s*(\d+(?:\.\d+)?)\b/.exec(text);
  if (explicit) return { direction: explicit[1] as "over" | "under", line: Number(explicit[2]) };
  const bare = /^(over|under)$/.exec(text);
  const specified = specifier ? /total=(\d+(?:\.\d+)?)/.exec(specifier) : null;
  if (bare && specified) return { direction: bare[1] as "over" | "under", line: Number(specified[1]) };
  return null;
}

function gradeTotal(selection: string, specifier: string | null | undefined, total: number): SettlementGrade | null {
  const parsed = totalLine(selection, specifier);
  if (!parsed) return null;
  if (total === parsed.line) return "VOID";
  const over = total > parsed.line;
  return (parsed.direction === "over") === over ? "WON" : "LOST";
}

function gradeDoubleChance(selection: string, outcome: Side): SettlementGrade | null {
  const text = normalise(selection);
  const compact: Record<string, Side[]> = { "1x": ["home", "draw"], x2: ["draw", "away"], "12": ["home", "away"] };
  let sides = compact[text.replace(/[\s/|-]/g, "")] ?? null;
  if (!sides) {
    const parts = text.split(/\s+or\s+|\s*\/\s*|\s*\|\s*/).map((part) => sideOf(part, { market: "", selection: "", fixtureStatus: "FINISHED", homeScore: 0, awayScore: 0 }));
    if (parts.length === 2 && parts[0] && parts[1] && parts[0] !== parts[1]) sides = [parts[0], parts[1]];
  }
  if (!sides) return null;
  return sides.includes(outcome) ? "WON" : "LOST";
}

function gradeBothTeamsToScore(selection: string, home: number, away: number): SettlementGrade | null {
  const text = normalise(selection);
  const both = home > 0 && away > 0;
  if (["yes", "gg", "both teams to score"].includes(text)) return both ? "WON" : "LOST";
  if (["no", "ng", "no goal"].includes(text)) return both ? "LOST" : "WON";
  return null;
}

/**
 * Whether this market and selection are ones the engine can grade from a final
 * score. Used to screen incoming slips: a leg nothing can settle automatically
 * either sits PENDING until someone remembers it, or gets a hand-typed result —
 * neither belongs on a card sold on the strength of its public record.
 *
 * Decided by running the real rules against two synthetic final scores rather
 * than by a second copy of the market list, which would drift the first time a
 * rule changed. A market that grades under neither score is one we cannot grade.
 */
export function canAutoSettle(input: Pick<SettlementInput, "market" | "selection" | "specifier" | "homeTeam" | "awayTeam">): boolean {
  const probes: Array<Pick<SettlementInput, "homeScore" | "awayScore">> = [
    { homeScore: 1, awayScore: 0 },
    { homeScore: 2, awayScore: 2 },
  ];
  return probes.some((scores) => settlePrediction({ ...input, ...scores, fixtureStatus: "FINISHED" }) !== null);
}

export function settlePrediction(input: SettlementInput): SettlementDecision | null {
  if (input.fixtureStatus === "CANCELLED") return { grade: "VOID", rule: "fixture-cancelled" };
  if (input.fixtureStatus !== "FINISHED") return null;
  const { homeScore: home, awayScore: away } = input;
  if (home === null || away === null) return null;

  const market = normalise(input.market);
  const selection = input.selection;
  if (UNSETTLEABLE.test(market) || UNSETTLEABLE.test(normalise(selection))) return null;

  const outcome = outcomeOf(home, away);
  const total = home + away;

  if (/double chance/.test(market)) {
    const grade = gradeDoubleChance(selection, outcome);
    return grade ? { grade, rule: "double-chance" } : null;
  }

  if (/draw no bet|\bdnb\b/.test(market)) {
    const side = sideOf(selection, input);
    if (side !== "home" && side !== "away") return null;
    if (outcome === "draw") return { grade: "VOID", rule: "draw-no-bet" };
    return { grade: side === outcome ? "WON" : "LOST", rule: "draw-no-bet" };
  }

  if (/gg\/ng|gg-ng|both teams to score|\bbtts\b/.test(market)) {
    const grade = gradeBothTeamsToScore(selection, home, away);
    return grade ? { grade, rule: "both-teams-to-score" } : null;
  }

  // "1X2 & Over/Under 1.5" with "Away & Over 1.5": every leg must win. A push
  // inside a combination is left for a human rather than guessed at.
  if (/1x2/.test(market) && /over\/under|total/.test(market)) {
    const [sidePart, totalPart] = selection.split("&").map((part) => part.trim());
    if (!sidePart || !totalPart) return null;
    const side = sideOf(sidePart, input);
    const totalGrade = gradeTotal(totalPart, input.specifier, total);
    if (!side || !totalGrade || totalGrade === "VOID") return null;
    return { grade: side === outcome && totalGrade === "WON" ? "WON" : "LOST", rule: "result-and-total" };
  }

  if (/1x2|match result|full ?time result|\bft result\b|3way/.test(market)) {
    const side = sideOf(selection, input);
    return side ? { grade: side === outcome ? "WON" : "LOST", rule: "match-result" } : null;
  }

  if (/over\/under|\btotal\b|\bgoals\b|\bpoints\b/.test(market)) {
    const grade = gradeTotal(selection, input.specifier, total);
    return grade ? { grade, rule: "total" } : null;
  }

  // Two-way winner markets (basketball moneyline, tennis match winner) and
  // editor wording such as "Lakers to Win". A two-way market cannot end level,
  // so a level final score means the feed is incomplete and is left alone.
  if (/winner|moneyline|money line|home\/away|to win|match winner|sportybet selection/.test(market) || /\bto win$/.test(normalise(selection))) {
    const side = sideOf(selection, input);
    if (side !== "home" && side !== "away") return null;
    if (outcome === "draw") return null;
    return { grade: side === outcome ? "WON" : "LOST", rule: "winner" };
  }

  return null;
}
