import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { ConfidenceMeter, OddsPill } from "@/components/ui/metrics";
import { SportIcon } from "@/components/ui/sport-icon";
import { isOddsStale, type PublishedTip } from "@/lib/domain/tips";
import { formatKickoff, isoDateTime } from "@/lib/utils/datetime";

/**
 * The single highlighted pick at the top of the tips screen.
 *
 * Distinguished from an ordinary row by a green ground and a star, never by
 * size alone, so it still reads as "featured" in a screenshot, in high contrast
 * mode, and to a screen reader — the heading says so in words.
 */
export function FeaturedTip({ tip, timezone }: { tip: PublishedTip; timezone: string }) {
  return (
    <section
      aria-labelledby="featured-tip"
      className="featured-tip-card overflow-hidden rounded-card border border-green-400/60 bg-[linear-gradient(120deg,#00381f_0%,#014a2b_45%,#01361f_100%)] shadow-glow-green"
    >
      <div className="flex items-center justify-between gap-3 border-b border-green-400/25 px-4 py-2.5">
        <h2 id="featured-tip" className="flex items-center gap-2 !text-base text-green-400">
          <Star aria-hidden className="size-4 fill-gold-500 text-gold-500" />
          Featured Tip
        </h2>
        <Link
          href={`/tips/${tip.slug}`}
          className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-on-navy-2 transition-colors hover:text-on-navy"
        >
          Our Best Pick Today
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-4 p-4">
        <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
          <SportIcon sport={tip.sport} />
          <div className="min-w-0">
            <p className="truncate text-[0.8125rem] font-medium text-on-navy-2">{tip.competition}</p>
            <p className="text-base font-bold leading-snug text-on-navy">
              {tip.home.name} <span className="font-medium text-on-navy-muted">vs</span> {tip.away.name}
            </p>
            <time dateTime={isoDateTime(tip.kickoffAt)} className="text-[0.8125rem] text-on-navy-muted">
              {formatKickoff(tip.kickoffAt, timezone)}
            </time>
          </div>
        </div>

        <div className="min-w-0 basis-40 border-green-400/25 sm:border-l sm:pl-5">
          <p className="text-[0.8125rem] font-medium text-on-navy-2">{tip.market}</p>
          <p className="text-[0.9375rem] font-bold leading-snug text-on-navy">{tip.selection}</p>
        </div>

        <ConfidenceMeter
          probability={tip.modelProbability}
          band={tip.confidenceBand}
          variant="bare"
          className="shrink-0"
        />

        {/* The model's own words, quoted. Never edited for punchiness — it has to
            stay traceable to the factors that produced it (guide §9). */}
        {tip.summary ? (
          <blockquote className="min-w-0 flex-1 basis-56 text-[0.8125rem] italic leading-snug text-on-navy-2">
            “{tip.summary}”
          </blockquote>
        ) : null}

        {tip.odds ? (
          <OddsPill decimal={tip.odds.decimal} stale={isOddsStale(tip.odds)} className="!px-5 !py-3 !text-lg" />
        ) : null}
      </div>
    </section>
  );
}
