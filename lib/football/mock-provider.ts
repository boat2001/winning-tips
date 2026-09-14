import { toDateKey } from "@/lib/football/dates";
import type { FootballProvider } from "@/lib/football/provider";
import type { FixtureInput, FixtureResultInput } from "@/lib/football/types";

const leagues = {
  premierLeague: {
    externalId: "mock-league-premier",
    name: "Premier League",
    country: "England",
  },
  laLiga: {
    externalId: "mock-league-laliga",
    name: "La Liga",
    country: "Spain",
  },
  championsLeague: {
    externalId: "mock-league-champions",
    name: "Champions League",
    country: "Europe",
  },
} as const;

const teams = {
  arsenal: { externalId: "mock-team-arsenal", name: "Arsenal", shortName: "ARS", country: "England" },
  chelsea: { externalId: "mock-team-chelsea", name: "Chelsea", shortName: "CHE", country: "England" },
  liverpool: { externalId: "mock-team-liverpool", name: "Liverpool", shortName: "LIV", country: "England" },
  newcastle: { externalId: "mock-team-newcastle", name: "Newcastle United", shortName: "NEW", country: "England" },
  barcelona: { externalId: "mock-team-barcelona", name: "Barcelona", shortName: "BAR", country: "Spain" },
  sevilla: { externalId: "mock-team-sevilla", name: "Sevilla", shortName: "SEV", country: "Spain" },
  inter: { externalId: "mock-team-inter", name: "Inter", shortName: "INT", country: "Italy" },
  dortmund: { externalId: "mock-team-dortmund", name: "Borussia Dortmund", shortName: "BVB", country: "Germany" },
} as const;

function getStatus(date: string) {
  const today = toDateKey(new Date());
  return date < today ? "FINISHED" : "SCHEDULED";
}

function createFixtures(date: string): FixtureInput[] {
  const status = getStatus(date);
  const settled = status === "FINISHED";
  const fixtures = [
    ["pl-ars-che", leagues.premierLeague, teams.arsenal, teams.chelsea, "14:00:00", "Emirates Stadium", 2, 1],
    ["pl-liv-new", leagues.premierLeague, teams.liverpool, teams.newcastle, "16:30:00", "Anfield", 1, 1],
    ["lal-bar-sev", leagues.laLiga, teams.barcelona, teams.sevilla, "19:00:00", "Estadi Olímpic", 3, 0],
    ["ucl-int-bvb", leagues.championsLeague, teams.inter, teams.dortmund, "20:00:00", "San Siro", 2, 2],
  ] as const;

  return fixtures.map(([id, league, homeTeam, awayTeam, time, venue, homeScore, awayScore]) => ({
    externalId: `mock-${date}-${id}`,
    league,
    homeTeam,
    awayTeam,
    kickoffAt: `${date}T${time}.000Z`,
    status,
    homeScore: settled ? homeScore : null,
    awayScore: settled ? awayScore : null,
    venue,
    provider: "mock",
    providerData: { source: "Winning Tips development fixture set" },
  }));
}

export class MockFootballProvider implements FootballProvider {
  async getFixturesByDate(date: string) {
    return createFixtures(date);
  }

  async getFixtureById(id: string) {
    const match = /^mock-(\d{4}-\d{2}-\d{2})-/.exec(id);
    return match ? createFixtures(match[1]).find((fixture) => fixture.externalId === id) ?? null : null;
  }

  async getResultsByDate(date: string): Promise<FixtureResultInput[]> {
    return createFixtures(date)
      .filter((fixture) => fixture.status === "FINISHED")
      .map(({ externalId, status, homeScore, awayScore }) => ({
        externalId,
        status,
        homeScore: homeScore ?? null,
        awayScore: awayScore ?? null,
      }));
  }
}

export function getFootballProvider(): FootballProvider {
  return new MockFootballProvider();
}
