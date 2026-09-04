import { describe, expect, it } from "vitest";
import { MockFootballProvider } from "@/lib/football/mock-provider";
import type {
  FixtureSyncRepository,
  FixtureWriteInput,
} from "@/lib/football/repository";
import { syncFixturesForDates } from "@/lib/football/sync";
import type { LeagueInput, TeamInput } from "@/lib/football/types";

class MemoryFixtureRepository implements FixtureSyncRepository {
  leagues = new Map<string, LeagueInput & { id: string; slug: string }>();
  teams = new Map<string, TeamInput & { id: string }>();
  fixtures = new Map<string, FixtureWriteInput>();

  async upsertLeague(input: LeagueInput & { slug: string }) {
    const id = this.leagues.get(input.externalId)?.id ?? `league-${this.leagues.size + 1}`;
    this.leagues.set(input.externalId, { ...input, id });
    return { id };
  }

  async upsertTeam(input: TeamInput) {
    const id = this.teams.get(input.externalId)?.id ?? `team-${this.teams.size + 1}`;
    this.teams.set(input.externalId, { ...input, id });
    return { id };
  }

  async upsertFixture(input: FixtureWriteInput) {
    this.fixtures.set(input.externalId, input);
  }
}

describe("fixture synchronization", () => {
  it("upserts provider data without duplicating fixtures", async () => {
    const repository = new MemoryFixtureRepository();
    const provider = new MockFootballProvider();
    const dates = ["2026-08-12", "2026-08-13"];

    const first = await syncFixturesForDates(provider, dates, repository);
    const second = await syncFixturesForDates(provider, dates, repository);

    expect(first).toEqual({
      dates,
      fixturesProcessed: 8,
      leaguesProcessed: 3,
      teamsProcessed: 8,
    });
    expect(second.fixturesProcessed).toBe(8);
    expect(repository.fixtures.size).toBe(8);
    expect(repository.leagues.size).toBe(3);
    expect(repository.teams.size).toBe(8);
  });

  it("can retrieve one deterministic mock fixture by provider ID", async () => {
    const provider = new MockFootballProvider();
    const fixture = await provider.getFixtureById("mock-2026-08-13-pl-ars-che");

    expect(fixture?.homeTeam.name).toBe("Arsenal");
    expect(fixture?.awayTeam.name).toBe("Chelsea");
  });
});
