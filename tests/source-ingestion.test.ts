import { describe, expect, it } from "vitest";
import { extractBookingCodes, htmlToText } from "../lib/sources/booking-codes";
import { enabledSources, sourceById, tipSources } from "../lib/sources/registry";
import { defaultScreenRules, screenLeg, screenSlip, type ScreenableLeg } from "../lib/sources/screening";
import { judgeSource, summariseByMarket, summariseBySource, summariseRecord, type SettledLeg } from "../lib/sources/scorecard";
import { canAutoSettle } from "../lib/results/settlement";

const hour = 3_600_000;
const now = new Date("2026-09-16T10:00:00.000Z");

function leg(overrides: Partial<ScreenableLeg> = {}): ScreenableLeg {
  return {
    market: "Match Result",
    selection: "Home",
    odds: 1.8,
    kickoffAt: new Date(now.getTime() + 4 * hour).toISOString(),
    sport: "Football",
    ...overrides,
  };
}

describe("booking code extraction", () => {
  it("finds a code split across markup", () => {
    expect(extractBookingCodes('<p class="code">Sporty:<span>F12GXH</span></p>')).toEqual(["F12GXH"]);
  });

  it("accepts the wordings a published page uses", () => {
    expect(extractBookingCodes("SportyBet - A1B2C3 and Sporty Code: Z9Y8X7")).toEqual(["A1B2C3", "Z9Y8X7"]);
  });

  it("returns each code once, in the order published", () => {
    expect(extractBookingCodes("Sporty:F12GXH ... Sporty:F12GXH ... Sporty:QQ11QQ")).toEqual(["F12GXH", "QQ11QQ"]);
  });

  // Without the digit rule, every "Sporty CODES" heading becomes a failed
  // lookup against the bookmaker.
  it("ignores ordinary words beside the bookmaker's name", () => {
    expect(extractBookingCodes("<h2>Sporty CODES</h2><p>Sporty TODAY</p>")).toEqual([]);
  });

  // The live page put a heading straight after the code; stripping tags with no
  // space read it as F12GXHTODAY and the bookmaker rejected it.
  it("stops the code at the element that follows it", () => {
    expect(extractBookingCodes("<p>Sporty:<span>F12GXH</span></p><h3>Today's Featured Matches</h3>")).toEqual(["F12GXH"]);
  });

  it("ignores a capture carrying lowercase, which is prose rather than a code", () => {
    expect(extractBookingCodes("Sporty:Today1 tips")).toEqual([]);
  });

  it("ignores codes inside scripts", () => {
    expect(extractBookingCodes('<script>const s = "Sporty:BADBAD1";</script><p>Sporty:GOOD12</p>')).toEqual(["GOOD12"]);
  });

  it("strips tags and entities when reading the page", () => {
    expect(htmlToText("<p>Sporty:&nbsp;F12GXH</p>")).toBe("Sporty: F12GXH");
  });
});

describe("source registry", () => {
  it("keeps a source needing permission switched off", () => {
    const a1 = sourceById("a1-tips");
    expect(a1?.enabled).toBe(false);
    expect(enabledSources().map((source) => source.id)).not.toContain("a1-tips");
  });

  it("only lists sources whose codes are for a bookmaker we can load", () => {
    expect(tipSources.every((source) => source.platform === "SportyBet")).toBe(true);
  });
});

