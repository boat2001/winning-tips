import { getDatabase } from "@/lib/db/client";
import type { PrismaClient } from "@prisma/client";
import type {
  LeagueInput,
  ProviderFixtureStatus,
  TeamInput,
  JsonObject,
} from "@/lib/football/types";

export interface FixtureWriteInput {
  externalId: string;
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoffAt: Date;
  status: ProviderFixtureStatus;
  homeScore: number | null;
  awayScore: number | null;
  venue: string | null;
  provider: string;
  providerData?: JsonObject;
}

export interface FixtureSyncRepository {
  upsertLeague(input: LeagueInput & { slug: string }): Promise<{ id: string }>;
  upsertTeam(input: TeamInput): Promise<{ id: string }>;
  upsertFixture(input: FixtureWriteInput): Promise<void>;
}

export function createPrismaFixtureRepository(
  database: PrismaClient = getDatabase(),
): FixtureSyncRepository {

  return {
    upsertLeague(input) {
      return database.league.upsert({
        where: { externalId: input.externalId },
        update: {
          name: input.name,
          slug: input.slug,
          country: input.country,
          logoUrl: input.logoUrl,
        },
        create: input,
        select: { id: true },
      });
    },
    upsertTeam(input) {
      return database.team.upsert({
        where: { externalId: input.externalId },
        update: {
          name: input.name,
          shortName: input.shortName,
          country: input.country,
          logoUrl: input.logoUrl,
        },
        create: input,
        select: { id: true },
      });
    },
    async upsertFixture(input) {
      const data = {
        leagueId: input.leagueId,
        homeTeamId: input.homeTeamId,
        awayTeamId: input.awayTeamId,
        kickoffAt: input.kickoffAt,
        status: input.status,
        homeScore: input.homeScore,
        awayScore: input.awayScore,
        venue: input.venue,
        provider: input.provider,
        providerData: input.providerData,
      };

      await database.fixture.upsert({
        where: { externalId: input.externalId },
        update: data,
        create: { externalId: input.externalId, ...data },
      });
    },
  };
}
