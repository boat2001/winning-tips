import Link from "next/link";
import type { Metadata } from "next";
import { FeaturedVipMatches } from "@/components/predictions/featured-vip-matches";
import { VipHistory } from "@/components/predictions/vip-history";
import { PageMasthead, Shell } from "@/components/ui/layout";
import { adminRoles } from "@/lib/auth/constants";
import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentVipBookingsByDate } from "@/lib/bookings/queries";
import { fromDateKey, getFixtureDateWindows, toDateKey } from "@/lib/football/dates";
import { getVipHistoryByDate } from "@/lib/predictions/queries";
import { getActiveVipPlans, getPurchasedBookingIds } from "@/lib/vip/queries";
import { getMemberCountryCode } from "@/lib/app/preferences";
import { resolveMemberCountry } from "@/lib/config/countries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "VIP Slips",
  description: "Buy a single Winning Tips VIP slip. No subscription, no auto-renewal, and the full archive is public.",
  alternates: { canonical: "/vip" },
};

export default async function VipPage({ searchParams }: { searchParams: Promise<{ historyDate?: string }> }) {
  const requestedDate = fromDateKey((await searchParams).historyDate);
  const windows = getFixtureDateWindows();
  const historyDate = requestedDate ? toDateKey(requestedDate) : windows[0].date;
  const currentDate = windows[1].date;
  const user = await getCurrentUser();
  // The member's edition decides which day's cards they see and in what currency.
  const country = resolveMemberCountry(user ? await getMemberCountryCode(user.id) : null);
  const [plans, history, currentVipBookings] = await Promise.all([
    getActiveVipPlans(),
    getVipHistoryByDate(historyDate),
    getCurrentVipBookingsByDate(currentDate, country.countryCode),
  ]);
  const purchasedBookingIds = user ? await getPurchasedBookingIds(user.id) : [];

  return (
    <>
      <PageMasthead
        kicker="Premium"
        title="VIP slips"
        lede="Each slip is a single day's book, bought once and yours for good. No subscription, nothing to cancel — and every settled slip goes into the public archive below."
      >
        {user ? (
          <div className="flex flex-col gap-3 border-y border-line-2 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              <span className="eyebrow block">Your purchases</span>
              <span className="mt-1.5 block font-semibold">
                {purchasedBookingIds.length
                  ? `${purchasedBookingIds.length} VIP ${purchasedBookingIds.length === 1 ? "slip" : "slips"} bought`
                  : "No VIP slips bought yet"}
              </span>
            </p>
            <div className="flex gap-5">
              <Link href="/home#my-vip-games" className="eyebrow eyebrow-blue transition-colors hover:text-ink">
                Your games →
              </Link>
              <Link href="/activity" className="eyebrow eyebrow-blue transition-colors hover:text-ink">
                Activity →
              </Link>
            </div>
          </div>
        ) : null}
      </PageMasthead>

      <Shell className="pb-16">
        <FeaturedVipMatches
          plans={plans}
          bookings={currentVipBookings}
          userSignedIn={Boolean(user)}
          purchasedBookingIds={purchasedBookingIds}
          paymentsConfigured={Boolean(process.env.PAYSTACK_SECRET_KEY)}
          previewPurchaseCtas={Boolean(user && adminRoles.includes(user.role as (typeof adminRoles)[number]))}
          loginNext="/vip#featured-vip-matches"
        />

        <VipHistory decks={history} date={historyDate} />

        <div className="mt-14 border-t-2 border-ink pt-6">
          <h2 className="display-heading text-xl font-semibold">Payment</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-2">
            Checkout runs through Paystack, with card and mobile money offered where available. Access is granted
            only after Winning Tips verifies the transaction directly with Paystack — we never see your card details.
          </p>
        </div>
      </Shell>
    </>
  );
}
