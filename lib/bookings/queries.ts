import "server-only";

import { unstable_cache } from "next/cache";
import { publicBookingTag, publicPredictionTag, publicVipTag } from "@/lib/cache/tags";
import { isDesignPreview } from "@/lib/config/countries";
import { getDatabase } from "@/lib/db/client";
import { getFixtureDateWindows, getUtcDayRange } from "@/lib/football/dates";

export interface FreeSlipGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoffAt: string;
  market: string;
  selection: string;
  odds: string;
  result: string;
}

export interface FreeSlip {
  id: string;
  title: string;
  platform: string;
  code: string;
  shareUrl: string | null;
  totalOdds: string | null;
  games: FreeSlipGame[];
}

export interface FreeSlipDay {
  label: "Today" | "Tomorrow";
  date: string;
  slips: FreeSlip[];
}

const getCachedFreeSlipsByDate = unstable_cache(async function getCachedFreeSlipsByDate(date: string): Promise<FreeSlip[]> {
  const bookings = await getDatabase().booking.findMany({
    where: { bookingDate: getUtcDayRange(date).start, category: "FREE", isActive: true, deletedAt: null },
    select: {
      id: true,
      title: true,
      platform: true,
      code: true,
      shareUrl: true,
      totalOdds: true,
      predictions: {
        // Same visibility rules as the tips list: published, released, and
        // never mock-provider demo fixtures (guide §21.8).
        where: {
          status: "PUBLISHED",
          visibility: "FREE",
          OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }],
          fixture: { provider: { not: "mock" } },
        },
        select: {
          id: true,
          market: true,
          selection: true,
          odds: true,
          result: true,
          fixture: {
            select: {
              kickoffAt: true,
              league: { select: { name: true } },
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
            },
          },
        },
        orderBy: { fixture: { kickoffAt: "asc" } },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return bookings.map((booking) => ({
    id: booking.id,
    title: booking.title,
    platform: booking.platform,
    code: booking.code,
    // Admin-entered, and rendered as a link: anything but a web URL (say a
    // javascript: URI) is dropped rather than trusted.
    shareUrl: booking.shareUrl && /^https?:\/\//i.test(booking.shareUrl) ? booking.shareUrl : null,
    totalOdds: booking.totalOdds?.toString() ?? null,
    games: booking.predictions.map((prediction) => ({
      id: prediction.id,
      homeTeam: prediction.fixture.homeTeam.name,
      awayTeam: prediction.fixture.awayTeam.name,
      league: prediction.fixture.league.name,
      kickoffAt: prediction.fixture.kickoffAt.toISOString(),
      market: prediction.market,
      selection: prediction.selection,
      odds: prediction.odds.toString(),
      result: prediction.result,
    })),
  }));
}, ["free-slips-by-date-v1"], { revalidate: 60, tags: [publicBookingTag, publicPredictionTag] });

/**
 * The free slips to put in front of a visitor: today's, or tomorrow's when
 * today has none yet — a code for tomorrow's games can be booked tonight,
 * which beats showing an empty card.
 *
 * Never throws. The landing page renders it above the fold for guests, and a
 * database hiccup there should cost one section, not the whole page.
 */
export async function getFreeSlips(reference = new Date()): Promise<FreeSlipDay> {
  const [, today, tomorrow] = getFixtureDateWindows(reference);
  const empty: FreeSlipDay = { label: "Today", date: today.date, slips: [] };
  if (isDesignPreview()) return empty;

  try {
    const todays = await getCachedFreeSlipsByDate(today.date);
    if (todays.length) return { label: "Today", date: today.date, slips: todays };
    const tomorrows = await getCachedFreeSlipsByDate(tomorrow.date);
    return tomorrows.length ? { label: "Tomorrow", date: tomorrow.date, slips: tomorrows } : empty;
  } catch {
    return empty;
  }
}

const getCachedPublicBookingsByDates = unstable_cache(async function getCachedPublicBookingsByDates(dates: string[]) {
  if (!dates.length) return {};
  const bookings = await getDatabase().booking.findMany({
    where: {
      bookingDate: { in: dates.map((date) => getUtcDayRange(date).start) },
      category: "FREE",
      isActive: true,
      deletedAt: null,
    },
    select: { id: true, title: true, platform: true, code: true, bookingDate: true },
    orderBy: [{ bookingDate: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return Object.fromEntries(dates.map((date) => [date, bookings
    .filter((booking) => booking.bookingDate.toISOString().slice(0, 10) === date)
    .map((booking) => ({ id: booking.id, title: booking.title, platform: booking.platform, code: booking.code }))]));
}, ["public-bookings-by-date-v1"], { revalidate: 60, tags: [publicBookingTag] });

export async function getPublicBookingsByDates(dates: string[]) {
  return getCachedPublicBookingsByDates([...dates].sort());
}

export async function getPublicBookingsByDate(date: string) {
  return (await getPublicBookingsByDates([date]))[date] ?? [];
}

const getCachedCurrentVipBookingsByDate = unstable_cache(async function getCachedCurrentVipBookingsByDate(date: string, countryCode: string) {
  const { start, end } = getUtcDayRange(date);
  const bookings = await getDatabase().booking.findMany({
    where: { countryCode, bookingDate: { gte: start, lt: end }, category: { in: ["VIP1", "VIP2", "VIP3"] }, isActive: true, deletedAt: null },
    select: {
      id: true,
      category: true,
      priceMinor: true,
      currency: true,
      isSoldOut: true,
      deadline: true,
      predictions: {
        where: { status: "PUBLISHED", visibility: "PREMIUM" },
        select: {
          id: true,
          market: true,
          selection: true,
          result: true,
          fixture: { select: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return bookings.map((booking) => ({
    ...booking,
    // Resolved here rather than during render: the buy screen only needs to
    // know whether sales have closed, and checkout re-checks the real deadline.
    salesClosed: booking.deadline === null || booking.deadline.getTime() <= Date.now(),
    predictions: booking.predictions.map((prediction) => ({
      id: prediction.id,
      result: prediction.result,
      market: prediction.result === "PENDING" ? null : prediction.market,
      selection: prediction.result === "PENDING" ? null : prediction.selection,
      fixture: prediction.fixture,
    })),
  }));
}, ["current-vip-bookings-v2"], { revalidate: 60, tags: [publicVipTag] });

export async function getCurrentVipBookingsByDate(date: string, countryCode = "GH") {
  const bookings = await getCachedCurrentVipBookingsByDate(date, countryCode);
  return new Map(bookings.map((booking) => [booking.category, { ...booking, salesClosed: !booking.deadline || new Date(booking.deadline).getTime() <= Date.now() }]));
}
