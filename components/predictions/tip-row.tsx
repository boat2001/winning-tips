import { SaveTipButton } from "@/components/predictions/save-tip-button";
import Link from "next/link";
import { ChevronRight, Clock, Lock } from "lucide-react";
import { ConfidenceMeter, OddsPill } from "@/components/ui/metrics";
import { SportIcon, sportLabel } from "@/components/ui/sport-icon";
import { isOddsStale, pickText, type PublishedTip } from "@/lib/domain/tips";
import { formatKickoff, isoDateTime } from "@/lib/utils/datetime";
import { cn } from "@/lib/utils/cn";

/**
 * Tip rows, the most repeated object in the product.
 *
 * Two shapes, because the mocks give them two jobs. `TopPickRow` is the compact
 * home-screen row that ends in a chevron; `TipListRow` is the tips-listing row
 * that adds a market column and a save control.
 *
 * Layout lives in `.pick-row` / `.list-row` in globals.css, on named grid
 * areas. Every child carries its area class, so a breakpoint moves a named
 * piece rather than "the second div" — the positional selectors this replaced
 * broke each time a child was added, and were why the phone rows collided.
 *
 * Both rows are single links wrapping the content, so the whole card is one
 * target on touch. The save button sits *outside* the link: a control nested
 * inside an anchor is not operable.
 */

function Fixture({ tip }: { tip: PublishedTip }) {
  return (
    <>
      <p className="truncate text-[0.8125rem] font-medium leading-tight text-ink-500">
        {sportLabel(tip.sport)}
        <span aria-hidden className="mx-1.5 text-ink-400">
          •
        </span>
        {tip.competition}
      </p>
      {/* Wraps rather than truncating: which teams are playing is the whole
          point of the row, so it is the last thing that may be clipped (§12). */}
      <p className="mt-1 text-[0.9375rem] font-bold leading-snug text-ink-900">
        {tip.home.name} <span className="font-medium text-ink-400">vs</span> {tip.away.name}
      </p>
    </>
  );
}

function Kickoff({ tip, timezone, className }: { tip: PublishedTip; timezone: string; className?: string }) {
  return (
    <p className={cn("flex items-center gap-1.5 whitespace-nowrap text-[0.8125rem] font-medium leading-tight text-ink-500", className)}>
      <Clock aria-hidden className="size-3.5 shrink-0" />
      <time dateTime={isoDateTime(tip.kickoffAt)}>{formatKickoff(tip.kickoffAt, timezone)}</time>
    </p>
  );
}

function Locked() {
  return (
    <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
      <Lock aria-hidden className="size-3" />
      VIP · Locked
    </span>
  );
}

/** The home screen's "Today's Top Picks" row. */
export function TopPickRow({ tip, timezone }: { tip: PublishedTip; timezone: string }) {
  return (
    <li>
      <Link href={`/tips/${tip.slug}`} className="pick-row rounded-card bg-card shadow-card transition-shadow hover:shadow-raised">
        <SportIcon sport={tip.sport} className="pr-icon" />
        <div className="pr-main min-w-0">
          <Fixture tip={tip} />
          {tip.locked ? <Locked /> : <p className="mt-1 text-[0.8125rem] leading-snug text-ink-700">{pickText(tip)}</p>}
        </div>
        <Kickoff tip={tip} timezone={timezone} className="pr-time" />
        <ConfidenceMeter probability={tip.modelProbability} band={tip.confidenceBand} className="pr-conf" />
        {tip.odds ? <OddsPill decimal={tip.odds.decimal} stale={isOddsStale(tip.odds)} className="pr-odds" /> : null}
        <ChevronRight aria-hidden className="pr-go size-5 text-ink-400" />
      </Link>
    </li>
  );
}

/** The tips-listing row, with its market column and save control. */
export function TipListRow({ tip, timezone }: { tip: PublishedTip; timezone: string }) {
  return (
    <li className="list-row rounded-card bg-card shadow-card transition-shadow hover:shadow-raised">
      <Link href={`/tips/${tip.slug}`} className="list-row-link">
        <SportIcon sport={tip.sport} className="pr-icon" />
        <div className="pr-main min-w-0">
          <Fixture tip={tip} />
          <Kickoff tip={tip} timezone={timezone} className="mt-1.5" />
        </div>
        {/* The market names the question; the selection is the answer. The
            column used to be labelled "Market" over the selection, which left
            rows reading "Market: Yes". */}
        <div className="pr-pick min-w-0">
          <p className="text-[0.75rem] font-medium leading-tight text-ink-500">{tip.market}</p>
          {tip.locked ? <Locked /> : <p className="mt-1 text-[0.9375rem] font-bold leading-snug text-ink-900">{tip.selection}</p>}
        </div>
        <ConfidenceMeter probability={tip.modelProbability} band={tip.confidenceBand} className="pr-conf" />
        {tip.odds ? <OddsPill decimal={tip.odds.decimal} stale={isOddsStale(tip.odds)} className="pr-odds" /> : null}
      </Link>
      <SaveTipButton slug={tip.slug} initialSaved={tip.savedByViewer} label={`${tip.home.name} vs ${tip.away.name}`} className="list-row-save" />
    </li>
  );
}