describe("slip screening", () => {
  it("accepts a leg that can be reviewed, priced and settled", () => {
    expect(screenLeg(leg(), defaultScreenRules, now)).toBeNull();
  });

  it("refuses a leg that is about to kick off", () => {
    const verdict = screenLeg(leg({ kickoffAt: new Date(now.getTime() + 10 * 60_000).toISOString() }), defaultScreenRules, now);
    expect(verdict?.reason).toBe("kickoff-too-soon");
  });

  it("refuses odds outside the band a card is built from", () => {
    expect(screenLeg(leg({ odds: 1.05 }), defaultScreenRules, now)?.reason).toBe("odds-out-of-band");
    expect(screenLeg(leg({ odds: 9 }), defaultScreenRules, now)?.reason).toBe("odds-out-of-band");
  });

  it("refuses a sport this site does not publish", () => {
    expect(screenLeg(leg({ sport: "Table Tennis" }), defaultScreenRules, now)?.reason).toBe("unsupported-sport");
  });

  // A market no rule can grade leaves the public record waiting on someone's
  // memory, which is exactly what the settled record must not depend on.
  it("refuses a market the engine cannot settle from a final score", () => {
    expect(screenLeg(leg({ market: "Correct Score", selection: "2-1" }), defaultScreenRules, now)?.reason).toBe("not-auto-gradable");
    expect(screenLeg(leg({ market: "1st Half - Total Goals", selection: "Over 0.5" }), defaultScreenRules, now)?.reason).toBe("not-auto-gradable");
  });

  it("is sellable only when every leg passes", () => {
    const good = screenSlip([leg(), leg({ market: "Both Teams to Score", selection: "Yes" })], defaultScreenRules, now);
    expect(good.sellable).toBe(true);
    expect(good.accepted).toHaveLength(2);

    const mixed = screenSlip([leg(), leg({ odds: 12 })], defaultScreenRules, now);
    expect(mixed.sellable).toBe(false);
    expect(mixed.rejected).toHaveLength(1);
  });

  it("refuses a slip longer than the sellable maximum", () => {
    const legs = Array.from({ length: 7 }, () => leg());
    expect(screenSlip(legs, defaultScreenRules, now).rejected.some((row) => row.reason === "too-many-legs")).toBe(true);
  });
});

describe("auto-gradable markets", () => {
  it("recognises the markets settlement actually grades", () => {
    expect(canAutoSettle({ market: "Match Result", selection: "Home" })).toBe(true);
    expect(canAutoSettle({ market: "Total Goals", selection: "Over 1.5" })).toBe(true);
    expect(canAutoSettle({ market: "Double Chance", selection: "1X" })).toBe(true);
    expect(canAutoSettle({ market: "Both Teams to Score", selection: "Yes" })).toBe(true);
  });

  it("refuses markets a full-time score cannot decide", () => {
    expect(canAutoSettle({ market: "Corners", selection: "Over 9.5" })).toBe(false);
    expect(canAutoSettle({ market: "Anytime Goalscorer", selection: "Haaland" })).toBe(false);
    expect(canAutoSettle({ market: "Mystery Market", selection: "Something" })).toBe(false);
  });
});

describe("source scorecard", () => {
  const settled = (source: string, grade: SettledLeg["grade"], market = "Match Result"): SettledLeg => ({ source, market, odds: 1.7, grade });

  it("counts wins and losses, and leaves voids out of the rate", () => {
    const summary = summariseRecord([settled("tips-deck", "WON"), settled("tips-deck", "LOST"), settled("tips-deck", "VOID")]);
    expect(summary).toMatchObject({ settled: 2, won: 1, lost: 1, voided: 1 });
    expect(summary.winRate).toBe(0.5);
  });

  it("reports no rate at all when nothing has settled", () => {
    expect(summariseRecord([])).toMatchObject({ settled: 0, winRate: null, lowerBound: null });
  });

  it("separates the record by source and by market", () => {
    const legs = [settled("tips-deck", "WON"), settled("a1-tips", "LOST"), settled("tips-deck", "WON", "Total Goals")];
    expect(summariseBySource(legs).get("tips-deck")?.won).toBe(2);
    expect(summariseBySource(legs).get("a1-tips")?.lost).toBe(1);
    expect(summariseByMarket(legs).get("total goals")?.settled).toBe(1);
  });

  it("does not trust a source until its record is big enough", () => {
    const verdict = judgeSource(summariseRecord(Array.from({ length: 10 }, () => settled("tips-deck", "WON"))));
    expect(verdict.trusted).toBe(false);
    expect(verdict.reason).toContain("30 needed");
  });

  // 40 settled at 60% still has a lower bound under 50%, so it waits.
  it("does not trust a record whose lower bound is under the bar", () => {
    const legs = [...Array.from({ length: 24 }, () => settled("tips-deck", "WON")), ...Array.from({ length: 16 }, () => settled("tips-deck", "LOST"))];
    expect(judgeSource(summariseRecord(legs)).trusted).toBe(false);
  });

  it("trusts a long, strong record", () => {
    const legs = [...Array.from({ length: 80 }, () => settled("tips-deck", "WON")), ...Array.from({ length: 20 }, () => settled("tips-deck", "LOST"))];
    const verdict = judgeSource(summariseRecord(legs));
    expect(verdict.trusted).toBe(true);
    expect(verdict.reason).toContain("80/100");
  });
});
