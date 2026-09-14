/**
 * The request layer shared by the API-Sports products (API-Basketball today).
 *
 * API-Sports sells one account that works across its products, each on its own
 * host, with the same envelope and the same failure modes. This client carries
 * the two behaviours that matter, lifted from the football adapter:
 *
 *   1. Auth and quota failures arrive as HTTP 200 with a populated `errors`
 *      field and an empty result. They are thrown here, before the result is
 *      read, so a spent quota is never mistaken for a quiet day.
 *   2. The key travels as a header only. It never appears in a URL or in a
 *      thrown message, where it would end up in whatever captures errors.
 *
 * The football adapter keeps its own copy of this logic for now, so that adding
 * basketball could not regress a feed already in production.
 */

export type Fetcher = typeof fetch;

export interface ApiSportsClientConfig {
  /** Product name used in error messages, e.g. "API-Basketball". */
  product: string;
  apiKey: string;
  baseUrl: string;
  timeoutMs?: number;
  /** Injected in tests; defaults to the global fetch. */
  fetcher?: Fetcher;
}

const DEFAULT_TIMEOUT_MS = 15_000;

export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

/** Flattens the vendor's `errors` field, which arrives as an object or an array. */
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

export class ApiSportsClient {
  private readonly product: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetcher: Fetcher;

  constructor(config: ApiSportsClientConfig) {
    if (!config.apiKey) throw new Error(`${config.product} requires an API key.`);
    this.product = config.product;
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetcher = config.fetcher ?? fetch;
  }

  async request(path: string, params: Record<string, string>): Promise<unknown[]> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await this.fetcher(url, {
        headers: { "x-apisports-key": this.apiKey, accept: "application/json" },
        signal: controller.signal,
        // The sync is the only caller, and a cached response would freeze the feed.
        cache: "no-store",
      });
    } catch (error) {
      const reason = error instanceof Error && error.name === "AbortError" ? "timed out" : "was unreachable";
      throw new Error(`${this.product} ${reason} after ${this.timeoutMs}ms.`);
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 429) throw new Error(`${this.product} rate limit reached. The plan's request quota is exhausted.`);
    if (!response.ok) throw new Error(`${this.product} returned HTTP ${response.status}.`);

    const payload = asRecord(await response.json().catch(() => null));
    if (!payload) throw new Error(`${this.product} returned a response that was not a JSON object.`);

    const errors = describeErrors(payload.errors);
    if (errors) throw new Error(`${this.product} rejected the request — ${errors}`);

    return Array.isArray(payload.response) ? payload.response : [];
  }
}
