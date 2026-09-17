import "server-only";

import { unstable_cache } from "next/cache";
import { getMemberCountryCode } from "@/lib/app/preferences";
import { getCurrentVipBookingsByDate } from "@/lib/bookings/queries";
import { publicVipTag } from "@/lib/cache/tags";
import { resolveMemberCountry } from "@/lib/config/countries";
import { getDatabase } from "@/lib/db/client";
import { getFixtureDateWindows } from "@/lib/football/dates";

const getCachedActiveVipPlans = unstable_cache(async function getCachedActiveVipPlans() {
  return getDatabase().plan.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      priceMinor: true,
      currency: true,
      isSoldOut: true,
      deck: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { sortOrder: "asc" },
  });
}, ["active-vip-plans-v1"], { revalidate: 60, tags: [publicVipTag] });

export async function getActiveVipPlans() {
  return getCachedActiveVipPlans();
}

export async function getMemberVipPurchases(userId: string) {
  const payments = await getDatabase().payment.findMany({
    where: { userId, status: "SUCCESS" },
    select: {
      id: true,
      bookingId: true,
      amountMinor: true,
      currency: true,
      paidAt: true,
      createdAt: true,
      plan: { select: { id: true, name: true } },
      booking: {
        select: {
          title: true,
          platform: true,
          code: true,
          shareUrl: true,
          totalOdds: true,
          predictions: {
            where: { status: "PUBLISHED", visibility: "PREMIUM" },
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
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return payments.map((payment) => {
    const purchasedAt = payment.paidAt ?? payment.createdAt;

    return {
      id: payment.id,
      bookingId: payment.bookingId,
      planId: payment.plan?.id ?? null,
      planName: payment.plan?.name ?? payment.booking?.title ?? "VIP card",
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      purchasedAt,
      booking: payment.booking ? {
        title: payment.booking.title,
        platform: payment.booking.platform,
        code: payment.booking.code,
        shareUrl: payment.booking.shareUrl,
        totalOdds: payment.booking.totalOdds ? Number(payment.booking.totalOdds) : null,
      } : null,
      games: (payment.booking?.predictions ?? []).map((prediction) => ({
        id: prediction.id,
        homeTeam: prediction.fixture.homeTeam.name,
        awayTeam: prediction.fixture.awayTeam.name,
        league: prediction.fixture.league.name,
        kickoffAt: prediction.fixture.kickoffAt,
        market: prediction.market,
        selection: prediction.selection,
        odds: Number(prediction.odds),
        result: prediction.result,
      })),
    };
  });
}

/**
 * Everything the VIP slip cards need for today, in the viewer's country
 * edition.
 *
 * Never throws, and each part fails on its own. The cards are drawn from the
 * tiers whatever happens, so a failing bookings query must not also take the
 * plans with it — which is exactly how the three cards once vanished behind a
 * single "couldn't load" box. `unavailable` tells the page to say the slip
 * details may be missing.
 */
export async function getTodaysVipSlips(userId: string | null) {
  const chosenCountry = userId ? await getMemberCountryCode(userId).catch(() => null) : null;
  const { countryCode } = resolveMemberCountry(chosenCountry);
  const [plans, bookings, purchasedBookingIds] = await Promise.all([
    getActiveVipPlans().catch(() => null),
    getCurrentVipBookingsByDate(getFixtureDateWindows()[1].date, countryCode).catch(() => null),
    userId ? getPurchasedBookingIds(userId).catch(() => [] as string[]) : Promise.resolve([] as string[]),
  ]);
  return {
    plans: plans ?? [],
    bookings: bookings ?? new Map(),
    purchasedBookingIds,
    unavailable: plans === null || bookings === null,
  };
}

export async function getPurchasedBookingIds(userId: string) {
  const payments = await getDatabase().payment.findMany({
    where: { userId, status: "SUCCESS", bookingId: { not: null } },
    select: { bookingId: true },
  });
  return payments.flatMap((payment) => payment.bookingId ? [payment.bookingId] : []);
}
