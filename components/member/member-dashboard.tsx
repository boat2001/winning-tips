import Link from "next/link";
import { ChannelLinks } from "@/components/brand/channel-links";
import { PurchasedVipGames } from "@/components/member/purchased-vip-games";
import { FeaturedVipMatches } from "@/components/predictions/featured-vip-matches";
import { PredictionBoard } from "@/components/predictions/prediction-board";
import { HeroPlate } from "@/components/ui/hero-plate";
import { Shell, SectionHead } from "@/components/ui/layout";
import { getPremiumAccessContext } from "@/lib/auth/authorization";
import { adminRoles } from "@/lib/auth/constants";
import type { getCurrentUser } from "@/lib/auth/session";
import { getCurrentVipBookingsByDate, getPublicBookingsByDates } from "@/lib/bookings/queries";
import { getFixtureDateWindows } from "@/lib/football/dates";
import { getPredictionDayBoard } from "@/lib/predictions/queries";
import { getActiveVipPlans, getMemberVipPurchases } from "@/lib/vip/queries";

type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

function firstName(user: CurrentUser) {
  return (user.displayName || user.username).trim().split(/\s+/)[0];
}

const datelineFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Africa/Accra",
});

/**
 * The signed-in masthead carries the same photographic plate as the homepage,
 * under the same white scrim, so a member does not land on a plainer version of
 * the site. It differs in what it says rather than how it looks: a greeting, the
 * three counters that matter, and straight into the card.
 */
export async function MemberDashboard({ user }: { user: CurrentUser }) {
  const access = await getPremiumAccessContext(user);
  const windows = getFixtureDateWindows();
  const todayDate = windows[1].date;
  const [days, bookingsByDate, plans, currentVipBookings, vipPurchases] = await Promise.all([
    getPredictionDayBoard(new Date(), access),
    getPublicBookingsByDates(windows.map((day) => day.date)),
    getActiveVipPlans(),
    getCurrentVipBookingsByDate(todayDate),
    getMemberVipPurchases(user.id),
  ]);

  const todayCount = days.find((day) => day.key === "today")?.predictions.length ?? 0;
  const openGames = vipPurchases.reduce(
    (total, purchase) => total + purchase.games.filter((game) => game.result === "PENDING").length,
    0,
  );

  return (
    <>
      <section className="border-b border-line-2 bg-surface">
        <Shell>
          <div className="flex items-center justify-between gap-4 border-b border-line py-3">
            <p className="eyebrow">{datelineFormatter.format(new Date())}</p>
            <Link href="/activity" className="eyebrow eyebrow-blue transition-colors hover:text-ink">
              Activity →
            </Link>
          </div>
        </Shell>

        <HeroPlate>
          <Shell className="relative z-10">
            <div className="flex flex-col gap-8 py-12 lg:flex-row lg:items-end lg:justify-between lg:py-14">
              <div className="max-w-xl">
                <p className="eyebrow eyebrow-blue">Signed in</p>
                <h1 className="display-heading mt-3 text-[clamp(2.25rem,7vw,3.75rem)] font-bold leading-[0.92]">
                  Back again, {firstName(user)}
                </h1>
                <p className="mt-4 max-w-lg text-base leading-7 text-ink-2">
                  Today&apos;s VIP slips are up. Anything you buy stays unlocked for good — and the
                  free card is below.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/vip" className="btn btn-primary">
                    Today&apos;s VIP slips
                  </Link>
                  <Link href="#dashboard-predictions" className="btn btn-ghost bg-surface">
                    Free tips
                  </Link>
                </div>
              </div>

              {/* The counters sit on the thin end of the scrim, so they get their
                  own solid plate rather than relying on the wash for contrast. */}
              <dl className="grid shrink-0 grid-cols-3 divide-x divide-line-2 border border-line-2 bg-surface lg:min-w-[24rem]">
                <div className="px-4 py-5 lg:px-6">
                  <dd className="num text-3xl font-semibold leading-none text-blue">{vipPurchases.length}</dd>
                  <dt className="eyebrow mt-2">VIP slips</dt>
                </div>
                <div className="px-4 py-5 lg:px-6">
                  <dd className="num text-3xl font-semibold leading-none">{openGames}</dd>
                  <dt className="eyebrow mt-2">Games open</dt>
                </div>
                <div className="px-4 py-5 lg:px-6">
                  <dd className="num text-3xl font-semibold leading-none">{todayCount}</dd>
                  <dt className="eyebrow mt-2">On the card</dt>
                </div>
              </dl>
            </div>
          </Shell>
        </HeroPlate>

        <Shell>
          <div className="flex flex-wrap items-center gap-4 border-t border-line py-5">
            <span className="eyebrow">Join the free community</span>
            <ChannelLinks compact />
          </div>
        </Shell>
      </section>

      <PurchasedVipGames purchases={vipPurchases} />

      <section id="dashboard-predictions" className="scroll-mt-24 bg-paper py-12 sm:py-16">
        <Shell>
          <SectionHead
            kicker="Yesterday · Today · Tomorrow"
            title="The card"
            count={`${todayCount} today`}
            action={{ label: "All predictions", href: "/predictions" }}
          />
          <div className="mt-6">
            <PredictionBoard days={days} bookingsByDate={bookingsByDate} />
          </div>

          <div className="mt-14">
            <FeaturedVipMatches
              plans={plans}
              bookings={currentVipBookings}
              userSignedIn
              purchasedBookingIds={vipPurchases.flatMap((purchase) => (purchase.bookingId ? [purchase.bookingId] : []))}
              paymentsConfigured={Boolean(process.env.PAYSTACK_SECRET_KEY)}
              previewPurchaseCtas={adminRoles.includes(user.role as (typeof adminRoles)[number])}
              loginNext="/#featured-vip-matches"
            />
          </div>
        </Shell>
      </section>
    </>
  );
}
