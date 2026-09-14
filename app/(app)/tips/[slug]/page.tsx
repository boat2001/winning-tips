import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Clock, ExternalLink, Gauge, ShieldAlert } from "lucide-react";
import { ConfidenceMeter, OddsPill } from "@/components/ui/metrics";
import { Card, Panel, SectionHead } from "@/components/ui/surface";
import { SportIcon, sportLabel } from "@/components/ui/sport-icon";
import { getCurrentViewer } from "@/lib/app/current-viewer";
import { confidenceLabel, isOddsStale, probabilityPercent } from "@/lib/domain/tips";
import { formatKickoff, isoDateTime } from "@/lib/utils/datetime";
import { getTip } from "@/lib/app/tips";
import { DataNotice } from "@/components/app/data-notice";
import { SaveTipButton } from "@/components/predictions/save-tip-button";

/**
 * Tip detail, per development guide §14.5.
 *
 * No mock was supplied for this screen. It is derived from the listing card's
 * visual language and the content §14.5 requires, and is marked `derived` in
 * design-reference/manifest.json for product-owner review.
 *
 * Two sections are deliberately absent rather than faked: recent form and
 * head-to-head need a sports-data provider, and the bookmaker panel needs an
 * approved operator. Both say so instead of showing placeholder numbers.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { tip, unavailable } = await getTip(slug);
  if (!tip) return { title: unavailable ? "Tip unavailable" : "Tip not found" };

  return {
    title: `${tip.home.name} vs ${tip.away.name}`,
    description: `${tip.competition}: ${tip.market} — ${tip.selection}. Model confidence and reasoning in full.`,
    robots: { index: false, follow: false },
  };
}

export const dynamic = "force-dynamic";

export default async function TipDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [viewer, { slug }] = await Promise.all([getCurrentViewer(), params]);
  const { tip, unavailable } = await getTip(slug);
  if (unavailable) return <DataNotice unavailable />;
  if (!tip) notFound();

  const probability = tip.modelProbability === null ? null : probabilityPercent(tip.modelProbability);
  const quality = tip.dataQuality === null ? null : Math.round(tip.dataQuality * 100);

  return (
    <div className="page-stack">
      <Link
        href="/tips"
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-on-navy-2 transition-colors hover:text-on-navy"
      >
        <ArrowLeft aria-hidden className="size-4" />
        All tips
      </Link>

      <Panel as="section" className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start gap-4">
          <SportIcon sport={tip.sport} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-[0.8125rem] font-medium text-on-navy-2">
              {sportLabel(tip.sport)}
              <span aria-hidden className="mx-1.5 text-on-navy-muted">
                •
              </span>
              {tip.competition}
            </p>
            <h1 className="mt-0.5 !text-[clamp(1.5rem,3.5vw,2.25rem)]">
              {tip.home.name} <span className="font-semibold text-on-navy-muted">vs</span> {tip.away.name}
            </h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-[0.9375rem] text-on-navy-2">
              <Clock aria-hidden className="size-4 shrink-0" />
              <time dateTime={isoDateTime(tip.kickoffAt)}>{formatKickoff(tip.kickoffAt, viewer.timezone)}</time>
            </p>
          </div>

          {tip.status === "SUSPENDED" ? (
            <p className="flex items-center gap-2 rounded-control border border-gold-500/40 bg-gold-500/10 px-3 py-2 text-[0.8125rem] font-semibold text-gold-500">
              <AlertTriangle aria-hidden className="size-4" />
              Suspended — do not act on this tip
            </p>
          ) : null}
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-3.5">
            <dt className="text-[0.8125rem] font-medium text-ink-500">Market</dt>
            <dd className="mt-0.5 font-bold text-ink-900">{tip.market}</dd>
          </Card>
          <Card className="p-3.5">
            <dt className="text-[0.8125rem] font-medium text-ink-500">Selection</dt>
            <dd className="mt-0.5 font-bold text-ink-900">{tip.selection}</dd>
          </Card>
          <Card className="p-3.5">
            <dt className="text-[0.8125rem] font-medium text-ink-500">Model probability</dt>
            <dd className="tabular mt-0.5 font-bold text-ink-900">
              {probability === null ? "Not model-rated" : `${probability}%`}{" "}
              <span className="text-[0.8125rem] font-medium text-ink-500">({confidenceLabel(tip.confidenceBand)})</span>
            </dd>
          </Card>
          <Card className="p-3.5">
            <dt className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink-500">
              <Gauge aria-hidden className="size-3.5" />
              Data quality
            </dt>
            <dd className="tabular mt-0.5 font-bold text-ink-900">{quality === null ? "Not assessed" : `${quality}%`}</dd>
          </Card>
        </dl>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <ConfidenceMeter probability={tip.modelProbability} band={tip.confidenceBand} variant="bare" />
          {tip.odds ? (
            <span className="flex items-center gap-2.5">
              <OddsPill decimal={tip.odds.decimal} stale={isOddsStale(tip.odds)} />
              <span className="text-[0.8125rem] text-on-navy-muted">
                captured from {tip.odds.operatorName}. The operator sets the final price.
              </span>
            </span>
          ) : null}
        </div>
      </Panel>

      {tip.locked && <Panel className="p-5"><h2>Premium prediction</h2><p className="my-3 text-on-navy-2">Purchase the associated VIP slip to unlock its selections and analysis.</p><Link href="/vip" className="text-blue-300 underline">View available VIP slips</Link></Panel>}
      <div className="flex items-center gap-3"><span>Save to your shortlist</span><SaveTipButton slug={tip.slug} initialSaved={tip.savedByViewer} label={tip.home.name + " vs " + tip.away.name} /></div>
      {tip.summary ? (
        <section className="section-stack">
          <SectionHead title="Prediction analysis" />
          <Panel className="p-4 sm:p-5">
            <p className="text-[0.9375rem] leading-relaxed text-on-navy-2">{tip.summary}</p>
            <p className="mt-3 text-[0.8125rem] text-on-navy-muted">
              Published editorial analysis. Confidence describes the strength of the model&apos;s
              signal — it is not a forecast of certainty, and no prediction is guaranteed.
            </p>
          </Panel>
        </section>
      ) : null}

      <section className="section-stack">
        <SectionHead title="Risk factors" />
        <Panel className="flex items-start gap-3 p-4 sm:p-5">
          <ShieldAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-gold-500" />
          <div>
            <p className="text-[0.9375rem] text-on-navy-2">
              Lineups, injuries and market movement are rechecked before kick-off. A material change suspends this tip
              or creates a visible revision — it is never rewritten silently.
            </p>
            <p className="mt-2 text-[0.8125rem] text-on-navy-muted">
              Form, head-to-head and verified injury data appear here once a sports-data provider is connected.
            </p>
          </div>
        </Panel>
      </section>

      <section className="section-stack">
        <SectionHead title="Where to place it" />
        <Panel className="p-4 sm:p-5">
          <p className="flex items-center gap-2 text-[0.9375rem] text-on-navy-2">
            <ExternalLink aria-hidden className="size-4 shrink-0" />
            No bookmaker is enabled for {viewer.countryName} yet.
          </p>
          <p className="mt-2 text-[0.8125rem] text-on-navy-muted">
            Operators appear here only once their licence for your country has been verified and approved. Winning
            Tips never holds a stake, and any operator link will be labelled where it earns a commission.
          </p>
        </Panel>
      </section>

      <p className="text-center text-xs text-on-navy-muted">
        18+. Predictions are for information only. Please gamble responsibly —{" "}
        <Link href="/responsible-betting" className="underline hover:text-on-navy-2">
          support and limits
        </Link>
        .
      </p>
    </div>
  );
}
