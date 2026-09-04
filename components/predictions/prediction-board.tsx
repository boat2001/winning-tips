"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { BookingSection } from "@/components/predictions/booking-section";
import { Result } from "@/components/predictions/result-chip";
import type { PublicPrediction } from "@/lib/predictions/queries";

type DayBoard = {
  key: "yesterday" | "today" | "tomorrow";
  label: string;
  date: string;
  predictions: PublicPrediction[];
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatDateTab(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

type PublicBooking = { id: string; title: string; platform: string; code: string };

/**
 * The fixture board. A real table from sm up — numbered rows, mono kick-off
 * times and odds so the columns align — and a stacked block per fixture on
 * phones, which avoids the horizontal scroll the old card layout needed.
 */
export function PredictionBoard({
  days,
  bookingsByDate,
  showViewAll = true,
}: {
  days: DayBoard[];
  bookingsByDate?: Record<string, PublicBooking[]>;
  showViewAll?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [activeDay, setActiveDay] = useState<DayBoard["key"]>("today");
  const [query, setQuery] = useState("");
  const day = days.find((item) => item.key === activeDay) ?? days[1];
  const currentDate = new Date().toISOString().slice(0, 10);
  const usesCurrentWindow = days.find((item) => item.key === "today")?.date === currentDate;

  function selectDate(value: string) {
    if (!value) return;
    const availableDay = days.find((item) => item.date === value);
    if (availableDay) {
      setActiveDay(availableDay.key);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("date", value);
    setActiveDay("today");
    router.push(`${pathname}?${params.toString()}${pathname === "/" ? "#free-tips" : ""}`);
  }

  function openDatePicker() {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") input.showPicker();
    else input.click();
  }

  const predictions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const freePredictions = day.predictions.filter((prediction) => prediction.visibility === "FREE");
    if (!normalized) return freePredictions;
    return freePredictions.filter((prediction) =>
      [prediction.homeTeam, prediction.awayTeam, prediction.league, prediction.selection]
        .some((value) => value?.toLowerCase().includes(normalized)),
    );
  }, [day.predictions, query]);

  return (
    <div className="w-full">
      <div className="rounded-sharp border border-line-2 bg-surface">
        {/* Day switch. Three equal columns under one rule, active day carries a
            blue bar so the current column reads instantly. */}
        <div className="grid grid-cols-3 border-b border-line-2" role="tablist" aria-label="Prediction day">
          {days.map((item) => {
            const active = item.key === activeDay;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveDay(item.key)}
                className={`relative border-r border-line-2 px-3 py-3 text-left transition-colors last:border-r-0 ${active ? "bg-paper" : "hover:bg-paper/60"}`}
              >
                <span className={`block text-sm font-semibold uppercase tracking-[0.06em] ${active ? "text-ink" : "text-muted"}`}>
                  {usesCurrentWindow ? item.label : formatDateTab(item.date)}
                </span>
                <span className="eyebrow num mt-1 block">{formatDateTab(item.date)}</span>
                <span aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-[3px] ${active ? "bg-blue" : "bg-transparent"}`} />
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 border-b border-line-2 p-3">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search teams or competitions</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 fill-none stroke-faint stroke-2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search team or competition"
              className="field pl-9"
            />
          </label>
          <input
            ref={dateInputRef}
            type="date"
            value={day.date}
            onChange={(event) => selectDate(event.target.value)}
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
          />
          <button
            type="button"
            onClick={openDatePicker}
            aria-label={`Select prediction date. Current date: ${day.date}`}
            className="btn btn-ghost h-[2.875rem] shrink-0 gap-2 px-3"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2">
              <rect x="3" y="5" width="18" height="16" rx="1" />
              <path d="M16 3v4M8 3v4M3 10h18" />
            </svg>
            <span className="hidden sm:inline">Date</span>
          </button>
        </div>

        {predictions.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="display-heading text-xl">No tips on this card</p>
            <p className="mt-2 text-sm text-muted">Try another day, or clear the search.</p>
          </div>
        ) : (
          <div>
            <div className="hidden border-b-2 border-ink px-4 py-2.5 sm:grid sm:grid-cols-[2.25rem_minmax(0,1.6fr)_minmax(0,1fr)_4.5rem_5.5rem] sm:gap-x-4">
              <span className="eyebrow">#</span>
              <span className="eyebrow">Fixture</span>
              <span className="eyebrow">Tip</span>
              <span className="eyebrow text-right">Odds</span>
              <span className="eyebrow text-right">Result</span>
            </div>

            {predictions.map((prediction, index) => (
              <article
                key={prediction.id}
                className="border-b border-line px-4 py-4 transition-colors last:border-b-0 hover:bg-paper/70 sm:grid sm:grid-cols-[2.25rem_minmax(0,1.6fr)_minmax(0,1fr)_4.5rem_5.5rem] sm:items-center sm:gap-x-4"
              >
                <span className="num hidden text-xs text-faint sm:block">{String(index + 1).padStart(2, "0")}</span>

                <div className="min-w-0">
                  <p className="eyebrow truncate">
                    {prediction.league} · <span className="num">{formatTime(prediction.kickoffAt)}</span> UTC
                  </p>
                  <p className="mt-1.5 truncate text-[0.9375rem] font-semibold leading-snug">
                    {prediction.homeTeam} <span className="font-normal text-faint">v</span> {prediction.awayTeam}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 sm:mt-0 sm:contents">
                  <div className="min-w-0">
                    {prediction.locked ? (
                      <Link href="/vip" className="tag-vip">
                        VIP pick
                      </Link>
                    ) : (
                      <>
                        <p className="eyebrow truncate">{prediction.market}</p>
                        <Link
                          href={`/predictions/${prediction.slug}`}
                          className="mt-1.5 block truncate text-sm font-semibold transition-colors hover:text-blue"
                        >
                          {prediction.selection}
                        </Link>
                      </>
                    )}
                  </div>

                  <span className="num shrink-0 text-sm font-semibold sm:text-right">
                    {prediction.locked ? <span className="text-faint">—</span> : prediction.odds}
                  </span>

                  <span className="flex shrink-0 sm:justify-end">
                    <Result result={prediction.result} />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        {showViewAll ? (
          <div className="border-t border-line-2 bg-paper px-4 py-3 text-center">
            <Link href="/predictions" className="eyebrow eyebrow-blue transition-colors hover:text-ink">
              All predictions →
            </Link>
          </div>
        ) : null}
      </div>

      {bookingsByDate ? <BookingSection bookings={bookingsByDate[day.date] ?? []} date={day.date} /> : null}
    </div>
  );
}
