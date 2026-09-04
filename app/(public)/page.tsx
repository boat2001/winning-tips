import Link from "next/link";
import type { Metadata } from "next";
import { PredictionBoard } from "@/components/predictions/prediction-board";
import { MemberDashboard } from "@/components/member/member-dashboard";
import { ChannelLinks } from "@/components/brand/channel-links";
import { HeroPlate } from "@/components/ui/hero-plate";
import { Shell, SectionHead } from "@/components/ui/layout";
import { fromDateKey, getFixtureDateWindows } from "@/lib/football/dates";
import { getPredictionDayBoard, type PublicPrediction } from "@/lib/predictions/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { getPremiumAccessContext } from "@/lib/auth/authorization";
import { getPublicBookingsByDates } from "@/lib/bookings/queries";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export const dynamic = "force-dynamic";

const datelineFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Africa/Accra",
});

const method = [
  ["01", "The reasoning is on the page", "Every free pick carries its market, selection, odds and the thinking behind it. Nothing is a bare tip with no working shown."],
  ["02", "Losses stay up", "Settled predictions are not quietly deleted. The win rate on this page counts every settled pick, won or lost."],
  ["03", "Pay only when you want to", "The daily free card needs no account. VIP slips are bought one at a time — no subscription, no auto-renewal."],
] as const;

export default async function HomePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const referenceDate = fromDateKey((await searchParams).date) ?? new Date();
  const user = await getCurrentUser();
  if (user) return <MemberDashboard user={user} />;

  const premiumAccess = await getPremiumAccessContext(user);
  const windows = getFixtureDateWindows(referenceDate);
  let days: Array<{ key: "yesterday" | "today" | "tomorrow"; label: string; date: string; predictions: PublicPrediction[] }> = windows.map((window) => ({
    key: window.key,
    label: window.label,
    date: window.date,
    predictions: [],
  }));
  let bookingsByDate: Record<string, Array<{ id: string; title: string; platform: string; code: string }>> = {};

  try {
    [days, bookingsByDate] = await Promise.all([
      getPredictionDayBoard(referenceDate, premiumAccess),
      getPublicBookingsByDates(windows.map((window) => window.date)),
    ]);
  } catch {
    // The marketing page remains available while a local database is starting.
  }

  const freeDays = days.map((day) => ({
    ...day,
    predictions: day.predictions.filter((prediction) => prediction.visibility === "FREE"),
  }));
  const freeToday = freeDays.find((day) => day.key === "today")?.predictions.length ?? 0;
  const vipToday = days.find((day) => day.key === "today")?.predictions.filter((prediction) => prediction.visibility !== "FREE").length ?? 0;

  return (
    <>
      {/* Masthead. The photograph runs full-bleed behind the headline, under a
          scrim that washes it toward white. The wash is near-solid on the left so
          the ink type keeps its contrast, and thins out to the right so the
          stadium still reads — a tinted photographic ground, not a dark band. */}
      <section className="border-b border-line-2 bg-surface">
        <Shell>
          <div className="flex items-center justify-between gap-4 border-b border-line py-3">
            <p className="eyebrow">{datelineFormatter.format(new Date())}</p>
            <p className="eyebrow eyebrow-blue">
              <span className="num">{vipToday}</span> VIP · <span className="num">{freeToday}</span> free today
            </p>
          </div>
        </Shell>

        <HeroPlate>
          <Shell className="relative z-10">
            <div className="max-w-2xl py-16 sm:py-20 lg:py-24">
              <p className="eyebrow eyebrow-blue">VIP football slips · Ghana</p>
              <h1 className="display-heading mt-4 text-[clamp(2.75rem,10vw,6rem)] font-bold leading-[0.88]">
                Read the game.
                <br />
                Win the{" "}
                <span className="relative whitespace-nowrap">
                  cash.
                  <span aria-hidden="true" className="absolute inset-x-0 -bottom-1 h-[7px] bg-blue" />
                </span>
              </h1>
              <p className="mt-7 max-w-lg text-base leading-7 text-ink-2">
                Every matchday we publish VIP slips — the full book, with the market, selection,
                odds and reasoning on every pick. A free card goes up daily too.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/vip" className="btn btn-primary">
                  Today&apos;s VIP slips
                </Link>
                <Link href="#free-tips" className="btn btn-ghost bg-surface">
                  Free tips
                </Link>
              </div>
              <div className="mt-9 max-w-md border-t border-line-2 pt-6">
                <p className="eyebrow">Join the free community</p>
                <ChannelLinks className="mt-3" />
              </div>
            </div>
          </Shell>
        </HeroPlate>
      </section>

      <section id="free-tips" className="scroll-mt-24 bg-paper py-12 sm:py-16">
        <Shell>
          <SectionHead
            kicker="No account needed"
            title="Today's free card"
            count={`${freeToday} ${freeToday === 1 ? "tip" : "tips"}`}
            action={{ label: "All predictions", href: "/predictions" }}
          />
          <div className="mt-6">
            <PredictionBoard days={freeDays} bookingsByDate={bookingsByDate} />
          </div>
        </Shell>
      </section>

      <section className="border-t border-line-2 bg-surface py-12 sm:py-16">
        <Shell>
          <SectionHead kicker="How we work" title="What you actually get" />
          <div className="mt-8 grid divide-y divide-line-2 md:grid-cols-3 md:divide-x md:divide-y-0">
            {method.map(([number, title, copy]) => (
              <article key={number} className="px-0 py-6 md:px-6 md:py-0 md:first:pl-0 md:last:pr-0">
                <div className="flex items-baseline gap-3">
                  <span className="num shrink-0 text-lg font-semibold text-blue">{number}</span>
                  <h3 className="display-heading min-w-0 text-xl font-semibold">{title}</h3>
                </div>
                <p className="mt-3 max-w-sm text-sm leading-6 text-ink-2">{copy}</p>
              </article>
            ))}
          </div>
        </Shell>
      </section>

      {/* The closing call to action takes the lightest blue tint rather than a
          solid brand slab, so it lifts off the paper without going dark. */}
      <section className="border-y border-line-2 bg-blue-wash py-12 sm:py-16">
        <Shell>
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow eyebrow-blue">Ready when you are</p>
              <h2 className="display-heading mt-3 max-w-xl text-[clamp(1.75rem,5vw,2.75rem)] font-bold leading-[0.95]">
                Create a free account and keep the whole card
              </h2>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link href="/register" className="btn btn-primary">
                Create account
              </Link>
              <Link href="/vip" className="btn btn-ghost">
                VIP slips
              </Link>
            </div>
          </div>
        </Shell>
      </section>

      <section id="responsible" className="bg-paper py-6">
        <Shell>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="eyebrow">18+ only · Responsible gaming</p>
            <p className="text-xs text-muted">
              Predictions are opinions, never guarantees. Set a limit before you stake and never chase a loss.
            </p>
          </div>
        </Shell>
      </section>
    </>
  );
}
