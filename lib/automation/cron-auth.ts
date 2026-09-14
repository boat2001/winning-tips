import { timingSafeEqual } from "node:crypto";

/**
 * Whether a request carries the scheduler's secret.
 *
 * Vercel sends it as a Bearer token; manual runs may use `x-cron-secret`. The
 * comparison is constant-time so the secret cannot be recovered by timing
 * responses, and a missing secret on either side is always a refusal.
 */
export function isAuthorizedCron(request: Request, configuredSecret: string | undefined = process.env.CRON_SECRET): boolean {
  const supplied =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.headers.get("x-cron-secret") ??
    "";
  if (!configuredSecret || !supplied) return false;
  const expected = Buffer.from(configuredSecret);
  const actual = Buffer.from(supplied);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
