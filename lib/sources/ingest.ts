import "server-only";
import type { PrismaClient } from "@prisma/client";
import { createBookingFromSlip } from "@/lib/bookings/create";
import { loadSportyBetSlip } from "@/lib/bookings/sportybet";
import { launchCountry } from "@/lib/config/countries";
import { getDatabase } from "@/lib/db/client";
import { fetchSourceCodes, type Fetcher } from "@/lib/sources/booking-codes";
import { settledLegsForSource } from "@/lib/sources/queries";
import { enabledSources, type TipSource } from "@/lib/sources/registry";
import { judgeSource, summariseRecord, type SourceThresholds, defaultSourceThresholds } from "@/lib/sources/scorecard";
import { defaultScreenRules, screenSlip, type ScreenRules } from "@/lib/sources/screening";

/**
 * Collecting published booking codes and turning the sound ones into cards.
 *
 * The rule the whole job turns on: nothing collected is ever put on sale by
 * itself. A slip that clears screening from a source with a proven record is
 * written as an approved card an admin can price; everything else waits in the
 * review queue with the reason attached. No filter here claims to know a winner
 * — it only refuses what we could not sell honestly.
 */
/* Written into an automation run's JSON summary, so these are type aliases:
   an interface has no implicit index signature and Prisma's JSON input needs one. */
export type IngestedSlip = {
  source: string;
  code: string;
  outcome: "created" | "pending-review" | "skipped" | "failed";
  detail: string;
}

export type IngestSummary = {
  sources: number;
  codesSeen: number;
  created: number;
  pendingReview: number;
  skipped: number;
  failed: number;
  slips: IngestedSlip[];
}

export interface IngestOptions {
  database?: PrismaClient;
  fetcher?: Fetcher;
  rules?: ScreenRules;
  thresholds?: SourceThresholds;
  now?: Date;
  /** The user rows are attributed to; the automation's system admin by default. */
  actorId?: string;
}

async function systemActorId(database: PrismaClient): Promise<string | null> {
  const actor = await database.user.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN"] }, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return actor?.id ?? null;
}

export async function ingestSource(source: TipSource, options: IngestOptions = {}): Promise<IngestedSlip[]> {
  const database = options.database ?? getDatabase();
  const now = options.now ?? new Date();
  const results: IngestedSlip[] = [];

  const actorId = options.actorId ?? (await systemActorId(database));
  if (!actorId) return [{ source: source.id, code: "—", outcome: "failed", detail: "No active admin to attribute collected cards to." }];

  const codes = await fetchSourceCodes(source, options.fetcher);
  if (codes.length === 0) return [{ source: source.id, code: "—", outcome: "skipped", detail: "No booking codes published on the page." }];

  // Judged once per run: the record cannot change between two codes.
  const record = summariseRecord(await settledLegsForSource(source.id, database));
  const trust = judgeSource(record, options.thresholds ?? defaultSourceThresholds);

  for (const code of codes) {
    const known = await database.booking.findUnique({ where: { code }, select: { id: true } });
    if (known) {
      results.push({ source: source.id, code, outcome: "skipped", detail: "Already loaded." });
      continue;
    }

    try {
      const slip = await loadSportyBetSlip(code);
      const verdict = screenSlip(
        slip.games.map((game) => ({
          market: game.prediction,
          selection: game.prediction,
          odds: game.odd,
          kickoffAt: game.kickoffAt,
          sport: game.sport,
          specifier: game.sportybet.specifier ?? null,
          homeTeam: game.home,
          awayTeam: game.away,
        })),
        options.rules ?? defaultScreenRules,
        now,
      );

      if (!verdict.sellable) {
        results.push({
          source: source.id,
          code,
          outcome: "skipped",
          detail: verdict.rejected.map((row) => `${row.reason}: ${row.detail}`).join(" · ").slice(0, 400),
        });
        continue;
      }

      // A slip that passes screening from a source without a record still waits
      // for a person. Screening says "sellable", not "proven".
      const reviewState = trust.trusted ? "APPROVED" : "PENDING_REVIEW";
      const created = await createBookingFromSlip({
        slip,
        code,
        // Collected cards arrive as free cards: pricing a VIP tier is a
        // decision for the admin who reviews it, in Games Control.
        category: "FREE",
        countryCode: launchCountry.countryCode,
        actorId,
        source: source.id,
        sourceUrl: source.url,
        reviewState,
        database,
      });

      if (!created.ok) {
        results.push({ source: source.id, code, outcome: "skipped", detail: created.error });
        continue;
      }

      results.push({
        source: source.id,
        code,
        outcome: trust.trusted ? "created" : "pending-review",
        detail: trust.reason,
      });
    } catch (error) {
      results.push({ source: source.id, code, outcome: "failed", detail: error instanceof Error ? error.message.slice(0, 300) : "The code could not be loaded." });
    }
  }

  return results;
}

export async function ingestEnabledSources(options: IngestOptions = {}): Promise<IngestSummary> {
  const sources = enabledSources();
  const slips: IngestedSlip[] = [];

  for (const source of sources) {
    try {
      slips.push(...(await ingestSource(source, options)));
    } catch (error) {
      slips.push({ source: source.id, code: "—", outcome: "failed", detail: error instanceof Error ? error.message.slice(0, 300) : "The source could not be read." });
    }
  }

  return {
    sources: sources.length,
    codesSeen: slips.filter((slip) => slip.code !== "—").length,
    created: slips.filter((slip) => slip.outcome === "created").length,
    pendingReview: slips.filter((slip) => slip.outcome === "pending-review").length,
    skipped: slips.filter((slip) => slip.outcome === "skipped").length,
    failed: slips.filter((slip) => slip.outcome === "failed").length,
    slips,
  };
}
