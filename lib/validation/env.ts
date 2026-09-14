import { z } from "zod";

const serverEnvironmentSchema = z.object({
  DATABASE_URL: z.string().url().startsWith("postgresql://"),
  CRON_SECRET: z.string().min(24).optional(),
  PAYSTACK_SECRET_KEY: z.string().startsWith("sk_").optional(),
  APP_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),

  // Football feed (guide §9). The provider is selected by configuration; the
  // key is required only when a live provider is chosen, which is enforced at
  // resolution time in lib/football/provider-registry.ts so that a deployment
  // missing its key fails on the sync route rather than at boot.
  FOOTBALL_PROVIDER: z.enum(["api-football", "mock"]).default("mock"),
  FOOTBALL_API_KEY: z.string().min(10).optional(),
  FOOTBALL_API_BASE_URL: z.string().url().optional(),
  FOOTBALL_API_TIMEOUT_MS: z.coerce.number().int().positive().max(60_000).optional(),
  /** Comma-separated API-Football league ids. Empty means every league. */
  FOOTBALL_LEAGUE_IDS: z.string().regex(/^\s*\d+(\s*,\s*\d+)*\s*$/).optional(),

  // Basketball feed. Off by default so a key alone never starts spending quota
  // on a second product. One API-Sports account covers football and basketball.
  BASKETBALL_PROVIDER: z.enum(["api-basketball", "disabled"]).default("disabled"),
  API_SPORTS_KEY: z.string().min(10).optional(),
  BASKETBALL_API_BASE_URL: z.string().url().optional(),
  BASKETBALL_LEAGUE_IDS: z.string().regex(/^\s*\d+(\s*,\s*\d+)*\s*$/).optional(),

  // Telegram channel digest. Delivery is skipped unless both are set.
  TELEGRAM_BOT_TOKEN: z.string().min(20).optional(),
  TELEGRAM_CHAT_ID: z.string().min(1).optional(),

  /** Renders the app screens from demo fixtures. Development only. */
  DESIGN_PREVIEW: z.enum(["true", "false"]).optional(),
});

export function parseServerEnvironment(environment: NodeJS.ProcessEnv) {
  return serverEnvironmentSchema.parse(environment);
}
