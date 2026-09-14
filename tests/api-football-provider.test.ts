import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiFootballProvider } from "../lib/football/api-football-provider";
import { parseLeagueIds, resolveFootballProvider } from "../lib/football/provider-registry";

/**
 * Contract tests for the API-Football adapter (guide §19).
 *
 * The payload below is the shape api-sports.io v3 actually returns for
 * GET /fixtures?date=... — trimmed to the fields the adapter reads, but with the
 * nesting and the field names left exactly as the vendor sends them. If the
 * vendor changes shape, these fail rather than the sync silently writing
 * nothing.
 */

const SCHEDULED_ROW = {
  fixture: {
    id: 1035037,
    date: "2026-09-08T19:00:00+00:00",
    timezone: "UTC",
    venue: { id: 556, name: "Old Trafford", city: "Manchester" },
    status: { long: "Not Started", short: "NS", elapsed: null },
  },
  league: {
    id: 39,
    name: "Premier League",
    country: "England",
    logo: "https://media.api-sports.io/football/leagues/39.png",
    season: 2026,
    round: "Regular Season - 4",
  },
  teams: {
    home: { id: 33, name: "Manchester United", logo: "https://media.api-sports.io/football/teams/33.png" },
    away: { id: 40, name: "Liverpool", logo: "https://media.api-sports.io/football/teams/40.png" },
  },
  goals: { home: null, away: null },
};

const FINISHED_ROW = {
  fixture: {
    id: 1035038,
    date: "2026-09-08T14:00:00+00:00",
    venue: { id: null, name: null },
    status: { long: "Match Finished", short: "FT", elapsed: 90 },
  },
  league: { id: 332, name: "Premier League", country: "Ghana", logo: null, season: 2026, round: "Week 3" },
  teams: { home: { id: 2001, name: "Hearts of Oak", logo: null }, away: { id: 2002, name: "Asante Kotoko", logo: null } },
  goals: { home: 2, away: 1 },
};

