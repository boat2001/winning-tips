import { getUpcomingDateKeys } from "@/lib/football/dates";
import type { FootballProvider } from "@/lib/football/provider";
import {
  createPrismaFixtureRepository,
  type FixtureSyncRepository,
} from "@/lib/football/repository";

export interface FixtureSyncSummary {
  dates: string[];
  fixturesProcessed: number;
  leaguesProcessed: number;
  teamsProcessed: number;
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function syncFixturesForDates(
  provider: FootballProvider,
  dates: string[],
  repository: FixtureSyncRepository = createPrismaFixtureRepository(),
): Promise<FixtureSyncSummary> {
  const leagues = new Set<string>();
  const teams = new Set<string>();
  let fixturesProcessed = 0;

  for (const date of dates) {
    const fixtures = await provider.getFixturesByDate(date);

    for (const fixture of fixtures) {
      const kickoffAt = new Date(fixture.kickoffAt);
      if (Number.isNaN(kickoffAt.getTime())) {
        throw new Error(`Provider returned an invalid kickoff for ${fixture.externalId}.`);
      }

      const league = await repository.upsertLeague({
        ...fixture.league,
        slug: `${slugify(fixture.league.name)}-${slugify(fixture.league.externalId)}`,
      });
      const [homeTeam, awayTeam] = await Promise.all([
        repository.upsertTeam(fixture.homeTeam),
        repository.upsertTeam(fixture.awayTeam),
      ]);

      await repository.upsertFixture({
        externalId: fixture.externalId,
        leagueId: league.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        kickoffAt,
        status: fixture.status,
        homeScore: fixture.homeScore ?? null,
        awayScore: fixture.awayScore ?? null,
        venue: fixture.venue ?? null,
        provider: fixture.provider,
        providerData: fixture.providerData ?? undefined,
      });

      leagues.add(fixture.league.externalId);
      teams.add(fixture.homeTeam.externalId);
      teams.add(fixture.awayTeam.externalId);
      fixturesProcessed += 1;
    }
  }

  return {
    dates,
    fixturesProcessed,
    leaguesProcessed: leagues.size,
    teamsProcessed: teams.size,
  };
}

export function syncUpcomingFixtures(
  provider: FootballProvider,
  days = 3,
  reference = new Date(),
  repository?: FixtureSyncRepository,
) {
  return syncFixturesForDates(
    provider,
    getUpcomingDateKeys(days, reference),
    repository,
  );
}
