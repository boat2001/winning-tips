import { z } from "zod";

const serverEnvironmentSchema = z.object({
  DATABASE_URL: z.string().url().startsWith("postgresql://"),
  CRON_SECRET: z.string().min(24).optional(),
  PAYSTACK_SECRET_KEY: z.string().startsWith("sk_").optional(),
  APP_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
});

export function parseServerEnvironment(environment: NodeJS.ProcessEnv) {
  return serverEnvironmentSchema.parse(environment);
}
