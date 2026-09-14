import { SportFilter } from "@/components/predictions/sport-filter";
import Link from "next/link";
import { BarChart3, CalendarDays, Clock, X } from "lucide-react";
import {
  type TipFilters,
  TIP_WINDOWS,
  hasActiveFilters,
  tipFilterHref,
} from "@/lib/domain/tip-filters";
import { cn } from "@/lib/utils/cn";

const WINDOW_ICON = {
  today: CalendarDays,
  upcoming: Clock,
  "high-confidence": BarChart3,
} as const;

const chip =
  "inline-flex shrink-0 items-center gap-2 rounded-pill border px-4 py-2.5 text-sm font-semibold transition-colors";
const chipOn = "border-green-400 bg-green-500 text-white";
const chipOff = "border-navy-600 bg-navy-800/70 text-on-navy-2 hover:border-blue-400 hover:text-on-navy";

/**
 * The filter row from the tips mock.
 *
 * Every control is a link, not a button: the filter state lives entirely in the
 * URL (guide §14.4), so changing a filter is a navigation. That keeps the whole
 * listing a server component, makes each filtered view shareable, and means the
 * back button does what the user expects without a line of client state.
 *
 * The row scrolls sideways below `lg` rather than wrapping, which is the
 * pattern the mobile mock shows.
 */
export function TipFilterRow({ filters }: { filters: TipFilters }) {
  return (
    <div className="rail flex w-full items-center gap-2.5 pb-1 lg:w-auto lg:flex-wrap">
      {TIP_WINDOWS.map((window) => {
        const Icon = WINDOW_ICON[window.value];
        const active = filters.window === window.value;

        return (
          <Link
            key={window.value}
            href={tipFilterHref(filters, { window: window.value })}
            aria-current={active ? "true" : undefined}
            className={cn(chip, active ? chipOn : chipOff)}
          >
            <Icon aria-hidden className="size-4" />
            {window.label}
          </Link>
        );
      })}

      <SportFilter filters={filters} />
    </div>
  );
}

/**
 * Active-filter summary with a reset, required by §14.4 alongside the result
 * count. Renders nothing when the listing is in its default state, so the
 * default view stays uncluttered.
 */
/**
 * The reset control for an active filter set.
 *
 * It used to restate the result count, which the page header already gives —
 * two counts a few pixels apart is the kind of duplication that makes a screen
 * feel machine-assembled. Renders nothing at all in the default view, so the
 * unfiltered listing carries no chrome it does not need.
 */
export function ActiveFilterSummary({ filters }: { filters: TipFilters }) {
  if (!hasActiveFilters(filters)) return null;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {filters.query ? (
        <p className="text-sm text-on-navy-2">
          Matching <span className="font-semibold text-on-navy">&ldquo;{filters.query}&rdquo;</span>
        </p>
      ) : null}
      <Link
        href="/tips"
        className="inline-flex items-center gap-1.5 rounded-pill border border-navy-600 px-3 py-1.5 text-[0.8125rem] font-semibold text-on-navy-2 transition-colors hover:border-red-500 hover:text-on-navy"
      >
        <X aria-hidden className="size-3.5" />
        Clear filters
      </Link>
    </div>
  );
}
