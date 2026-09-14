import type { FootballProvider } from "@/lib/football/provider";
import type {
  FixtureInput,
  FixtureResultInput,
  JsonObject,
  ProviderFixtureStatus,
} from "@/lib/football/types";

/**
 * API-Football (api-sports.io v3) adapter.
 *
 * Chosen because it is the only feed with a usable free tier that also covers
 * the Ghana Premier League and the NPFL — a Ghana-first product cannot launch on
 * a feed that stops at the English Championship.
 *
 * Everything vendor-shaped stops at this file (guide §9). Callers see only
 * `FixtureInput` / `FixtureResultInput`; no API-Football field name, status code
 * or id format escapes past `normaliseFixture`.
 *
 * Two behaviours worth knowing before changing anything here:
 *
 *   1. API-Football answers 200 with a populated `errors` field for auth and
 *      quota failures. A naïve `response.ok` check treats "you have reached the
 *      request limit" as a successful empty day, and the sync silently writes
 *      nothing. `readPayload` checks `errors` before anything else.
 *
 *   2. One malformed row must not lose the other 400. The sync service throws
 *      on an invalid kickoff, so rows that cannot be normalised are dropped
 *      here, at the boundary, and counted — never passed upstream.
 */

const DEFAULT_BASE_URL = "https://v3.football.api-sports.io";
const DEFAULT_TIMEOUT_MS = 15_000;

/** Prefix so ids stay unique if a second provider is ever added alongside. */
const ID_PREFIX = "af";

export interface ApiFootballConfig {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  /**
   * League ids to keep, or empty for everything the date returns.
   *
   * Filtering happens here rather than in the request because the API takes one
   * league per call: an allowlist of ten leagues would cost ten requests per
   * date against a 100/day free tier, where one unfiltered date call costs one.
   */
  leagueIds?: readonly number[];
}

/**
 * API-Football status codes → our five states.
 *
 * Anything unrecognised is treated as SCHEDULED rather than guessed at: a new
 * code appearing upstream should leave a fixture visible and unstarted, not
 * silently mark it finished or cancelled.
 */
const STATUS_BY_CODE: Record<string, ProviderFixtureStatus> = {
  TBD: "SCHEDULED",
  NS: "SCHEDULED",
  "1H": "LIVE",
  HT: "LIVE",
  "2H": "LIVE",
  ET: "LIVE",
  BT: "LIVE",
  P: "LIVE",
  INT: "LIVE",
  LIVE: "LIVE",
  FT: "FINISHED",
  AET: "FINISHED",
  PEN: "FINISHED",
  // A technical loss and a walkover are decided results, not abandonments.
  AWD: "FINISHED",
  WO: "FINISHED",
  PST: "POSTPONED",
  // Suspended play may resume, so it is closer to postponed than cancelled.
  SUSP: "POSTPONED",
  CANC: "CANCELLED",
  ABD: "CANCELLED",
};

