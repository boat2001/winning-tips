import type { FootballProvider } from "@/lib/football/provider";
import { ApiSportsClient, asNumber, asRecord, asText, type Fetcher } from "@/lib/football/api-sports-client";
import type { FixtureInput, FixtureResultInput, JsonObject, ProviderFixtureStatus } from "@/lib/football/types";

/**
 * API-Basketball (api-sports.io v1) adapter.
 *
 * Implements the same provider contract as football, so the sync service and
 * the repository need no basketball-specific code: a game is a fixture with a
 * home and an away side and a final total each.
 *
 * Everything vendor-shaped stops at this file. The vendor's quarter-by-quarter
 * scores are reduced to the final totals the settlement engine grades on.
 *
 * Unverified against the live API until a key is configured: the normaliser
 * follows the documented payload and is covered by tests against it, but the
 * first real sync is where a field-name difference would surface.
 */

const DEFAULT_BASE_URL = "https://v1.basketball.api-sports.io";
/** Prefix keeps ids unique beside the football feed, which uses "af". */
const ID_PREFIX = "abk";

export interface ApiBasketballConfig {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  /** League ids to keep, or empty for every league the date returns. */
  leagueIds?: readonly number[];
  fetcher?: Fetcher;
}

/**
 * Game status codes → our five states. Unrecognised codes stay SCHEDULED, so a
 * new upstream code leaves a game visible and unstarted rather than wrongly
 * settled or cancelled.
 */
const STATUS_BY_CODE: Record<string, ProviderFixtureStatus> = {
  NS: "SCHEDULED",
  Q1: "LIVE",
  Q2: "LIVE",
  Q3: "LIVE",
  Q4: "LIVE",
  OT: "LIVE",
  BT: "LIVE",
  HT: "LIVE",
  FT: "FINISHED",
  AOT: "FINISHED",
  // A technical result is decided, not abandoned.
  AWD: "FINISHED",
  POST: "POSTPONED",
  SUSP: "POSTPONED",
  CANC: "CANCELLED",
  ABD: "CANCELLED",
};

function toStatus(code: unknown): ProviderFixtureStatus {
  return (typeof code === "string" && STATUS_BY_CODE[code]) || "SCHEDULED";
}

/** A side's final total, which the vendor nests under scores.{side}.total. */
function totalFor(scores: Record<string, unknown> | null, side: "home" | "away"): number | null {
  return asNumber(asRecord(scores?.[side])?.total);
}

export class ApiBasketballProvider implements FootballProvider {
  private readonly client: ApiSportsClient;
  private readonly leagueIds: ReadonlySet<number>;

  constructor(config: ApiBasketballConfig) {
    this.client = new ApiSportsClient({
      product: "API-Basketball",
      apiKey: config.apiKey,
      baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
      timeoutMs: config.timeoutMs,
      fetcher: config.fetcher,
    });
    this.leagueIds = new Set(config.leagueIds ?? []);
  }

  /** One vendor game → one fixture, or null when the row cannot be trusted. */
  normaliseGame(entry: unknown): FixtureInput | null {
    const row = asRecord(entry);
    const league = asRecord(row?.league);
    const country = asRecord(row?.country);
    const teams = asRecord(row?.teams);
    const home = asRecord(teams?.home);
    const away = asRecord(teams?.away);
    const scores = asRecord(row?.scores);

    const gameId = asNumber(row?.id);
    const leagueId = asNumber(league?.id);
    const homeId = asNumber(home?.id);
    const awayId = asNumber(away?.id);
    const leagueName = asText(league?.name);
    const homeName = asText(home?.name);
    const awayName = asText(away?.name);
    const date = asText(row?.date);

    if (gameId === null || leagueId === null || homeId === null || awayId === null || !leagueName || !homeName || !awayName || !date) {
      return null;
    }

    const tipoff = new Date(date);
    if (Number.isNaN(tipoff.getTime())) return null;
    if (this.leagueIds.size > 0 && !this.leagueIds.has(leagueId)) return null;

    const statusCode = asText(asRecord(row?.status)?.short);
    const countryName = asText(country?.name) ?? "International";

    const providerData: JsonObject = {
      source: "api-basketball",
      gameId,
      leagueId,
      season: asText(league?.season) ?? asNumber(league?.season),
      statusCode,
    };

    return {
      externalId: `${ID_PREFIX}-${gameId}`,
      league: {
        externalId: `${ID_PREFIX}-league-${leagueId}`,
        name: leagueName,
        country: countryName,
        logoUrl: asText(league?.logo),
        sport: "BASKETBALL",
      },
      homeTeam: { externalId: `${ID_PREFIX}-team-${homeId}`, name: homeName, country: countryName, logoUrl: asText(home?.logo) },
      awayTeam: { externalId: `${ID_PREFIX}-team-${awayId}`, name: awayName, country: countryName, logoUrl: asText(away?.logo) },
      kickoffAt: tipoff.toISOString(),
      status: toStatus(statusCode),
      homeScore: totalFor(scores, "home"),
      awayScore: totalFor(scores, "away"),
      venue: null,
      provider: "api-basketball",
      providerData,
    };
  }

  async getFixturesByDate(date: string): Promise<FixtureInput[]> {
    const rows = await this.client.request("/games", { date, timezone: "UTC" });
    return rows.map((row) => this.normaliseGame(row)).filter((game): game is FixtureInput => game !== null);
  }

  async getFixtureById(id: string): Promise<FixtureInput | null> {
    const vendorId = id.startsWith(`${ID_PREFIX}-`) ? id.slice(ID_PREFIX.length + 1) : id;
    if (!/^\d+$/.test(vendorId)) return null;
    const rows = await this.client.request("/games", { id: vendorId, timezone: "UTC" });
    return rows.length > 0 ? this.normaliseGame(rows[0]) : null;
  }

  async getResultsByDate(date: string): Promise<FixtureResultInput[]> {
    const games = await this.getFixturesByDate(date);
    return games.map((game) => ({
      externalId: game.externalId,
      status: game.status,
      homeScore: game.homeScore ?? null,
      awayScore: game.awayScore ?? null,
    }));
  }
}
