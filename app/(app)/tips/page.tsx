import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { FeaturedTip } from "@/components/predictions/featured-tip";
import { ActiveFilterSummary, TipFilterRow } from "@/components/predictions/tip-filters";
import { TipListRow } from "@/components/predictions/tip-row";
import { TipsBoard } from "@/components/predictions/tips-board";
import { VipSlipCards } from "@/components/predictions/vip-slip-cards";
import { sportLabel } from "@/components/ui/sport-icon";
import { PageHeader } from "@/components/app/page-header";
import { Panel, SectionHead } from "@/components/ui/surface";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentViewer } from "@/lib/app/current-viewer";
import { getTipsData } from "@/lib/app/tips";
import { adminRoles } from "@/lib/auth/constants";
import { getCurrentUser } from "@/lib/auth/session";
import { applyTipFilters, parseTipFilters } from "@/lib/domain/tip-filters";
import { getFreeTipsBoard } from "@/lib/predictions/board";
import { getTodaysVipSlips } from "@/lib/vip/queries";
import { DataNotice } from "@/components/app/data-notice";

export const metadata: Metadata = {
  title: "Tips",
  description: "Today's VIP slips, the free tips board with booking codes, and every published prediction.",
  alternates: { canonical: "/tips" },
};

export const dynamic = "force-dynamic";

/**
 * Three sections in order of what a visitor came for: today's VIP slips, the
 * free board with its booking codes, then every published tip with filters.
 *
 * A filter link (a sport tile, a search) is a request for the list, so while
 * one is active the list moves to the top instead of sitting below two
 * sections the visitor did not ask about.
 */
export default async function TipsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [viewer, params, user] = await Promise.all([getCurrentViewer(), searchParams, getCurrentUser()]);
  const filters = parseTipFilters(params);

  const [data, board, vip] = await Promise.all([
    getTipsData(),
    getFreeTipsBoard(),
    getTodaysVipSlips(user?.id ?? null),
  ]);
  const filtered = [...applyTipFilters(data.tips, filters)].sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt));
  const featuredTip = filtered.find(t => !t.locked);
  const matchCount = filtered.length;
  const filtering = filters.window !== "today" || filters.sport !== null || filters.query !== null;
  const freeToday = board.days.find((day) => day.key === "today")?.predictions.length ?? 0;

  // The featured pick is only meaningful in the unfiltered default view; under
  // a filter it would sit above a list it may not belong to.
  const showFeatured = !filtering;

  // Lifted out of the list rather than shown twice. The same fixture appearing
  // as a highlight and again as row one is the kind of duplication that makes a
  // page feel generated rather than composed.
  const listed = showFeatured && featuredTip ? filtered.filter((tip) => tip.id !== featuredTip.id) : filtered;

  const vipSection = (
    <VipSlipCards
      plans={vip.plans}
      bookings={vip.bookings}
      purchasedBookingIds={vip.purchasedBookingIds}
      signedIn={Boolean(user)}
      paymentsConfigured={Boolean(process.env.PAYSTACK_SECRET_KEY)}
      previewPurchaseCtas={Boolean(user && adminRoles.includes(user.role as (typeof adminRoles)[number]))}
      loginNext="/tips#vip-slips"
      unavailable={vip.unavailable}
    />
  );

  const freeSection = (
    <section id="free-tips" className="section-stack scroll-mt-24" aria-label="Free tips and predictions">
      <SectionHead title="Free Tips & Predictions" description="Yesterday and today, with the booking codes underneath." />
      <TipsBoard days={board.days} bookingsByDate={board.bookingsByDate} unavailable={board.unavailable} timezone={viewer.timezone} />
    </section>
  );

  const allTipsSection = (
    <section id="all-tips" className="section-stack scroll-mt-24" aria-label="All tips">
      <SectionHead title="All Tips" description={matchCount === 1 ? "1 prediction published" : `${matchCount} predictions published`} />
      <TipFilterRow filters={filters} />
      <DataNotice unavailable={data.unavailable} />
      {showFeatured && featuredTip ? <FeaturedTip tip={featuredTip} timezone={viewer.timezone} /> : null}
      <ActiveFilterSummary filters={filters} />

      {listed.length > 0 ? (
        <h3 className="text-lg">
          {filters.sport ? `${sportLabel(filters.sport)} · ` : ""}
          {filters.window === "upcoming" ? "Coming up" : showFeatured && featuredTip ? "More from today" : "Today’s tips"}
        </h3>
      ) : null}

      {listed.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {listed.map((tip) => (
            <TipListRow key={tip.id} tip={tip} timezone={viewer.timezone} />
          ))}
        </ul>
      ) : matchCount === 0 ? (
        <EmptyTips />
      ) : null}
    </section>
  );

  return (
    <div className="page-stack">
      <PageHeader title="Tips" meta={freeToday === 1 ? "1 free tip today" : `${freeToday} free tips today`} />
      {filtering ? allTipsSection : null}
      {vipSection}
      {freeSection}
      {filtering ? null : allTipsSection}
    </div>
  );
}

function EmptyTips() {
  return (
    <Panel className="flex flex-col items-center gap-3 px-5 py-10 text-center">
      <SearchX aria-hidden className="size-9 text-on-navy-muted" />
      <div>
        <h3 className="text-on-navy">No tips match these filters</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-on-navy-muted">
          Nothing is published for this combination yet. Try a different sport, or look at what is coming up.
        </p>
      </div>
      <div className="mt-1 flex flex-wrap justify-center gap-2.5">
        <ButtonLink href="/tips" variant="ghost" size="sm">
          Reset filters
        </ButtonLink>
        <ButtonLink href="/tips?window=upcoming" variant="primary" size="sm">
          See upcoming tips
        </ButtonLink>
      </div>
    </Panel>
  );
}
