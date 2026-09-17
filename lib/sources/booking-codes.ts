import "server-only";
import type { TipSource } from "@/lib/sources/registry";

/**
 * Booking codes published on a source's page.
 *
 * Only the code is taken. Everything that makes the slip — teams, markets, odds,
 * kick-off times — is then fetched from the bookmaker's own API by the existing
 * loader, so nothing here depends on another site's wording or layout beyond the
 * code itself, and nothing of theirs is copied onto our pages.
 */
const requestTimeoutMs = 20_000;
const maxBytes = 2_000_000;
const maxCodes = 20;

/** "Sporty:F12GXH", "SportyBet - F12GXH", "Sporty Code: F12GXH". */
const codePattern = /sporty(?:bet)?\s*(?:code)?\s*[:\-–]?\s*([A-Z0-9]{4,20})\b/gi;

/** The page as plain text, with element boundaries preserved as spaces. */
export function htmlToText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    // A space, not nothing. Dropping the tag outright joined the code to the
    // heading after it — "Sporty:<span>F12GXH</span><h3>Today's…" read as
    // F12GXHTODAY, and the bookmaker rejected a code that never existed.
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Every distinct code in the page, in the order found.
 *
 * A code must carry at least one digit: without that rule the pattern matches
 * ordinary words next to the bookmaker's name ("Sporty CODES", "Sporty TODAY")
 * and every one of those becomes a failed lookup against the bookmaker.
 */
export function extractBookingCodes(html: string): string[] {
  const text = htmlToText(html);
  const found = new Set<string>();

  for (const match of text.matchAll(codePattern)) {
    const raw = match[1];
    const code = raw.toUpperCase();
    // Codes are published in capitals. The pattern is case-insensitive so it can
    // match "Sporty"/"SPORTY", which also lets ordinary words run into the
    // capture; anything carrying lowercase is prose, not a code.
    if (raw !== code) continue;
    if (!/\d/.test(code) || !/^[A-Z0-9]+$/.test(code)) continue;
    found.add(code);
    if (found.size >= maxCodes) break;
  }

  return [...found];
}

export type Fetcher = typeof fetch;

/** Fetches a source page and returns the codes it publishes. */
export async function fetchSourceCodes(source: TipSource, fetcher: Fetcher = fetch): Promise<string[]> {
  let response: Response;
  try {
    response = await fetcher(source.url, {
      cache: "no-store",
      signal: AbortSignal.timeout(requestTimeoutMs),
      // Identifies us honestly, so the source can see who is calling and block
      // us if they ever want to.
      headers: { Accept: "text/html", "User-Agent": "WinningTipsBot/1.0 (+https://winning-tips.com)" },
    });
  } catch (error) {
    throw new Error(`${source.name} could not be reached.`, { cause: error });
  }

  if (!response.ok) throw new Error(`${source.name} returned HTTP ${response.status}.`);

  const body = await response.text();
  if (Buffer.byteLength(body, "utf8") > maxBytes) throw new Error(`${source.name} returned too much data.`);

  return extractBookingCodes(body);
}
