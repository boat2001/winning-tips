"use client";

import Link from "next/link";
import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { ChevronRight, Search, Ticket } from "lucide-react";
import { CopyCodeButton } from "@/components/predictions/copy-code-button";
import { platformLabel } from "@/lib/bookings/platform";
import type { PublicBooking } from "@/lib/bookings/queries";
import type { BoardDay } from "@/lib/predictions/board";
import { cn } from "@/lib/utils/cn";
import { formatKickoffTime } from "@/lib/utils/datetime";

function formatTabDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00.000Z`),
  );
}

function formatOdds(odds: string | null) {
  if (!odds) return "—";
  const value = Number(odds);
  return Number.isFinite(value) ? value.toFixed(2) : odds;
}

const RESULT_PILL: Record<string, { label: string; className: string }> = {
  WON: { label: "Won", className: "bg-[#ddfbe4] text-[#006a24]" },
  LOST: { label: "Lost", className: "bg-[#ffe4e4] text-[#b0201e]" },
  PENDING: { label: "Open", className: "bg-card-2 text-ink-500" },
};

/* Words as well as colour, so a result never depends on colour alone (§16). */
function ResultPill({ result }: { result: string }) {
  const { label, className } = RESULT_PILL[result] ?? { label: "Void", className: "bg-[#eef2f7] text-ink-700" };
  return (
    <span className={cn("inline-flex min-w-[3.5rem] items-center justify-center rounded-pill px-2.5 py-1 text-xs font-bold", className)}>
      {label}
    </span>
  );
}

const COLUMNS = "sm:grid-cols-[2rem_minmax(0,1.6fr)_minmax(0,1fr)_3.5rem_4.5rem]";
const BOOKING_TITLE_DEFAULT = "Booking Code";

/**
 * The free tips board: yesterday and today, with that day's booking codes
 * beneath it.
 *
 * A real table from sm up — numbered rows, aligned odds and results — and a
 * stacked block per fixture on phones, so nothing scrolls sideways. The codes
 * follow the selected tab: switching to yesterday shows yesterday's slip,
 * which is how a visitor checks how a code they saw actually landed.
 */
export function TipsBoard({
  days,
  bookingsByDate,
  timezone,
  unavailable = false,
  viewAllHref,
  className,
}: {
  days: BoardDay[];
  bookingsByDate: Record<string, PublicBooking[]>;
  timezone: string;
  unavailable?: boolean;
  viewAllHref?: string;
  className?: string;
}) {
  const id = useId();
  const [activeKey, setActiveKey] = useState<BoardDay["key"]>("today");
  const [query, setQuery] = useState("");
  const day = days.find((item) => item.key === activeKey) ?? days[days.length - 1];
  const bookings = bookingsByDate[day.date] ?? [];

  const predictions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return day.predictions;
    return day.predictions.filter((prediction) =>
      [prediction.homeTeam, prediction.awayTeam, prediction.league, prediction.market, prediction.selection].some((value) =>
        value?.toLowerCase().includes(normalized),
      ),
    );
  }, [day.predictions, query]);

  // Arrow keys move between tabs, as the WAI-ARIA tabs pattern expects.
  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const index = days.findIndex((item) => item.key === day.key);
    const next = days[(index + (event.key === "ArrowRight" ? 1 : days.length - 1)) % days.length];
    setActiveKey(next.key);
    document.getElementById(`${id}-tab-${next.key}`)?.focus();
  }

  const empty = unavailable
    ? { title: "Tips couldn't load", body: "We couldn't reach the predictions just now. Try again in a moment." }
    : query.trim()
      ? { title: "No tips match your search", body: "Try a team or competition name." }
      : day.key === "today"
        ? { title: "Today's free card is on the way", body: "Free tips go up before the first kick-off." }
        : { title: "No free tips on this day", body: "Nothing was published for yesterday." };

  return (
    <div className={className}>
      <div className="overflow-hidden rounded-card bg-card text-ink-900 shadow-card">
        <div role="tablist" aria-label="Prediction day" className="grid grid-cols-2 border-b border-card-line">
          {days.map((item) => {
            const active = item.key === day.key;
            const count = item.predictions.length;
            return (
              <button
                key={item.key}
                id={`${id}-tab-${item.key}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`${id}-panel`}
                tabIndex={active ? 0 : -1}
                onClick={() => setActiveKey(item.key)}
                onKeyDown={onTabKeyDown}
                className={cn(
                  "relative flex min-h-14 flex-col items-start justify-center px-4 py-2.5 text-left transition-colors first:border-r first:border-card-line",
                  active ? "bg-card" : "bg-card-2 hover:bg-[#e9f0f8]",
                )}
              >
                <span className={cn("text-sm font-bold uppercase tracking-[0.06em]", active ? "text-ink-900" : "text-ink-500")}>
                  {item.label}
                </span>
                <span className="tabular mt-0.5 text-xs text-ink-500">
                  {formatTabDate(item.date)} · {count} {count === 1 ? "tip" : "tips"}
                </span>
                <span aria-hidden className={cn("absolute inset-x-0 bottom-0 h-[3px]", active ? "bg-green-500" : "bg-transparent")} />
              </button>
            );
          })}
        </div>

        <div className="border-b border-card-line p-3">
          <label className="relative block">
            <span className="sr-only">Search team or competition</span>
            <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            {/* 16px on phones: iOS zooms the page into any smaller field. */}
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search team or competition"
              className="h-11 w-full rounded-pill border border-card-line bg-card-2 pl-10 pr-4 text-base text-ink-900 placeholder:text-ink-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 sm:text-sm"
            />
          </label>
        </div>

        <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${day.key}`}>
          {unavailable || predictions.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-base font-bold text-ink-900">{empty.title}</p>
              <p className="mt-1.5 text-sm text-ink-500">{empty.body}</p>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "hidden gap-x-4 border-b border-card-line bg-card-2 px-4 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-500 sm:grid",
                  COLUMNS,
                )}
              >
                <span>#</span>
                <span>Fixture</span>
                <span>Tip</span>
                <span className="text-right">Odds</span>
                <span className="text-right">Result</span>
              </div>
              <ol className="divide-y divide-card-line">
                {predictions.map((prediction, index) => (
                  <li key={prediction.id} className={cn("px-4 py-3.5 sm:grid sm:items-center sm:gap-x-4", COLUMNS)}>
                    <span className="tabular hidden text-xs text-ink-400 sm:block">{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-ink-500">
                        {prediction.league} ·{" "}
                        <time dateTime={prediction.kickoffAt}>{formatKickoffTime(prediction.kickoffAt, timezone)}</time>
                      </p>
                      {/* Team names wrap rather than truncate: which match it is
                          matters more than one tidy line (§12). */}
                      <p className="mt-1 text-[0.9375rem] font-bold leading-snug">
                        {prediction.homeTeam} <span className="font-medium text-ink-400">vs</span> {prediction.awayTeam}
                      </p>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-3 sm:mt-0 sm:contents">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-ink-500">{prediction.market}</p>
                        <Link
                          href={`/tips/${prediction.slug}`}
                          className="mt-0.5 block truncate text-sm font-bold text-blue-600 underline-offset-2 hover:underline"
                        >
                          {prediction.selection}
                        </Link>
                      </div>
                      <span className="tabular shrink-0 text-sm font-bold sm:text-right">{formatOdds(prediction.odds)}</span>
                      <span className="flex shrink-0 sm:justify-end">
                        <ResultPill result={prediction.result} />
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>

        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="flex min-h-11 items-center justify-center gap-1 border-t border-card-line bg-card-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-[#e9f0f8]"
          >
            All tips <ChevronRight aria-hidden className="size-4" />
          </Link>
        ) : null}
      </div>

      {bookings.length ? (
        <section
          aria-label={`Booking codes for ${day.label.toLowerCase()}`}
          className="mt-3 rounded-card border border-navy-600/50 bg-navy-800 p-3 sm:p-4"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-on-navy">
            <Ticket aria-hidden className="size-4 text-green-400" />
            Booking codes · {day.label}
          </p>
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {bookings.map((booking) => {
              const platform = platformLabel(booking.platform);
              return (
                <li key={booking.id} className="flex items-center gap-3 rounded-control bg-card py-2 pl-3 pr-2 text-ink-900">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-500">
                      {platform}
                      {booking.title && booking.title !== BOOKING_TITLE_DEFAULT ? ` · ${booking.title}` : ""}
                    </p>
                    <p className="tabular select-all truncate text-lg font-bold tracking-[0.06em]">{booking.code}</p>
                  </div>
                  <CopyCodeButton code={booking.code} platform={platform} />
                </li>
              );
            })}
          </ul>
          <p className="mt-2.5 text-xs leading-relaxed text-on-navy-muted">
            18+. Load the code on your bookmaker and check every game before you stake. No outcome is guaranteed.
          </p>
        </section>
      ) : null}
    </div>
  );
}
