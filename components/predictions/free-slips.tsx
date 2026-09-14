import Link from "next/link";
import { ChevronRight, ExternalLink, Ticket } from "lucide-react";
import { CopyCodeButton } from "@/components/predictions/copy-code-button";
import { Card, Panel } from "@/components/ui/surface";
import type { FreeSlip, FreeSlipDay, FreeSlipGame } from "@/lib/bookings/queries";
import { cn } from "@/lib/utils/cn";
import { formatKickoff, isoDateTime } from "@/lib/utils/datetime";

function platformLabel(platform: string) {
  return /sporty/i.test(platform) ? "SportyBet" : platform;
}

function formatOdds(value: string) {
  const odds = Number(value);
  return Number.isFinite(odds) ? odds.toFixed(2) : value;
}

/**
 * Today's free booking codes, ready to take to a bookmaker.
 *
 * The code is the product here, so it gets the biggest type on the card and
 * the only filled button. The games sit underneath so nobody books a slip
 * without seeing what is in it.
 *
 * Shared by the guest landing and the member home; each page supplies its own
 * heading because the two use different section-heading styles.
 */
export function FreeSlips({ day, timezone, className }: { day: FreeSlipDay; timezone: string; className?: string }) {
  if (day.slips.length === 0) {
    return (
      <Panel className={cn("p-6", className)}>
        <h3>Today&apos;s free booking codes are on the way</h3>
        <p className="mt-2 text-sm text-on-navy-2">
          Free codes go up before the first kick-off. Read today&apos;s tips in the meantime.
        </p>
        <Link href="/tips" className="mt-4 inline-flex min-h-11 items-center gap-1 font-semibold text-blue-300 hover:text-white">
          See today&apos;s tips <ChevronRight aria-hidden className="size-4" />
        </Link>
      </Panel>
    );
  }

  return (
    <div className={className}>
      <ul className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
        {day.slips.map((slip) => (
          <SlipCard key={slip.id} slip={slip} timezone={timezone} />
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-on-navy-muted">
        18+. Bookmakers can change odds or drop games that have started, so check the slip before you stake. No outcome is guaranteed.
      </p>
    </div>
  );
}

function SlipCard({ slip, timezone }: { slip: FreeSlip; timezone: string }) {
  const platform = platformLabel(slip.platform);
  const count = slip.games.length;

  return (
    <Card as="li" className="flex min-w-0 flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink-500">
            <Ticket aria-hidden className="size-4 shrink-0 text-green-600" />
            {platform}
            {count ? ` · ${count} ${count === 1 ? "game" : "games"}` : ""}
          </p>
          <h3 className="mt-1 text-base font-bold leading-snug text-ink-900">{slip.title}</h3>
        </div>
        {slip.totalOdds ? (
          <p className="shrink-0 text-right">
            <span className="block text-[0.6875rem] font-medium text-ink-500">Total odds</span>
            <span className="tabular text-lg font-bold leading-tight text-green-600">{formatOdds(slip.totalOdds)}</span>
          </p>
        ) : null}
      </div>

      <div
        className={cn(
          "mx-4 mt-3 flex items-center gap-3 rounded-control border border-dashed border-ink-400/60 bg-card-2 py-2 pl-3 pr-2",
          count === 0 && !slip.shareUrl && "mb-4",
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-500">Booking code</p>
          <p className="tabular select-all truncate text-xl font-bold tracking-[0.06em] text-ink-900">{slip.code}</p>
        </div>
        <CopyCodeButton code={slip.code} platform={platform} />
      </div>

      {count ? (
        <ul className="mt-3 divide-y divide-card-line border-t border-card-line">
          {slip.games.map((game) => (
            <GameRow key={game.id} game={game} timezone={timezone} />
          ))}
        </ul>
      ) : null}

      {slip.shareUrl ? (
        <a
          href={slip.shareUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-auto flex min-h-11 items-center justify-center gap-1.5 border-t border-card-line px-4 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
        >
          Open slip on {platform}
          <ExternalLink aria-hidden className="size-4" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : null}
    </Card>
  );
}

const GRADE_TONE: Record<string, string> = {
  WON: "font-semibold text-green-600",
  LOST: "font-semibold text-red-500",
};

function GameRow({ game, timezone }: { game: FreeSlipGame; timezone: string }) {
  const graded = game.result !== "PENDING";

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 px-4 py-2.5">
      <div className="min-w-0">
        {/* Team names wrap rather than truncate: which match it is matters
            more than keeping the row to one line (§12). */}
        <p className="text-[0.9375rem] font-semibold leading-snug text-ink-900">
          {game.homeTeam} <span className="font-medium text-ink-400">vs</span> {game.awayTeam}
        </p>
        <p className="mt-0.5 text-[0.8125rem] leading-snug text-ink-700">
          {game.market}: <span className="font-semibold text-ink-900">{game.selection}</span>
        </p>
      </div>
      <div className="text-right">
        <p className="tabular text-sm font-bold text-ink-900">{formatOdds(game.odds)}</p>
        {graded ? (
          <p className={cn("text-xs", GRADE_TONE[game.result] ?? "text-ink-500")}>
            {game.result.charAt(0) + game.result.slice(1).toLowerCase()}
          </p>
        ) : (
          <p className="whitespace-nowrap text-xs text-ink-500">
            <time dateTime={isoDateTime(game.kickoffAt)}>{formatKickoff(game.kickoffAt, timezone)}</time>
          </p>
        )}
      </div>
    </li>
  );
}
