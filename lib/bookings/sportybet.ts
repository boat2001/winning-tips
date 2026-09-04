import "server-only";

import { z } from "zod";

const SPORTYBET_API_BASE = "https://www.sportybet.com/api/gh";
const SPORTYBET_PUBLIC_BASE = "https://www.sportybet.com/gh";
const SPORTYBET_SUCCESS_CODE = 10_000;
const requestTimeoutMs = 20_000;

const sportyBetSelectionSchema = z.object({
  eventId: z.string().trim().min(1).max(100),
  marketId: z.string().trim().min(1).max(100),
  outcomeId: z.string().trim().min(1).max(100),
  specifier: z.string().trim().max(200).optional(),
});

const sportyBetOutcomeSchema = z.object({
  eventId: z.string().min(1),
  estimateStartTime: z.coerce.number().int().positive(),
  homeTeamName: z.string().trim().min(1),
  awayTeamName: z.string().trim().min(1),
  sport: z.object({
    id: z.string().min(1),
    name: z.string().trim().min(1),
    category: z.object({
      id: z.string().min(1),
      name: z.string().trim().min(1),
      tournament: z.object({
        id: z.string().min(1),
        name: z.string().trim().min(1),
      }),
    }),
  }),
  markets: z.array(z.object({
    id: z.string().min(1),
    specifier: z.string().optional(),
    desc: z.string().trim().min(1),
    outcomes: z.array(z.object({
      id: z.string().min(1),
      odds: z.coerce.number().positive(),
      desc: z.string().trim().min(1),
    })).min(1).max(20),
  })).min(1).max(50),
});

const sportyBetResponseSchema = z.object({
  bizCode: z.number().int(),
  message: z.string().optional(),
  data: z.object({
    shareCode: z.string().trim().min(2),
    shareURL: z.string().url().optional(),
    deadline: z.coerce.number().int().positive(),
    ticket: z.object({ displayTotalOdds: z.union([z.string(), z.number()]).optional() }).passthrough().optional(),
    outcomes: z.array(sportyBetOutcomeSchema).max(50).optional(),
  }).optional(),
});

const gameSchema = z.object({
  home: z.string().trim().min(1),
  away: z.string().trim().min(1),
  prediction: z.string().trim().min(1),
  odd: z.number().positive(),
  sport: z.string().trim().min(1),
  category: z.string().trim().min(1),
  tournament: z.string().trim().min(1),
  kickoffAt: z.string().datetime(),
  sportybet: sportyBetSelectionSchema.extend({
    sportId: z.string().min(1),
    categoryId: z.string().min(1),
    tournamentId: z.string().min(1),
  }),
});

const slipSchema = z.object({
  deadline: z.string().datetime(),
  shareCode: z.string().trim().min(2),
  shareURL: z.string().url(),
  totalOdds: z.number().positive().optional(),
  games: z.array(gameSchema).min(1),
});

export type LoadedSportyBetSlip = z.infer<typeof slipSchema>;
type Fetcher = typeof fetch;

function getShareUrl(code: string) {
  return `${SPORTYBET_PUBLIC_BASE}/?shareCode=${encodeURIComponent(code)}`;
}

async function sportyBetRequest(path: string, init: RequestInit, fetcher: Fetcher) {
  let response: Response;
  try {
    response = await fetcher(`${SPORTYBET_API_BASE}${path}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(requestTimeoutMs),
      headers: { Accept: "application/json", ...init.headers },
    });
  } catch (error) {
    throw new Error("SportyBet could not be reached. Try again in a moment.", { cause: error });
  }

  if (!response.ok) throw new Error(`SportyBet returned HTTP ${response.status}. Try again later.`);

  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > 2_000_000) throw new Error("SportyBet returned too much data.");
  let payload: unknown;
  try {
    const rawBody = await response.text();
    if (Buffer.byteLength(rawBody, "utf8") > 2_000_000) throw new Error("SportyBet returned too much data.");
    payload = JSON.parse(rawBody);
  } catch (error) {
    if (error instanceof Error && error.message === "SportyBet returned too much data.") throw error;
    throw new Error("SportyBet returned an unreadable response.", { cause: error });
  }

  const parsed = sportyBetResponseSchema.safeParse(payload);
  if (!parsed.success) throw new Error("SportyBet returned an unsupported response format.");
  if (parsed.data.bizCode !== SPORTYBET_SUCCESS_CODE || !parsed.data.data) {
    throw new Error(parsed.data.message?.trim() || "SportyBet rejected that request.");
  }
  return parsed.data.data;
}

export function parseSportyBetSlip(payload: unknown): LoadedSportyBetSlip {
  const parsed = sportyBetResponseSchema.safeParse(payload);
  if (!parsed.success) throw new Error("SportyBet returned an unsupported response format.");
  if (parsed.data.bizCode !== SPORTYBET_SUCCESS_CODE || !parsed.data.data) {
    throw new Error(parsed.data.message?.trim() || "SportyBet rejected that booking code.");
  }

  const data = parsed.data.data;
  if (!data.outcomes?.length) throw new Error("That SportyBet code does not contain any available games.");

  const games = data.outcomes.map((event) => {
    const market = event.markets[0];
    const outcome = market.outcomes[0];
    return {
      home: event.homeTeamName,
      away: event.awayTeamName,
      prediction: `${outcome.desc} (${market.desc})`,
      odd: outcome.odds,
      sport: event.sport.name,
      category: event.sport.category.name,
      tournament: event.sport.category.tournament.name,
      kickoffAt: new Date(event.estimateStartTime).toISOString(),
      sportybet: {
        eventId: event.eventId,
        marketId: market.id,
        outcomeId: outcome.id,
        ...(market.specifier ? { specifier: market.specifier } : {}),
        sportId: event.sport.id,
        categoryId: event.sport.category.id,
        tournamentId: event.sport.category.tournament.id,
      },
    };
  });

  return slipSchema.parse({
    deadline: new Date(data.deadline).toISOString(),
    shareCode: data.shareCode,
    shareURL: getShareUrl(data.shareCode),
    totalOdds: data.ticket?.displayTotalOdds ? Number(data.ticket.displayTotalOdds) : undefined,
    games,
  });
}

export async function loadSportyBetSlip(code: string, fetcher: Fetcher = fetch): Promise<LoadedSportyBetSlip> {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,20}$/.test(normalized)) throw new Error("Enter a valid SportyBet booking code.");

  const response = await sportyBetRequest(`/orders/share/${encodeURIComponent(normalized)}`, { method: "GET" }, fetcher);
  return parseSportyBetSlip({ bizCode: SPORTYBET_SUCCESS_CODE, data: response });
}
