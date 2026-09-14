import type { PublishedTip, SportSlug } from "@/lib/domain/tips";

/**
 * Tips-listing filter state, per development guide §14.4.
 *
 * Filters live in the URL and nowhere else. That is what makes them survive a
 * refresh, work in a shared link and restore on the back button — and it keeps
 * the listing a server component, because there is no client state to hold.
 */

/**
 * Windows a member can filter by.
 *
 * "high-confidence" was removed: it filtered on `confidenceBand`, which is null
 * for every published tip because no prediction model exists yet. The chip was
 * always present and always returned nothing. It comes back when a model does.
 */
export type TipWindow = "today" | "upcoming";

export const TIP_WINDOWS: readonly { value: TipWindow; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
];

export const SPORTS: readonly { value: SportSlug; label: string }[] = [
  { value: "football", label: "Football" },
  { value: "basketball", label: "Basketball" },
  { value: "tennis", label: "Tennis" },
];

export interface TipFilters {
  readonly window: TipWindow;
  /** null means every sport. */
  readonly sport: SportSlug | null;
  readonly query: string | null;
}

const SPORT_VALUES = new Set<string>(SPORTS.map((sport) => sport.value));
const WINDOW_VALUES = new Set<string>(TIP_WINDOWS.map((window) => window.value));

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Reads filters from search params, falling back to defaults for anything
 * missing or unrecognised.
 *
 * Unknown values are ignored rather than rejected: a stale or hand-edited link
 * should show the default listing, not an error page.
 */
export function parseTipFilters(searchParams: Record<string, string | string[] | undefined>): TipFilters {
  const window = firstValue(searchParams.window);
  const sport = firstValue(searchParams.sport);
  const query = firstValue(searchParams.q)?.trim();

  return {
    window: window && WINDOW_VALUES.has(window) ? (window as TipWindow) : "today",
    sport: sport && SPORT_VALUES.has(sport) ? (sport as SportSlug) : null,
    query: query ? query : null,
  };
}

/**
 * The href for a filter change, preserving every other active filter.
 *
 * Defaults are omitted from the query string so the canonical listing stays a
 * clean `/tips` rather than `/tips?window=today&sport=`.
 */
export function tipFilterHref(current: TipFilters, change: Partial<TipFilters>): string {
  const next = { ...current, ...change };
  const params = new URLSearchParams();

  if (next.window !== "today") params.set("window", next.window);
  if (next.sport) params.set("sport", next.sport);
  if (next.query) params.set("q", next.query);

  const query = params.toString();
  return query ? `/tips?${query}` : "/tips";
}

export function hasActiveFilters(filters: TipFilters): boolean {
  return filters.window !== "today" || filters.sport !== null || filters.query !== null;
}

/**
 * Applies the filters to a set of tips.
 *
 * Lives here rather than in the page so the same rules can back a database
 * query later without the screen changing. Matching is deliberately narrow:
 * the search box looks at participants, competition and market, which is what
 * its placeholder promises.
 */
export function applyTipFilters(
  tips: readonly PublishedTip[],
  filters: TipFilters,
  now: Date = new Date(),
): readonly PublishedTip[] {
  const startOfTomorrow = new Date(now);
  startOfTomorrow.setUTCHours(24, 0, 0, 0);
  const startOfToday = new Date(now);
  startOfToday.setUTCHours(0, 0, 0, 0);

  return tips.filter((tip) => {
    const kickoff = new Date(tip.kickoffAt);
    if (!Number.isFinite(kickoff.getTime()) || tip.status !== "PUBLISHED") return false;
    if (filters.sport && tip.sport !== filters.sport) return false;

    if (filters.window === "upcoming" && new Date(tip.kickoffAt) < startOfTomorrow) return false;
    if (filters.window === "today" && (kickoff < startOfToday || kickoff >= startOfTomorrow)) return false;

    if (filters.query) {
      const haystack = [tip.home.name, tip.away.name, tip.competition, tip.market, tip.selection]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(filters.query.toLowerCase())) return false;
    }

    return true;
  });
}
