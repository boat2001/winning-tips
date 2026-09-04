import type { Metadata } from "next";
import { PredictionBoard } from "@/components/predictions/prediction-board";
import { FeaturedVipMatches } from "@/components/predictions/featured-vip-matches";
import { PageMasthead, Shell } from "@/components/ui/layout";
import { getCurrentVipBookingsByDate, getPublicBookingsByDates } from "@/lib/bookings/queries";
import { getPredictionDayBoard } from "@/lib/predictions/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { getPremiumAccessContext } from "@/lib/auth/authorization";
import { adminRoles } from "@/lib/auth/constants";
import { fromDateKey, getFixtureDateWindows } from "@/lib/football/dates";
import { getActiveVipPlans, getPurchasedBookingIds } from "@/lib/vip/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Predictions",
  description: "Free daily football tips with the market, selection, odds and reasoning shown in full.",
  alternates: { canonical: "/predictions" },
};

export default async function PredictionsPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const referenceDate = fromDateKey((await searchParams).date) ?? new Date();
  const windows = getFixtureDateWindows(referenceDate);
  const bookingPromise = getPublicBookingsByDates(windows.map((day) => day.date));
  const user = await getCurrentUser();
  const premiumAccess = await getPremiumAccessContext(user);
  const [days, bookingsByDate, plans, currentVipBookings, purchasedBookingIds] = await Promise.all([
    getPredictionDayBoard(referenceDate, premiumAccess),
    bookingPromise,
    getActiveVipPlans(),
    getCurrentVipBookingsByDate(getFixtureDateWindows()[1].date),
    user ? getPurchasedBookingIds(user.id) : Promise.resolve([]),
  ]);
  const freeDays = days.map((day) => ({
    ...day,
    predictions: day.predictions.filter((prediction) => prediction.visibility === "FREE"),
  }));

  return (
    <>
      <PageMasthead
        kicker="Free card"
        title="Football predictions"
        lede="Yesterday, today and tomorrow. Search by team or competition, or jump to any date."
      />

      <Shell className="pb-16">
        <PredictionBoard days={freeDays} bookingsByDate={bookingsByDate} showViewAll={false} />

        <div className="mt-14">
          <FeaturedVipMatches
            plans={plans}
            bookings={currentVipBookings}
            userSignedIn={Boolean(user)}
            purchasedBookingIds={purchasedBookingIds}
            paymentsConfigured={Boolean(process.env.PAYSTACK_SECRET_KEY)}
            previewPurchaseCtas={Boolean(user && adminRoles.includes(user.role as (typeof adminRoles)[number]))}
          />
        </div>
      </Shell>
    </>
  );
}