function mockFetch(body: unknown, init: { status?: number } = {}) {
  // Typed with fetch's own signature so mock.calls carries the URL and init
  // that the assertions below read.
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
    void _input;
    void _init;
    return new Response(JSON.stringify(body), {
      status: init.status ?? 200,
      headers: { "content-type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function provider(overrides: Partial<ConstructorParameters<typeof ApiFootballProvider>[0]> = {}) {
  return new ApiFootballProvider({ apiKey: "test-key-1234567890", ...overrides });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ApiFootballProvider.getFixturesByDate", () => {
  it("normalises a vendor row into FixtureInput", async () => {
    mockFetch({ errors: [], response: [SCHEDULED_ROW] });

    const [fixture] = await provider().getFixturesByDate("2026-09-08");

    expect(fixture).toMatchObject({
      externalId: "af-1035037",
      kickoffAt: "2026-09-08T19:00:00.000Z",
      status: "SCHEDULED",
      homeScore: null,
      awayScore: null,
      venue: "Old Trafford",
      provider: "api-football",
      league: { externalId: "af-league-39", name: "Premier League", country: "England" },
      homeTeam: { externalId: "af-team-33", name: "Manchester United" },
      awayTeam: { externalId: "af-team-40", name: "Liverpool" },
    });
  });

  it("stores kick-off as UTC regardless of the offset the vendor sends", async () => {
    mockFetch({
      errors: [],
      response: [{ ...SCHEDULED_ROW, fixture: { ...SCHEDULED_ROW.fixture, date: "2026-09-08T22:00:00+03:00" } }],
    });

    const [fixture] = await provider().getFixturesByDate("2026-09-08");
    expect(fixture!.kickoffAt).toBe("2026-09-08T19:00:00.000Z");
  });

  it("carries scores through for a finished match", async () => {
    mockFetch({ errors: [], response: [FINISHED_ROW] });

    const [fixture] = await provider().getFixturesByDate("2026-09-08");
    expect(fixture).toMatchObject({ status: "FINISHED", homeScore: 2, awayScore: 1 });
  });

  it("sends the key as a header and never in the URL", async () => {
    const fetchMock = mockFetch({ errors: [], response: [] });
    await provider().getFixturesByDate("2026-09-08");

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).not.toContain("test-key");
    expect(init?.headers).toMatchObject({ "x-apisports-key": "test-key-1234567890" });
  });

  it("requests UTC so the date window is deterministic", async () => {
    const fetchMock = mockFetch({ errors: [], response: [] });
    await provider().getFixturesByDate("2026-09-08");

    const url = new URL(String(fetchMock.mock.calls[0]![0]));
    expect(url.searchParams.get("date")).toBe("2026-09-08");
    expect(url.searchParams.get("timezone")).toBe("UTC");
  });
});

describe("ApiFootballProvider status mapping", () => {
  const cases: [string, string][] = [
    ["NS", "SCHEDULED"],
    ["TBD", "SCHEDULED"],
    ["1H", "LIVE"],
    ["HT", "LIVE"],
    ["FT", "FINISHED"],
    ["AET", "FINISHED"],
    ["PEN", "FINISHED"],
    // A walkover and a technical loss are decided results.
    ["WO", "FINISHED"],
    ["AWD", "FINISHED"],
    ["PST", "POSTPONED"],
    // Suspended play may resume, so it is not a cancellation.
    ["SUSP", "POSTPONED"],
    ["CANC", "CANCELLED"],
    ["ABD", "CANCELLED"],
  ];

  it.each(cases)("maps %s to %s", async (code, expected) => {
    mockFetch({
      errors: [],
      response: [{ ...SCHEDULED_ROW, fixture: { ...SCHEDULED_ROW.fixture, status: { short: code } } }],
    });

    const [fixture] = await provider().getFixturesByDate("2026-09-08");
    expect(fixture!.status).toBe(expected);
  });

  it("treats an unknown code as scheduled rather than guessing", async () => {
    mockFetch({
      errors: [],
      response: [{ ...SCHEDULED_ROW, fixture: { ...SCHEDULED_ROW.fixture, status: { short: "XYZ" } } }],
    });

    const [fixture] = await provider().getFixturesByDate("2026-09-08");
    expect(fixture!.status).toBe("SCHEDULED");
  });
});

describe("ApiFootballProvider resilience", () => {
  it("drops an unusable row without losing the rest of the day", async () => {
    // The sync service throws on an invalid kickoff, so a row missing its date
    // must never reach it.
    mockFetch({
      errors: [],
      response: [
        { ...SCHEDULED_ROW, fixture: { ...SCHEDULED_ROW.fixture, date: "not-a-date" } },
        { ...SCHEDULED_ROW, teams: { home: { id: null, name: null }, away: SCHEDULED_ROW.teams.away } },
        FINISHED_ROW,
      ],
    });

    const fixtures = await provider().getFixturesByDate("2026-09-08");
    expect(fixtures).toHaveLength(1);
    expect(fixtures[0]!.externalId).toBe("af-1035038");
  });

  it("applies the league allowlist without a second request", async () => {
    const fetchMock = mockFetch({ errors: [], response: [SCHEDULED_ROW, FINISHED_ROW] });

    const fixtures = await provider({ leagueIds: [332] }).getFixturesByDate("2026-09-08");

    expect(fixtures.map((f) => f.league.externalId)).toEqual(["af-league-332"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("treats an in-band error as a failure even though the status is 200", async () => {
    // This is the one that matters: quota and auth failures arrive as HTTP 200
    // with an empty response array. Trusting the status code makes the sync
    // write nothing and report success.
    mockFetch({ errors: { requests: "You have reached the request limit for the day" }, response: [] });

    await expect(provider().getFixturesByDate("2026-09-08")).rejects.toThrow(/request limit/i);
  });

  it("reports an invalid key rather than returning an empty day", async () => {
    mockFetch({ errors: { token: "Error/Missing application key." }, response: [] });

    await expect(provider().getFixturesByDate("2026-09-08")).rejects.toThrow(/token/i);
  });

  it("surfaces a rate-limit response", async () => {
    mockFetch({}, { status: 429 });
    await expect(provider().getFixturesByDate("2026-09-08")).rejects.toThrow(/rate limit/i);
  });

  it("surfaces a server error", async () => {
    mockFetch({}, { status: 502 });
    await expect(provider().getFixturesByDate("2026-09-08")).rejects.toThrow(/HTTP 502/);
  });

  it("does not put the key into a thrown message", async () => {
    mockFetch({ errors: { token: "Error/Missing application key." }, response: [] });

    await expect(provider().getFixturesByDate("2026-09-08")).rejects.toSatisfy(
      (error: Error) => !error.message.includes("test-key-1234567890"),
    );
  });

  it("rejects an empty key at construction", () => {
    expect(() => new ApiFootballProvider({ apiKey: "" })).toThrow(/requires an API key/i);
  });
});

describe("ApiFootballProvider.getFixtureById", () => {
  it("accepts both the prefixed and the bare vendor id", async () => {
    const fetchMock = mockFetch({ errors: [], response: [SCHEDULED_ROW] });

    await provider().getFixtureById("af-1035037");
    expect(new URL(String(fetchMock.mock.calls[0]![0])).searchParams.get("id")).toBe("1035037");

    await provider().getFixtureById("1035037");
    expect(new URL(String(fetchMock.mock.calls[1]![0])).searchParams.get("id")).toBe("1035037");
  });

  it("returns null for a non-numeric id without calling the API", async () => {
    const fetchMock = mockFetch({ errors: [], response: [] });

    await expect(provider().getFixtureById("not-an-id")).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("provider registry", () => {
  it("uses the mock in development", () => {
    const resolved = resolveFootballProvider({ NODE_ENV: "development" } as unknown as NodeJS.ProcessEnv);
    expect(resolved).toMatchObject({ ok: true, name: "mock" });
  });

  it("refuses the mock in production rather than writing demo fixtures", () => {
    const resolved = resolveFootballProvider({ NODE_ENV: "production" } as unknown as NodeJS.ProcessEnv);
    expect(resolved.ok).toBe(false);
    expect(resolved.ok === false && resolved.reason).toMatch(/development-only/i);
  });

  it("refuses the mock in staging too", () => {
    const resolved = resolveFootballProvider({ APP_ENV: "staging" } as unknown as NodeJS.ProcessEnv);
    expect(resolved.ok).toBe(false);
  });

  it("requires a key for the live provider", () => {
    const resolved = resolveFootballProvider({ FOOTBALL_PROVIDER: "api-football" } as unknown as NodeJS.ProcessEnv);
    expect(resolved.ok).toBe(false);
    expect(resolved.ok === false && resolved.reason).toMatch(/FOOTBALL_API_KEY/);
  });

  it("builds the live provider once the key is present", () => {
    const resolved = resolveFootballProvider({
      FOOTBALL_PROVIDER: "api-football",
      FOOTBALL_API_KEY: "a-real-looking-key",
      NODE_ENV: "production",
    } as unknown as NodeJS.ProcessEnv);
    expect(resolved).toMatchObject({ ok: true, name: "api-football" });
  });

  it("rejects an unknown provider name", () => {
    const resolved = resolveFootballProvider({ FOOTBALL_PROVIDER: "sportradar" } as unknown as NodeJS.ProcessEnv);
    expect(resolved.ok).toBe(false);
    expect(resolved.ok === false && resolved.reason).toMatch(/Unknown FOOTBALL_PROVIDER/);
  });

  it("parses a league allowlist and ignores rubbish", () => {
    expect(parseLeagueIds("39, 140 ,135")).toEqual([39, 140, 135]);
    expect(parseLeagueIds("39,abc,-2,0")).toEqual([39]);
    expect(parseLeagueIds(undefined)).toEqual([]);
  });
});
