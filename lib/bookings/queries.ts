import "server-only";

import { unstable_cache } from "next/cache";
import { publicBookingTag, publicVipTag } from "@/lib/cache/tags";
import { getDatabase } from "@/lib/db/client";
import { getUtcDayRange } from "@/lib/football/dates";

const getCachedPublicBookingsByDates = unstable_cache(async function getCachedPublicBookingsByDates(dates: string[]) {
  if (!dates.length) return {};
  const bookings = await getDatabase().booking.findMany({
    where: {
      bookingDate: { in: dates.map((date) => getUtcDayRange(date).start) },
      category: "FREE",
      isActive: true,
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

const getCachedCurrentVipBookingsByDate = unstable_cache(async function getCachedCurrentVipBookingsByDate(date: string) {
  const { start, end } = getUtcDayRange(date);
  const bookings = await getDatabase().booking.findMany({
    where: { bookingDate: { gte: start, lt: end }, category: { in: ["VIP1", "VIP2", "VIP3"] }, isActive: true },
    select: {
      id: true,
      category: true,
      priceMinor: true,
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
    predictions: booking.predictions.map((prediction) => ({
      id: prediction.id,
      result: prediction.result,
      market: prediction.result === "PENDING" ? null : prediction.market,
      selection: prediction.result === "PENDING" ? null : prediction.selection,
      fixture: prediction.fixture,
    })),
  }));
}, ["current-vip-bookings-v1"], { revalidate: 60, tags: [publicVipTag] });

export async function getCurrentVipBookingsByDate(date: string) {
  const bookings = await getCachedCurrentVipBookingsByDate(date);
  return new Map(bookings.map((booking) => [booking.category, booking]));
}
