import type { PublishedTip } from "@/lib/domain/tips";

/** DEVELOPMENT FIXTURE — see lib/fixtures/index.ts. Not production data. */

/**
 * Kick-off for today at a given Accra wall-clock time, as a UTC ISO string.
 *
 * Fixtures are generated relative to the current date rather than frozen, so
 * the "Today" sections keep reading correctly whenever the app is opened.
 * Accra is UTC+0 all year, so no offset table is needed here; anything that
 * needs a second timezone must go through Intl rather than extending this.
 */
function todayAt(time: `${number}:${number}`): string {
  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours, minutes, 0, 0),
  ).toISOString();
}

/** Odds captured a few minutes ago, so fixtures read as fresh rather than stale. */
function justCaptured(decimal: number, operatorName = "SportyBet") {
  return { decimal, capturedAt: new Date(Date.now() - 4 * 60_000).toISOString(), operatorName };
}

export const featuredTip: PublishedTip = {
  id: "fx-tip-featured",
  slug: "man-city-vs-arsenal-btts",
  sport: "football",
  competition: "Premier League",
  home: { name: "Man City", shortName: "MCI" },
  away: { name: "Arsenal", shortName: "ARS" },
  kickoffAt: todayAt("20:00"),
  market: "Both Teams to Score",
  selection: "Yes",
  modelProbability: 0.92,
  confidenceBand: "VERY_HIGH",
  dataQuality: 0.96,
  odds: justCaptured(1.65),
  status: "PUBLISHED",
  grade: null,
  finalScore: null,
  premium: false,
  savedByViewer: false,
  summary:
    "Both teams have scored in 8 of their last 10 meetings. Expect an open, high-intensity game.",
};

export const todaysTips: readonly PublishedTip[] = [
  {
    id: "fx-tip-1",
    slug: "real-madrid-vs-barcelona-over-25",
    sport: "football",
    competition: "La Liga",
    home: { name: "Real Madrid", shortName: "RMA" },
    away: { name: "Barcelona", shortName: "BAR" },
    kickoffAt: todayAt("21:00"),
    market: "Total Goals",
    selection: "Over 2.5 Goals",
    modelProbability: 0.88,
    confidenceBand: "HIGH",
    dataQuality: 0.94,
    odds: justCaptured(1.72),
    status: "PUBLISHED",
    grade: null,
    finalScore: null,
    premium: false,
    savedByViewer: false,
    summary: "Both sides average over three combined goals across their last six league fixtures.",
  },
  {
    id: "fx-tip-2",
    slug: "lakers-vs-nuggets-moneyline",
    sport: "basketball",
    competition: "NBA",
    home: { name: "Lakers", shortName: "LAL" },
    away: { name: "Nuggets", shortName: "DEN" },
    kickoffAt: todayAt("03:30"),
    market: "Moneyline",
    selection: "Lakers to Win",
    modelProbability: 0.85,
    confidenceBand: "HIGH",
    dataQuality: 0.91,
    odds: justCaptured(1.68),
    status: "PUBLISHED",
    grade: null,
    finalScore: null,
    premium: false,
    savedByViewer: false,
    summary: "Home rating advantage holds with both listed starters expected to play.",
  },
  {
    id: "fx-tip-3",
    slug: "djokovic-vs-alcaraz-match-winner",
    sport: "tennis",
    competition: "ATP Wimbledon",
    home: { name: "Djokovic" },
    away: { name: "Alcaraz" },
    kickoffAt: todayAt("15:00"),
    market: "Match Winner",
    selection: "Djokovic to Win",
    modelProbability: 0.82,
    confidenceBand: "HIGH",
    dataQuality: 0.89,
    odds: justCaptured(1.58),
    status: "PUBLISHED",
    grade: null,
    finalScore: null,
    premium: false,
    savedByViewer: false,
    summary: "Surface Elo and recent break-point conversion both favour the higher seed.",
  },
];

export const highConfidenceTips: readonly PublishedTip[] = [
  {
    id: "fx-tip-4",
    slug: "inter-vs-ac-milan-over-15",
    sport: "football",
    competition: "Serie A",
    home: { name: "Inter Milan", shortName: "INT" },
    away: { name: "AC Milan", shortName: "ACM" },
    kickoffAt: todayAt("19:45"),
    market: "Total Goals",
    selection: "Over 1.5 Goals",
    modelProbability: 0.9,
    confidenceBand: "VERY_HIGH",
    dataQuality: 0.95,
    odds: justCaptured(1.55),
    status: "PUBLISHED",
    grade: null,
    finalScore: null,
    premium: false,
    savedByViewer: true,
    summary: "Only one of the last twelve Milan derbies finished under two goals.",
  },
  {
    id: "fx-tip-5",
    slug: "celtics-vs-heat-moneyline",
    sport: "basketball",
    competition: "NBA",
    home: { name: "Celtics", shortName: "BOS" },
    away: { name: "Heat", shortName: "MIA" },
    kickoffAt: todayAt("01:00"),
    market: "Moneyline",
    selection: "Celtics to Win",
    modelProbability: 0.87,
    confidenceBand: "HIGH",
    dataQuality: 0.93,
    odds: justCaptured(1.66),
    status: "PUBLISHED",
    grade: null,
    finalScore: null,
    premium: false,
    savedByViewer: false,
    summary: "Rest advantage and a top-three defensive rating against a team on a back-to-back.",
  },
];

/**
 * The three picks the home hero leads with. Drawn from the same pool rather
 * than duplicated so a change to a tip cannot leave two screens disagreeing.
 */
export const topPicks: readonly PublishedTip[] = [
  featuredTip,
  {
    ...todaysTips[1]!,
    id: "fx-top-pick-2",
    market: "Total Points",
    selection: "Over 215.5 Points",
    modelProbability: 0.88,
    odds: justCaptured(1.72),
  },
  {
    ...todaysTips[2]!,
    id: "fx-top-pick-3",
    competition: "ATP Finals",
    selection: "Player A to Win",
    modelProbability: 0.85,
  },
];

/** Every fixture tip in one list, for slug lookups. */
export const allFixtureTips: readonly PublishedTip[] = [featuredTip, ...todaysTips, ...highConfidenceTips];

export function findFixtureTipBySlug(slug: string): PublishedTip | undefined {
  return allFixtureTips.find((tip) => tip.slug === slug);
}
