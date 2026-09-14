import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiFootballProvider } from "../lib/football/api-football-provider";
import { syncFixturesForDates } from "../lib/football/sync";
import type { FixtureSyncRepository } from "../lib/football/repository";

/**
 * Adapter → sync service, with the database replaced by an in-memory repository.
 *
 * The unit tests prove the adapter normalises correctly and the sync service has
 * its own tests, but neither catches the failure that actually bites: an adapter
 * whose output the sync service cannot consume. This runs the real chain and
 * asserts on what would have been written.
 */

const ROWS = [
  {
    fixture: {
      id: 1035037,
      date: "2026-09-08T19:00:00+00:00",
      venue: { name: "Old Trafford" },
      status: { short: "NS" },
    },
    league: { id: 39, name: "Premier League", country: "England", season: 2026 },
    teams: { home: { id: 33, name: "Manchester United" }, away: { id: 40, name: "Liverpool" } },
    goals: { home: null, away: null },
  },
  {
    fixture: { id: 1035038, date: "2026-09-08T14:00:00+00:00", venue: { name: null }, status: { short: "FT" } },
    league: { id: 332, name: "Premier League", country: "Ghana", season: 2026 },
    teams: { home: { id: 2001, name: "Hearts of Oak" }, away: { id: 2002, name: "Asante Kotoko" } },
    goals: { home: 2, away: 1 },
  },
  // Unusable: the sync service throws on an invalid kickoff, so the adapter has
  // to have dropped this before it gets here.
  { fixture: { id: 9, date: "rubbish", status: { short: "NS" } }, league: { id: 39, name: "X", country: "Y" }, teams: { home: { id: 1, name: "A" }, away: { id: 2, name: "B" } }, goals: {} },
];

function inMemoryRepository() {
  const leagues = new Map<string, { id: string; slug: string; name: string }>();
  const teams = new Map<string, { id: string; name: string }>();
  const fixtures: Record<string, unknown>[] = [];

  const repository: FixtureSyncRepository = {
    async upsertLeague(input) {
      const existing = leagues.get(input.externalId);
      const league = existing ?? { id: `league-${leagues.size + 1}`, slug: input.slug, name: input.name };
      leagues.set(input.externalId, league);
      return league as never;
    },
    async upsertTeam(input) {
      const existing = teams.get(input.externalId);
      const team = existing ?? { id: `team-${teams.size + 1}`, name: input.name };
      teams.set(input.externalId, team);
      return team as never;
    },
    async upsertFixture(input) {
      fixtures.push(input as unknown as Record<string, unknown>);
      return { id: `fixture-${fixtures.length}` } as never;
    },
  };

  return { repository, leagues, teams, fixtures };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("API-Football → sync", () => {
  it("writes normalised leagues, teams and fixtures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ errors: [], response: ROWS }), { status: 200 })),
    );

    const { repository, leagues, teams, fixtures } = inMemoryRepository();
    const provider = new ApiFootballProvider({ apiKey: "test-key-1234567890" });

    const summary = await syncFixturesForDates(provider, ["2026-09-08"], repository);

    // The third row was dropped at the adapter, so the sync never saw it.
    expect(summary).toMatchObject({ fixturesProcessed: 2, leaguesProcessed: 2, teamsProcessed: 4 });
    expect(leagues.size).toBe(2);
    expect(teams.size).toBe(4);

    expect(fixtures[0]).toMatchObject({
      externalId: "af-1035037",
      status: "SCHEDULED",
      provider: "api-football",
      venue: "Old Trafford",
      homeScore: null,
      awayScore: null,
    });
    expect((fixtures[0]!.kickoffAt as Date).toISOString()).toBe("2026-09-08T19:00:00.000Z");

    expect(fixtures[1]).toMatchObject({
      externalId: "af-1035038",
      status: "FINISHED",
      homeScore: 2,
      awayScore: 1,
    });
  });

  it("gives two leagues sharing a name distinct slugs", async () => {
    // Both rows are called "Premier League" — England's and Ghana's. A slug
    // built from the name alone would collide and merge two competitions.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ errors: [], response: ROWS }), { status: 200 })),
    );

    const { repository, leagues } = inMemoryRepository();
    await syncFixturesForDates(new ApiFootballProvider({ apiKey: "test-key-1234567890" }), ["2026-09-08"], repository);

    const slugs = [...leagues.values()].map((league) => league.slug);
    expect(new Set(slugs).size).toBe(2);
  });

  it("stops the whole sync when the provider reports a quota failure", async () => {
    // Better to fail the run than to record a day as having no fixtures.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ errors: { requests: "You have reached the request limit for the day" }, response: [] }), { status: 200 }),
      ),
    );

    const { repository, fixtures } = inMemoryRepository();
    await expect(
      syncFixturesForDates(new ApiFootballProvider({ apiKey: "test-key-1234567890" }), ["2026-09-08"], repository),
    ).rejects.toThrow(/request limit/i);
    expect(fixtures).toHaveLength(0);
  });
});
