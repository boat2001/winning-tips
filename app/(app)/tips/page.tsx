import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { FeaturedTip } from "@/components/predictions/featured-tip";
import { ActiveFilterSummary, TipFilterRow } from "@/components/predictions/tip-filters";
import { TipListRow } from "@/components/predictions/tip-row";
import { sportLabel } from "@/components/ui/sport-icon";
import { PageHeader } from "@/components/app/page-header";
import { Panel } from "@/components/ui/surface";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentViewer } from "@/lib/app/current-viewer";
import { applyTipFilters, parseTipFilters } from "@/lib/domain/tip-filters";
import { getTipsData } from "@/lib/app/tips";
import { DataNotice } from "@/components/app/data-notice";

export const metadata: Metadata = {
  title: "Tips",
  description: "Today's football, basketball and tennis predictions with model confidence and market.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function TipsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [viewer, params] = await Promise.all([getCurrentViewer(), searchParams]);
  const filters = parseTipFilters(params);

  const data = await getTipsData();
  const filtered = [...applyTipFilters(data.tips, filters)].sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt));
  const featuredTip = filtered.find(t => !t.locked);
  const matchCount = filtered.length;

  // The featured pick is only meaningful in the unfiltered default view; under
  // a filter it would sit above a list it may not belong to.
  const showFeatured = filters.window === "today" && filters.sport === null && filters.query === null;

  // Lifted out of the list rather than shown twice. The same fixture appearing
  // as a highlight and again as row one is the kind of duplication that makes a
  // page feel generated rather than composed.
  const listed = showFeatured && featuredTip ? filtered.filter((tip) => tip.id !== featuredTip.id) : filtered;

  return (
    <div className="page-stack">
      {/* Count rather than a slogan: it is the one thing worth knowing before
          you read the list, and it changes with the filters. */}
      <PageHeader title="Tips" meta={matchCount === 1 ? "1 prediction published" : `${matchCount} predictions published`}>
        <TipFilterRow filters={filters} />
      </PageHeader>

      <DataNotice unavailable={data.unavailable} />
      {showFeatured && featuredTip ? <FeaturedTip tip={featuredTip} timezone={viewer.timezone} /> : null}

      <section className="section-stack">
        <ActiveFilterSummary filters={filters} />

        {listed.length > 0 ? (
          <h2 className="text-lg">
            {filters.sport ? `${sportLabel(filters.sport)} · ` : ""}
            {filters.window === "upcoming" ? "Coming up" : showFeatured && featuredTip ? "More from today" : "Today’s tips"}
          </h2>
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
