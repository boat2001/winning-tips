import { describe, expect, it } from "vitest";
import { resolveSportProvider } from "@/lib/football/provider-registry";
import { ApiBasketballProvider } from "@/lib/football/api-basketball-provider";

const env = (values: Record<string, string>) => values as unknown as NodeJS.ProcessEnv;

describe("resolveSportProvider", () => {
  it("keeps football on its existing resolver", () => {
    const resolved = resolveSportProvider("FOOTBALL", env({ NODE_ENV: "development" }));
    expect(resolved).toMatchObject({ ok: true, sport: "FOOTBALL", name: "mock" });
  });

  it("carries a football refusal through as a failure, not a skip", () => {
    const resolved = resolveSportProvider("FOOTBALL", env({ NODE_ENV: "production", APP_ENV: "production" }));
    expect(resolved).toMatchObject({ ok: false, sport: "FOOTBALL", disabled: false });
  });

  it("leaves basketball switched off until it is enabled", () => {
    const resolved = resolveSportProvider("BASKETBALL", env({ FOOTBALL_API_KEY: "football-key-123456" }));
    expect(resolved).toMatchObject({ ok: false, sport: "BASKETBALL", disabled: true });
  });

  it("fails loudly when basketball is enabled without a key", () => {
    const resolved = resolveSportProvider("BASKETBALL", env({ BASKETBALL_PROVIDER: "api-basketball" }));
    expect(resolved).toMatchObject({ ok: false, disabled: false });
    if (!resolved.ok) expect(resolved.reason).toMatch(/API_SPORTS_KEY/);
  });

  it("builds the basketball feed from its own key, or the shared football key", () => {
    const own = resolveSportProvider("BASKETBALL", env({ BASKETBALL_PROVIDER: "api-basketball", API_SPORTS_KEY: "sports-key-123456" }));
    const shared = resolveSportProvider("BASKETBALL", env({ BASKETBALL_PROVIDER: "api-basketball", FOOTBALL_API_KEY: "football-key-123456" }));
    expect(own.ok && own.provider).toBeInstanceOf(ApiBasketballProvider);
    expect(shared.ok && shared.provider).toBeInstanceOf(ApiBasketballProvider);
  });

  it("rejects an unknown basketball provider name", () => {
    const resolved = resolveSportProvider("BASKETBALL", env({ BASKETBALL_PROVIDER: "made-up" }));
    expect(resolved).toMatchObject({ ok: false, disabled: false });
  });

  it("says plainly that tennis has no feed rather than pretending", () => {
    const resolved = resolveSportProvider("TENNIS", env({ API_SPORTS_KEY: "sports-key-123456" }));
    expect(resolved).toMatchObject({ ok: false, sport: "TENNIS", disabled: true });
    if (!resolved.ok) expect(resolved.reason).toMatch(/tennis/i);
  });
});
