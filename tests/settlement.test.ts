import { describe, expect, it } from "vitest";
import { settlePrediction, type SettlementInput } from "@/lib/results/settlement";

const finished = (home: number, away: number, market: string, selection: string, extra: Partial<SettlementInput> = {}): SettlementInput => ({
  market,
  selection,
  fixtureStatus: "FINISHED",
  homeScore: home,
  awayScore: away,
  homeTeam: "Man City",
  awayTeam: "Arsenal",
  ...extra,
});

const grade = (input: SettlementInput) => settlePrediction(input)?.grade ?? null;

describe("settlePrediction: when not to grade", () => {
  it("voids a cancelled fixture", () => {
    expect(settlePrediction({ ...finished(0, 0, "1X2", "Home"), fixtureStatus: "CANCELLED" })).toEqual({ grade: "VOID", rule: "fixture-cancelled" });
  });

  it("leaves anything unfinished, postponed or scoreless pending", () => {
    for (const fixtureStatus of ["SCHEDULED", "LIVE", "POSTPONED"] as const) {
      expect(settlePrediction({ ...finished(2, 1, "1X2", "Home"), fixtureStatus })).toBeNull();
    }
    expect(settlePrediction({ ...finished(2, 1, "1X2", "Home"), homeScore: null })).toBeNull();
  });

  it("refuses markets a full-time score cannot settle", () => {
    for (const market of ["1st Half - 1X2", "Corners Over/Under", "Asian Handicap", "Correct Score", "Anytime Goalscorer", "Total Cards"]) {
      expect(settlePrediction(finished(2, 1, market, "Home"))).toBeNull();
    }
  });

  it("refuses a market or selection it does not recognise", () => {
    expect(settlePrediction(finished(2, 1, "Mystery Market", "Something"))).toBeNull();
    expect(settlePrediction(finished(2, 1, "1X2", "Maybe"))).toBeNull();
  });
});

describe("settlePrediction: match result", () => {
  it("grades 1X2 by side and by shorthand", () => {
    expect(grade(finished(2, 1, "1X2", "Home"))).toBe("WON");
    expect(grade(finished(2, 1, "1X2", "Away"))).toBe("LOST");
    expect(grade(finished(1, 1, "1X2", "X"))).toBe("WON");
    expect(grade(finished(0, 3, "Match Result", "2"))).toBe("WON");
  });

  it("matches a team name as a side", () => {
    expect(grade(finished(2, 1, "1X2", "Man City"))).toBe("WON");
    expect(grade(finished(2, 1, "1X2", "Arsenal"))).toBe("LOST");
  });
});

describe("settlePrediction: double chance and draw no bet", () => {
  it("grades double chance in every common wording", () => {
    expect(grade(finished(1, 1, "Double Chance", "1X"))).toBe("WON");
    expect(grade(finished(0, 1, "Double Chance", "Home or Draw"))).toBe("LOST");
    expect(grade(finished(0, 1, "Double Chance", "X2"))).toBe("WON");
    expect(grade(finished(2, 0, "Double Chance", "Home/Away"))).toBe("WON");
  });

  it("voids draw no bet on a draw", () => {
    expect(grade(finished(1, 1, "Draw No Bet", "Home"))).toBe("VOID");
    expect(grade(finished(2, 1, "Draw No Bet", "Home"))).toBe("WON");
    expect(grade(finished(2, 1, "Draw No Bet", "Away"))).toBe("LOST");
  });
});

describe("settlePrediction: totals and both teams to score", () => {
  it("grades totals from the selection or the SportyBet specifier", () => {
    expect(grade(finished(2, 1, "Over/Under", "Over 2.5"))).toBe("WON");
    expect(grade(finished(1, 1, "Total Goals", "Over 2.5"))).toBe("LOST");
    expect(grade(finished(1, 0, "Over/Under", "Under 1.5"))).toBe("WON");
    expect(grade(finished(2, 1, "Over/Under", "Over", { specifier: "total=2.5" }))).toBe("WON");
    expect(settlePrediction(finished(2, 1, "Over/Under", "Over"))).toBeNull();
  });

  it("voids a whole-number line that lands exactly", () => {
    expect(grade(finished(2, 1, "Over/Under", "Over 3"))).toBe("VOID");
  });

  it("grades basketball points totals", () => {
    expect(grade(finished(112, 108, "Total Points", "Over 215.5 Points"))).toBe("WON");
  });

  it("grades both teams to score", () => {
    expect(grade(finished(1, 1, "Both Teams to Score", "Yes"))).toBe("WON");
    expect(grade(finished(2, 0, "GG/NG", "GG"))).toBe("LOST");
    expect(grade(finished(2, 0, "GG/NG", "NG"))).toBe("WON");
  });
});

describe("settlePrediction: combinations and two-way winners", () => {
  it("requires every leg of a result-and-total pick to win", () => {
    expect(grade(finished(0, 2, "1X2 & Over/Under 1.5", "Away & Over 1.5"))).toBe("WON");
    expect(grade(finished(0, 1, "1X2 & Over/Under 1.5", "Away & Over 1.5"))).toBe("LOST");
    expect(grade(finished(2, 0, "1X2 & Over/Under 1.5", "Away & Over 1.5"))).toBe("LOST");
  });

  it("leaves a push inside a combination for a human", () => {
    expect(settlePrediction(finished(0, 2, "1X2 & Over/Under 2", "Away & Over 2"))).toBeNull();
  });

  it("grades two-way winners, including editor wording", () => {
    const basketball = { homeTeam: "Lakers", awayTeam: "Nuggets" };
    expect(grade(finished(112, 108, "Moneyline", "Lakers to Win", basketball))).toBe("WON");
    expect(grade(finished(100, 108, "Match Winner", "Home", basketball))).toBe("LOST");
    expect(grade(finished(3, 1, "SportyBet Selection", "Lakers to Win", basketball))).toBe("WON");
  });

  it("does not grade a two-way market that ended level", () => {
    expect(settlePrediction(finished(100, 100, "Moneyline", "Home"))).toBeNull();
  });
});
