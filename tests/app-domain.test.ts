import { describe, expect, it } from "vitest";
import { formatUnits, winRateOf, winRatePercent } from "../lib/domain/performance";
import { greetingFor, initialsOf } from "../lib/domain/viewer";
import { ODDS_FRESHNESS_MINUTES, isOddsStale, confidenceLabel, isHighConfidence } from "../lib/domain/tips";
import { formatKickoff, formatRelativeDay } from "../lib/utils/datetime";
import { formatRelativeTime } from "../lib/domain/community";

describe("performance", () => {
  it("returns null rather than zero when nothing has settled", () => {
    // A win rate of 0% and "no sample yet" are different claims; the second
    // must never be rendered as the first.
    expect(winRateOf(0, 0)).toBeNull();
    expect(winRatePercent(null)).toBeNull();
  });

  it("computes a whole-percent win rate from its sample", () => {
    expect(winRatePercent(winRateOf(14, 18))).toBe(78);
  });

  it("keeps units null when the staking basis is unpublished", () => {
    expect(formatUnits(null)).toBeNull();
  });

  it("signs units explicitly so a gain is never mistaken for a loss", () => {
    expect(formatUnits(12.54)).toBe("+12.54");
    expect(formatUnits(-3.2)).toBe("-3.20");
    expect(formatUnits(0)).toBe("0.00");
  });
});

describe("viewer", () => {
  it("greets by the member's timezone, not the server's", () => {
    // 23:00 UTC is already the next morning in Tokyo and still late evening in
    // Accra. The same instant must produce different greetings.
    const instant = new Date("2026-09-07T23:00:00.000Z");
    expect(greetingFor("Africa/Accra", instant)).toBe("Good Evening!");
    expect(greetingFor("Asia/Tokyo", instant)).toBe("Good Morning!");
  });

  it("crosses each greeting boundary at the right local hour", () => {
    expect(greetingFor("Africa/Accra", new Date("2026-09-07T11:59:00.000Z"))).toBe("Good Morning!");
    expect(greetingFor("Africa/Accra", new Date("2026-09-07T12:00:00.000Z"))).toBe("Good Afternoon!");
    expect(greetingFor("Africa/Accra", new Date("2026-09-07T17:00:00.000Z"))).toBe("Good Evening!");
  });

  it("builds avatar initials from the first and last word", () => {
    expect(initialsOf("Alex Carter")).toBe("AC");
    expect(initialsOf("Kwame")).toBe("K");
    expect(initialsOf("  ada  lovelace king  ")).toBe("AK");
    expect(initialsOf("")).toBe("?");
  });
});

describe("tips", () => {
  it("treats a snapshot older than the freshness window as stale", () => {
    const now = new Date("2026-09-07T12:00:00.000Z");
    const fresh = { decimal: 1.65, capturedAt: "2026-09-07T11:55:00.000Z", operatorName: "SportyBet" };
    const stale = {
      decimal: 1.65,
      capturedAt: new Date(now.getTime() - (ODDS_FRESHNESS_MINUTES + 1) * 60_000).toISOString(),
      operatorName: "SportyBet",
    };

    expect(isOddsStale(fresh, now)).toBe(false);
    expect(isOddsStale(stale, now)).toBe(true);
  });

  it("never labels a confidence band as a certainty", () => {
    const labels = (["VERY_HIGH", "HIGH", "MEDIUM", "LOW", "AVOID"] as const).map(confidenceLabel);
    for (const label of labels) {
      expect(label).not.toMatch(/sure|guarantee|certain|banker|risk[- ]free/i);
    }
    expect(confidenceLabel("VERY_HIGH")).toBe("Very high confidence");
  });

  it("counts only the top two bands as high confidence", () => {
    expect(isHighConfidence("VERY_HIGH")).toBe(true);
    expect(isHighConfidence("HIGH")).toBe(true);
    expect(isHighConfidence("MEDIUM")).toBe(false);
    expect(isHighConfidence("AVOID")).toBe(false);
  });
});

describe("datetime", () => {
  it("calls a late kick-off Today until local midnight", () => {
    // 23:30 is more than 24h from 09:00 the previous day in elapsed terms, but
    // it is still the same calendar date — the label follows the date.
    const now = new Date("2026-09-07T09:00:00.000Z");
    expect(formatRelativeDay("2026-09-07T23:30:00.000Z", "Africa/Accra", now)).toBe("Today");
    expect(formatRelativeDay("2026-09-08T00:30:00.000Z", "Africa/Accra", now)).toBe("Tomorrow");
    expect(formatRelativeDay("2026-09-06T20:00:00.000Z", "Africa/Accra", now)).toBe("Yesterday");
  });

  it("resolves the day against the member's timezone", () => {
    const now = new Date("2026-09-07T09:00:00.000Z");
    // 23:30 UTC on the 7th is already the 8th in Tokyo.
    expect(formatRelativeDay("2026-09-07T23:30:00.000Z", "Asia/Tokyo", now)).toBe("Tomorrow");
  });

  it("renders kick-off as day plus 24-hour time", () => {
    const now = new Date("2026-09-07T09:00:00.000Z");
    expect(formatKickoff("2026-09-07T20:00:00.000Z", "Africa/Accra", now)).toBe("Today 20:00");
  });
});

describe("community", () => {
  it("describes post age in the coarsest sensible unit", () => {
    const now = new Date("2026-09-07T12:00:00.000Z");
    expect(formatRelativeTime("2026-09-07T11:58:30.000Z", now)).toBe("2 minutes ago");
    expect(formatRelativeTime("2026-09-07T10:00:00.000Z", now)).toBe("2 hours ago");
    expect(formatRelativeTime("2026-09-05T12:00:00.000Z", now)).toBe("2 days ago");
    expect(formatRelativeTime("2026-08-24T12:00:00.000Z", now)).toBe("2 weeks ago");
  });

  it("uses the singular for a count of one", () => {
    const now = new Date("2026-09-07T12:00:00.000Z");
    expect(formatRelativeTime("2026-09-07T11:00:00.000Z", now)).toBe("1 hour ago");
  });
});
