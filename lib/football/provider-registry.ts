import { ApiFootballProvider } from "@/lib/football/api-football-provider";
import { getFootballProvider as getMockProvider } from "@/lib/football/mock-provider";
import type { FootballProvider } from "@/lib/football/provider";
import { ApiBasketballProvider } from "@/lib/football/api-basketball-provider";
import type { ProviderSport } from "@/lib/football/types";

/**
 * Chooses the football feed from configuration (guide §9: providers are
 * selected through configuration, never hard-wired into a route).
 *
 * The important rule here is the one about the mock. It is demo data, and
 * writing it into a deployed database would put invented fixtures in front of
 * members — so outside development the mock is refused rather than used as a
 * fallback. A misconfigured deployment fails loudly and syncs nothing, which is
 * the safe direction to fail in; the previous behaviour silently wrote a
 * fabricated fixture list every night.
 */

export type ProviderName = "api-football" | "mock";

export type ProviderResolution =
  | { ok: true; name: ProviderName; provider: FootballProvider }
  | { ok: false; name: string; reason: string };

const DEFAULT_PROVIDER: ProviderName = "mock";

/** "39, 140,135" → [39, 140, 135]. Silently ignores anything non-numeric. */
export function parseLeagueIds(value: string | undefined): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => Number(entry.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);
}

function isDeployed(env: NodeJS.ProcessEnv): boolean {
  // APP_ENV is the app's own notion of environment; NODE_ENV is the build's.
  // Either being production-like is enough to refuse demo data.
  return env.APP_ENV === "production" || env.APP_ENV === "staging" || env.NODE_ENV === "production";
}

export function resolveFootballProvider(env: NodeJS.ProcessEnv = process.env): ProviderResolution {
  const name = (env.FOOTBALL_PROVIDER?.trim() || DEFAULT_PROVIDER) as ProviderName;

  if (name === "mock") {
    if (isDeployed(env)) {
      return {
        ok: false,
        name,
        reason:
          "The mock feed is development-only demo data and will not be written to a deployed database. Set FOOTBALL_PROVIDER=api-football and FOOTBALL_API_KEY.",
      };
    }
    return { ok: true, name, provider: getMockProvider() };
  }

  if (name === "api-football") {
    const apiKey = env.FOOTBALL_API_KEY?.trim();
    if (!apiKey) {
      return {
        ok: false,
        name,
        reason: "FOOTBALL_API_KEY is not set, so the API-Football feed cannot be reached.",
      };
    }

    const timeout = Number(env.FOOTBALL_API_TIMEOUT_MS);
    return {
      ok: true,
      name,
      provider: new ApiFootballProvider({
        apiKey,
        baseUrl: env.FOOTBALL_API_BASE_URL?.trim() || undefined,
        timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : undefined,
        leagueIds: parseLeagueIds(env.FOOTBALL_LEAGUE_IDS),
      }),
    };
  }

  return {
    ok: false,
    name,
    reason: `Unknown FOOTBALL_PROVIDER "${name}". Supported values are "api-football" and "mock".`,
  };
}

/* ------------------------------------------------------------------ sports */

export type SportProviderResolution =
  | { ok: true; sport: ProviderSport; name: string; provider: FootballProvider }
  | {
      ok: false;
      sport: ProviderSport;
      name: string;
      reason: string;
      /** True when the sport is switched off on purpose, which is not a failure. */
      disabled: boolean;
    };

/**
 * The feed for one sport, chosen by configuration.
 *
 * Football keeps its existing resolver and rules. Basketball is off until it is
 * switched on, because a key alone should not start spending quota on a second
 * product. Tennis has no feed: API-Sports does not cover it, so it reports that
 * plainly instead of pretending. Tennis can still be published today through
 * SportyBet slips, which carry each leg's sport.
 */
export function resolveSportProvider(sport: ProviderSport, env: NodeJS.ProcessEnv = process.env): SportProviderResolution {
  if (sport === "FOOTBALL") {
    const resolved = resolveFootballProvider(env);
    return resolved.ok
      ? { ok: true, sport, name: resolved.name, provider: resolved.provider }
      : { ok: false, sport, name: resolved.name, reason: resolved.reason, disabled: false };
  }

  if (sport === "BASKETBALL") {
    const name = env.BASKETBALL_PROVIDER?.trim() || "disabled";
    if (name === "disabled") {
      return { ok: false, sport, name, reason: "Basketball sync is switched off. Set BASKETBALL_PROVIDER=api-basketball to enable it.", disabled: true };
    }
    if (name !== "api-basketball") {
      return { ok: false, sport, name, reason: `Unknown BASKETBALL_PROVIDER "${name}". Supported values are "api-basketball" and "disabled".`, disabled: false };
    }
    // One API-Sports account covers every product, so the football key works
    // here too unless a separate one is set.
    const apiKey = (env.API_SPORTS_KEY ?? env.FOOTBALL_API_KEY)?.trim();
    if (!apiKey) {
      return { ok: false, sport, name, reason: "API_SPORTS_KEY is not set, so the API-Basketball feed cannot be reached.", disabled: false };
    }
    const timeout = Number(env.FOOTBALL_API_TIMEOUT_MS);
    return {
      ok: true,
      sport,
      name,
      provider: new ApiBasketballProvider({
        apiKey,
        baseUrl: env.BASKETBALL_API_BASE_URL?.trim() || undefined,
        timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : undefined,
        leagueIds: parseLeagueIds(env.BASKETBALL_LEAGUE_IDS),
      }),
    };
  }

  return {
    ok: false,
    sport,
    name: "none",
    reason: "No tennis feed is configured. API-Sports does not cover tennis, so it needs its own vendor. Tennis legs on SportyBet slips are still published.",
    disabled: true,
  };
}
