import "server-only";
import { createHash } from "node:crypto";
import type { PrismaClient, ReviewState, SlipCategory } from "@prisma/client";
import { slipSchedule } from "@/lib/bookings/schedule";
import type { LoadedSportyBetSlip } from "@/lib/bookings/sportybet";
import { countries, type CountryCode } from "@/lib/config/countries";
import { getDatabase } from "@/lib/db/client";
import { sportFromName } from "@/lib/sports/sport";
import { getAutomaticVipPrice } from "@/lib/vip/automatic-pricing";

/**
 * Writing a loaded slip into a card, its fixtures and its picks.
 *
 * One place, because a card has to look identical whether an admin typed the
 * code or a source published it — same dedupe, same pricing, same deck. What
 * differs is only where it came from and whether a human has seen it yet.
 */
const deckSlugByCategory = { FREE: "free-deck", VIP1: "vip-deck", VIP2: "vip-2-deck", VIP3: "vip-3-deck" } as const;
export const labelByCategory = { FREE: "Free Predictions", VIP1: "VIP 1 Predictions", VIP2: "VIP 2 Predictions", VIP3: "VIP 3 Predictions" } as const;

export type CardCategory = keyof typeof deckSlugByCategory;

export interface CreateBookingInput {
  slip: LoadedSportyBetSlip;
  code: string;
  category: CardCategory;
  countryCode: CountryCode;
  actorId: string;
  /** "manual", or the id of the source that published the code. */
  source?: string;
  sourceUrl?: string | null;
  reviewState?: ReviewState;
  database?: PrismaClient;
}

export type CreateBookingResult =
  | { ok: true; bookingId: string; bookingDate: string; priceMinor: number | null; games: number }
  | { ok: false; error: string };

function stableId(prefix: string, value: string) {
  return `${prefix}-${createHash("sha256").update(value.toLowerCase()).digest("hex").slice(0, 20)}`;
}

function splitPrediction(value: string | null | undefined) {
  const prediction = value?.trim() || "Selection unavailable";
  const match = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(prediction);
  return match ? { selection: match[1].trim(), market: match[2].trim() } : { selection: prediction, market: "SportyBet Selection" };
}

