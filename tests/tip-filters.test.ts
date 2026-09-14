import { describe, expect, it } from "vitest";
import { applyTipFilters, parseTipFilters, tipFilterHref } from "../lib/domain/tip-filters";
import type { PublishedTip } from "../lib/domain/tips";

function tip(overrides: Partial<PublishedTip> = {}): PublishedTip {
  return {
    id: "t1",
    slug: "t1",
    sport: "football",
    competition: "Premier League",
    home: { name: "Home" },
    away: { name: "Away" },
    kickoffAt: "2026-09-07T20:00:00.000Z",
    market: "Both Teams to Score",
    selection: "Yes",
    modelProbability: 0.8,
    confidenceBand: "HIGH",
    dataQuality: 0.9,
    odds: null,
    status: "PUBLISHED",
    grade: null,
    finalScore: null,
    premium: false,
    savedByViewer: false,
    summary: null,
    ...overrides,
  };
}

describe("parseTipFilters", () => {
  it("defaults to today across every sport", () => {
    expect(parseTipFilters({})).toEqual({ window: "today", sport: null, query: null });
  });

  it("ignores unrecognised values rather than failing", () => {
    // A stale or hand-edited link must show the default listing, not an error.
    expect(parseTipFilters({ window: "last-year", sport: "curling" })).toEqual({
      window: "today",
      sport: null,
      query: null,
    });
  });

  it("takes the first value when a param is repeated", () => {
    expect(parseTipFilters({ sport: ["tennis", "football"] }).sport).toBe("tennis");
  });

  it("treats a whitespace-only query as absent", () => {
    expect(parseTipFilters({ q: "   " }).query).toBeNull();
  });
});

describe("tipFilterHref", () => {
  const base = { window: "today", sport: null, query: null } as const;

  it("omits defaults so the canonical listing stays /tips", () => {
    expect(tipFilterHref(base, {})).toBe("/tips");
  });

  it("preserves the other active filters when one changes", () => {
    const href = tipFilterHref({ ...base, sport: "tennis", query: "alcaraz" }, { window: "upcoming" });
    expect(href).toContain("window=upcoming");
    expect(href).toContain("sport=tennis");
    expect(href).toContain("q=alcaraz");
  });

  it("clears a filter when it is set back to its default", () => {
    expect(tipFilterHref({ ...base, sport: "tennis" }, { sport: null })).toBe("/tips");
  });
});

describe("applyTipFilters", () => {
  const now = new Date("2026-09-07T09:00:00.000Z");

  it("keeps only today's kick-offs under the today window", () => {
    const today = tip({ id: "today", kickoffAt: "2026-09-07T20:00:00.000Z" });
    const tomorrow = tip({ id: "tomorrow", kickoffAt: "2026-09-08T20:00:00.000Z" });

    expect(applyTipFilters([today, tomorrow], parseTipFilters({}), now).map((t) => t.id)).toEqual(["today"]);
  });

  it("keeps only later kick-offs under the upcoming window", () => {
    const today = tip({ id: "today", kickoffAt: "2026-09-07T20:00:00.000Z" });
    const tomorrow = tip({ id: "tomorrow", kickoffAt: "2026-09-08T20:00:00.000Z" });

    const filtered = applyTipFilters([today, tomorrow], parseTipFilters({ window: "upcoming" }), now);
    expect(filtered.map((t) => t.id)).toEqual(["tomorrow"]);
  });


  it("combines sport and window rather than treating them as alternatives", () => {
    const footballToday = tip({ id: "ft", sport: "football" });
    const tennisToday = tip({ id: "tt", sport: "tennis" });

    const filtered = applyTipFilters([footballToday, tennisToday], parseTipFilters({ sport: "tennis" }), now);
    expect(filtered.map((t) => t.id)).toEqual(["tt"]);
  });

  it("searches participants, competition and market case-insensitively", () => {
    const pool = [tip({ id: "a", home: { name: "Man City" } }), tip({ id: "b", home: { name: "Real Madrid" } })];

    expect(applyTipFilters(pool, parseTipFilters({ q: "man city" }), now).map((t) => t.id)).toEqual(["a"]);
    expect(applyTipFilters(pool, parseTipFilters({ q: "premier" }), now)).toHaveLength(2);
    expect(applyTipFilters(pool, parseTipFilters({ q: "nothing" }), now)).toHaveLength(0);
  });
});