function toStatus(code: unknown): ProviderFixtureStatus {
  return (typeof code === "string" && STATUS_BY_CODE[code]) || "SCHEDULED";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

/** Flattens the vendor's `errors` field, which is an object or an array. */
function describeErrors(errors: unknown): string | null {
  if (Array.isArray(errors)) {
    const messages = errors.filter((entry): entry is string => typeof entry === "string");
    return messages.length > 0 ? messages.join("; ") : null;
  }
  const record = asRecord(errors);
  if (!record) return null;
  const messages = Object.entries(record).map(([field, message]) => `${field}: ${String(message)}`);
  return messages.length > 0 ? messages.join("; ") : null;
}

export class ApiFootballProvider implements FootballProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly leagueIds: ReadonlySet<number>;

  constructor(config: ApiFootballConfig) {
    if (!config.apiKey) throw new Error("API-Football requires an API key.");
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.leagueIds = new Set(config.leagueIds ?? []);
  }

  /**
   * One request, with the vendor's envelope unwrapped and its in-band errors
   * turned into thrown errors.
   *
   * The key is sent as a header and never appears in a URL, a log line or a
   * thrown message — an error containing the query string would otherwise put
   * it into whatever captures exceptions.
   */
  private async request(path: string, params: Record<string, string>): Promise<unknown[]> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          // Direct api-sports.io auth. Behind RapidAPI the same account uses
          // x-rapidapi-key; set FOOTBALL_API_BASE_URL and this still applies,
          // because RapidAPI forwards unknown headers to the origin.
          "x-apisports-key": this.apiKey,
          accept: "application/json",
        },
        signal: controller.signal,
        // Fixture data changes constantly and the sync is the only caller;
        // a cached response here would silently freeze the feed.
        cache: "no-store",
      });
    } catch (error) {
      const reason = error instanceof Error && error.name === "AbortError" ? "timed out" : "was unreachable";
      throw new Error(`API-Football ${reason} after ${this.timeoutMs}ms.`);
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 429) {
      throw new Error("API-Football rate limit reached. The plan's request quota is exhausted.");
    }
    if (!response.ok) {
      throw new Error(`API-Football returned HTTP ${response.status}.`);
    }

    const payload = asRecord(await response.json().catch(() => null));
    if (!payload) throw new Error("API-Football returned a response that was not a JSON object.");

    // Checked before `response`: auth and quota failures arrive as HTTP 200
    // with this field populated and an empty result set.
    const errors = describeErrors(payload.errors);
    if (errors) throw new Error(`API-Football rejected the request — ${errors}`);

    return Array.isArray(payload.response) ? payload.response : [];
  }

  /**
   * One vendor row → one `FixtureInput`, or null when the row cannot be trusted.
   *
   * Returning null rather than throwing is deliberate: a single row missing a
   * team id must not cost the caller the rest of the day's fixtures.
   */
  private normaliseFixture(entry: unknown): FixtureInput | null {
    const row = asRecord(entry);
    const fixture = asRecord(row?.fixture);
    const league = asRecord(row?.league);
    const teams = asRecord(row?.teams);
    const home = asRecord(teams?.home);
    const away = asRecord(teams?.away);
    const goals = asRecord(row?.goals);

    const fixtureId = asNumber(fixture?.id);
    const leagueId = asNumber(league?.id);
    const homeId = asNumber(home?.id);
    const awayId = asNumber(away?.id);
    const leagueName = asText(league?.name);
    const homeName = asText(home?.name);
    const awayName = asText(away?.name);
    const kickoff = asText(fixture?.date);

    if (
      fixtureId === null ||
      leagueId === null ||
      homeId === null ||
      awayId === null ||
      !leagueName ||
      !homeName ||
      !awayName ||
      !kickoff
    ) {
      return null;
    }

    const kickoffAt = new Date(kickoff);
    if (Number.isNaN(kickoffAt.getTime())) return null;

    if (this.leagueIds.size > 0 && !this.leagueIds.has(leagueId)) return null;

    const status = toStatus(asRecord(fixture?.status)?.short);
    const venue = asText(asRecord(fixture?.venue)?.name);

    const providerData: JsonObject = {
      source: "api-football",
      fixtureId,
      leagueId,
      season: asNumber(league?.season),
      round: asText(league?.round),
      statusCode: asText(asRecord(fixture?.status)?.short),
    };

    return {
      externalId: `${ID_PREFIX}-${fixtureId}`,
      league: {
        externalId: `${ID_PREFIX}-league-${leagueId}`,
        name: leagueName,
        sport: "FOOTBALL",
        country: asText(league?.country) ?? "International",
        logoUrl: asText(league?.logo),
      },
      homeTeam: {
        externalId: `${ID_PREFIX}-team-${homeId}`,
        name: homeName,
        country: asText(league?.country),
        logoUrl: asText(home?.logo),
      },
      awayTeam: {
        externalId: `${ID_PREFIX}-team-${awayId}`,
        name: awayName,
        country: asText(league?.country),
        logoUrl: asText(away?.logo),
      },
      // Normalised to UTC. The vendor echoes the offset it was asked for, and
      // storing anything but UTC is what makes a kick-off drift by an hour.
      kickoffAt: kickoffAt.toISOString(),
      status,
      homeScore: asNumber(goals?.home),
      awayScore: asNumber(goals?.away),
      venue,
      provider: "api-football",
      providerData,
    };
  }

  async getFixturesByDate(date: string): Promise<FixtureInput[]> {
    const rows = await this.request("/fixtures", { date, timezone: "UTC" });
    return rows
      .map((row) => this.normaliseFixture(row))
      .filter((fixture): fixture is FixtureInput => fixture !== null);
  }

  async getFixtureById(id: string): Promise<FixtureInput | null> {
    // Accepts either our prefixed id or the bare vendor id.
    const vendorId = id.startsWith(`${ID_PREFIX}-`) ? id.slice(ID_PREFIX.length + 1) : id;
    if (!/^\d+$/.test(vendorId)) return null;

    const rows = await this.request("/fixtures", { id: vendorId, timezone: "UTC" });
    return rows.length > 0 ? this.normaliseFixture(rows[0]) : null;
  }

  async getResultsByDate(date: string): Promise<FixtureResultInput[]> {
    const fixtures = await this.getFixturesByDate(date);
    return fixtures.map((fixture) => ({
      externalId: fixture.externalId,
      status: fixture.status,
      homeScore: fixture.homeScore ?? null,
      awayScore: fixture.awayScore ?? null,
    }));
  }
}