export async function createBookingFromSlip(input: CreateBookingInput): Promise<CreateBookingResult> {
  const database = input.database ?? getDatabase();
  const country = countries[input.countryCode];
  if (!country.enabled) return { ok: false, error: `${country.name} is not live yet.` };

  // Refuse the whole slip before writing anything if a leg is a sport we do not
  // publish for, including virtual and e-sports variants (guide §2).
  const unsupported = input.slip.games.find((game) => sportFromName(game.sport) === null);
  if (unsupported) return { ok: false, error: `This slip includes ${unsupported.sport}, which Winning Tips does not publish predictions for.` };

  // Tomorrow's slips can be prepared today without appearing as today's card.
  const { deadline, bookingDate } = slipSchedule(input.slip.games.map((game) => game.kickoffAt), input.slip.deadline);

  const exists = await database.booking.findUnique({ where: { code: input.code }, select: { id: true } });
  if (exists) return { ok: false, error: "That booking code has already been loaded." };

  const deck = await database.deck.findUnique({ where: { slug: deckSlugByCategory[input.category] }, select: { id: true } });
  if (!deck) return { ok: false, error: `The ${labelByCategory[input.category]} deck is not configured.` };

  const plan = input.category === "FREE" ? null : await database.plan.findFirst({ where: { deckId: deck.id, isActive: true }, select: { id: true } });
  if (input.category !== "FREE" && !plan) return { ok: false, error: `The ${labelByCategory[input.category]} plan is not configured.` };

  // The tier default is only a price in its own currency. Another edition's card
  // starts unpriced and is priced from games control.
  const pricing = input.category !== "FREE" && country.currency === "GHS"
    ? await getAutomaticVipPrice(database, input.category, country.countryCode)
    : null;
  const priceMinor = pricing?.priceMinor ?? null;

  const reviewState: ReviewState = input.reviewState ?? "APPROVED";
  const approved = reviewState === "APPROVED";
  const totalOdds = input.slip.totalOdds ?? input.slip.games.reduce((total, game) => total * game.odd, 1);
  const bookingDateValue = new Date(`${bookingDate}T00:00:00.000Z`);

  const booking = await database.$transaction(async (transaction) => {
    // Only a card that is actually going on sale replaces the standing one; a
    // card waiting for review must not take today's slot from a live card.
    if (approved && input.category !== "FREE") {
      await transaction.booking.updateMany({
        where: { countryCode: country.countryCode, category: input.category as SlipCategory, bookingDate: bookingDateValue, isActive: true },
        data: { isActive: false },
      });
    }

    const created = await transaction.booking.create({
      data: {
        title: labelByCategory[input.category],
        platform: "SportyBet",
        code: input.code,
        category: input.category as SlipCategory,
        countryCode: country.countryCode,
        currency: country.currency,
        shareUrl: input.slip.shareURL || null,
        totalOdds: totalOdds.toFixed(2),
        priceMinor,
        // A tier closed for sales stays closed when tomorrow's card loads, and
        // nothing unreviewed is ever open.
        isSoldOut: input.category !== "FREE" || !approved,
        deadline,
        bookingDate: bookingDateValue,
        isActive: approved,
        source: input.source ?? "manual",
        sourceUrl: input.sourceUrl ?? null,
        reviewState,
      },
    });

    for (const [index, game] of input.slip.games.entries()) {
      const leagueExternalId = game.sportybet.tournamentId;
      const league = await transaction.league.upsert({
        where: { externalId: leagueExternalId },
        update: { name: game.tournament, country: game.category, sport: sportFromName(game.sport) ?? "FOOTBALL" },
        create: { externalId: leagueExternalId, name: game.tournament, slug: leagueExternalId, country: game.category, sport: sportFromName(game.sport) ?? "FOOTBALL" },
        select: { id: true },
      });
      const homeExternalId = stableId("sportybet-team", `${game.sport}:${game.home}`);
      const awayExternalId = stableId("sportybet-team", `${game.sport}:${game.away}`);
      const [homeTeam, awayTeam] = await Promise.all([
        transaction.team.upsert({ where: { externalId: homeExternalId }, update: { name: game.home }, create: { externalId: homeExternalId, name: game.home }, select: { id: true } }),
        transaction.team.upsert({ where: { externalId: awayExternalId }, update: { name: game.away }, create: { externalId: awayExternalId, name: game.away }, select: { id: true } }),
      ]);
      const fixtureExternalId = game.sportybet.eventId;
      const kickoffAt = new Date(game.kickoffAt);
      const providerData = {
        source: `SportyBet ${country.name} booking code`,
        bookingCode: input.code,
        country: country.sportyBetRegion,
        sportId: game.sportybet.sportId,
        categoryId: game.sportybet.categoryId,
        tournamentId: game.sportybet.tournamentId,
        eventId: game.sportybet.eventId,
        marketId: game.sportybet.marketId,
        outcomeId: game.sportybet.outcomeId,
        specifier: game.sportybet.specifier ?? null,
      };
      const fixture = await transaction.fixture.upsert({
        where: { externalId: fixtureExternalId },
        update: { leagueId: league.id, homeTeamId: homeTeam.id, awayTeamId: awayTeam.id, kickoffAt, providerData },
        create: { externalId: fixtureExternalId, leagueId: league.id, homeTeamId: homeTeam.id, awayTeamId: awayTeam.id, kickoffAt, provider: "sportybet", providerData },
        select: { id: true },
      });
      const prediction = splitPrediction(game.prediction);
      await transaction.prediction.create({
        data: {
          slug: `${input.code.toLowerCase()}-${index + 1}-${Date.now().toString(36)}`,
          fixtureId: fixture.id,
          deckId: deck.id,
          bookingId: created.id,
          market: prediction.market,
          selection: prediction.selection,
          sourceData: { marketId: game.sportybet.marketId, outcomeId: game.sportybet.outcomeId, specifier: game.sportybet.specifier ?? null },
          odds: game.odd.toFixed(2),
          confidence: 70,
          analysis: input.source && input.source !== "manual"
            ? `Collected from ${input.source}'s published booking code ${input.code}. An admin reviews this selection and analysis before it is sold.`
            : `Imported from SportyBet booking code ${input.code}. The admin can edit this selection and analysis before or after publication.`,
          visibility: input.category === "FREE" ? "FREE" : "PREMIUM",
          // An unreviewed card's picks stay drafts, so nothing reaches a member
          // before a human has looked at the card.
          status: approved ? "PUBLISHED" : "DRAFT",
          result: "PENDING",
          publishAt: approved ? new Date() : null,
          createdById: input.actorId,
        },
      });
    }
    return created;
  }, { maxWait: 10_000, timeout: 60_000 });

  return { ok: true, bookingId: booking.id, bookingDate, priceMinor, games: input.slip.games.length };
}
