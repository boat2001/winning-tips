import { describe, expect, it } from "vitest";
import { sportFromName } from "@/lib/sports/sport";
import { ApiBasketballProvider } from "@/lib/football/api-basketball-provider";

describe("sportFromName", () => {
  it("maps the sports Winning Tips publishes for", () => {
    expect(sportFromName("Football")).toBe("FOOTBALL");
    expect(sportFromName(" soccer ")).toBe("FOOTBALL");
    expect(sportFromName("Basketball")).toBe("BASKETBALL");
    expect(sportFromName("TENNIS")).toBe("TENNIS");
  });

  it("refuses virtual, e-sports and look-alike sports instead of misfiling them", () => {
    for (const name of ["eFootball", "Virtual Football", "Table Tennis", "Esoccer", "Ice Hockey", ""]) {
      expect(sportFromName(name)).toBeNull();
    }
  });
});

function jsonFetcher(body: unknown, status = 200) {
  return (async () =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })) as unknown as typeof fetch;
}

const game = {
  id: 424242,
  date: "2026-09-14T00:30:00+00:00",
  status: { short: "FT", long: "Game Finished" },
  league: { id: 12, name: "NBA", season: "2026-2027", logo: "https://example.test/nba.png" },
  country: { name: "USA" },
  teams: {
    home: { id: 145, name: "Los Angeles Lakers", logo: null },
    away: { id: 150, name: "Denver Nuggets", logo: null },
  },
  scores: {
    home: { quarter_1: 30, total: 112 },
    away: { quarter_1: 28, total: 108 },
  },
};

describe("ApiBasketballProvider", () => {
  it("normalises a finished game to final totals under the basketball sport", async () => {
    const provider = new ApiBasketballProvider({ apiKey: "test-key-123456", fetcher: jsonFetcher({ errors: [], response: [game] }) });
    const [fixture] = await provider.getFixturesByDate("2026-09-14");

    expect(fixture).toMatchObject({
      externalId: "abk-424242",
      status: "FINISHED",
      homeScore: 112,
      awayScore: 108,
      kickoffAt: "2026-09-14T00:30:00.000Z",
      provider: "api-basketball",
      league: { externalId: "abk-league-12", name: "NBA", country: "USA", sport: "BASKETBALL" },
      homeTeam: { name: "Los Angeles Lakers" },
      awayTeam: { name: "Denver Nuggets" },
    });
  });

  it("drops a row it cannot trust without losing the rest of the day", async () => {
    const broken = { ...game, id: 1, teams: { home: { id: 1, name: "Home" } } };
    const provider = new ApiBasketballProvider({ apiKey: "test-key-123456", fetcher: jsonFetcher({ errors: [], response: [broken, game] }) });
    const fixtures = await provider.getFixturesByDate("2026-09-14");
    expect(fixtures.map((fixture) => fixture.externalId)).toEqual(["abk-424242"]);
  });

  it("treats an in-band quota error as a failure, never as an empty day", async () => {
    const provider = new ApiBasketballProvider({
      apiKey: "test-key-123456",
      fetcher: jsonFetcher({ errors: { requests: "You have reached the request limit for the day" }, response: [] }),
    });
    await expect(provider.getFixturesByDate("2026-09-14")).rejects.toThrow(/request limit/);
  });

  it("keeps an unrecognised status visible and unstarted", async () => {
    const provider = new ApiBasketballProvider({
      apiKey: "test-key-123456",
      fetcher: jsonFetcher({ errors: [], response: [{ ...game, status: { short: "NEWCODE" } }] }),
    });
    const [fixture] = await provider.getFixturesByDate("2026-09-14");
    expect(fixture?.status).toBe("SCHEDULED");
  });

  it("honours a league allowlist", async () => {
    const provider = new ApiBasketballProvider({ apiKey: "test-key-123456", leagueIds: [99], fetcher: jsonFetcher({ errors: [], response: [game] }) });
    expect(await provider.getFixturesByDate("2026-09-14")).toEqual([]);
  });
});
