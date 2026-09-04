import { describe, expect, it, vi } from "vitest";
import {
  loadSportyBetSlip,
  parseSportyBetSlip,
} from "@/lib/bookings/sportybet";

const successPayload = {
  bizCode: 10000,
  message: "Success",
  data: {
    shareCode: "FSJ4DM",
    shareURL: "http://www.sportybet.com/gh/?shareCode=FSJ4DM",
    deadline: 1788874200000,
    ticket: { displayTotalOdds: "4.20" },
    outcomes: [{
      eventId: "sr:match:72221164",
      estimateStartTime: 1787416200000,
      homeTeamName: "Brentford",
      awayTeamName: "Tottenham",
      sport: {
        id: "sr:sport:1",
        name: "Football",
        category: {
          id: "sr:category:1",
          name: "England",
          tournament: { id: "sr:tournament:17", name: "Premier League" },
        },
      },
      markets: [{
        id: "37",
        specifier: "total=1.5",
        desc: "1X2 & Over/Under 1.5",
        outcomes: [{ id: "804", odds: "4.20", desc: "Away & Over 1.5" }],
      }],
    }],
  },
};

describe("SportyBet Ghana adapter", () => {
  it("normalizes a real booking response into Smart Tips games", () => {
    const slip = parseSportyBetSlip(successPayload);

    expect(slip.shareURL).toBe("https://www.sportybet.com/gh/?shareCode=FSJ4DM");
    expect(slip.totalOdds).toBe(4.2);
    expect(slip.games[0]).toMatchObject({
      home: "Brentford",
      away: "Tottenham",
      category: "England",
      tournament: "Premier League",
      prediction: "Away & Over 1.5 (1X2 & Over/Under 1.5)",
      odd: 4.2,
      sportybet: {
        eventId: "sr:match:72221164",
        marketId: "37",
        outcomeId: "804",
        specifier: "total=1.5",
      },
    });
  });

  it("loads codes through the Ghana endpoint", async () => {
    const fetcher = vi.fn(async () => Response.json(successPayload));
    const slip = await loadSportyBetSlip(" fsj4dm ", fetcher as typeof fetch);

    expect(slip.shareCode).toBe("FSJ4DM");
    expect(fetcher).toHaveBeenCalledWith(
      "https://www.sportybet.com/api/gh/orders/share/FSJ4DM",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
  });

  it("does not turn rejected codes into demo data", async () => {
    const fetcher = vi.fn(async () => Response.json({ bizCode: 19000, message: "The code is invalid." }));
    await expect(loadSportyBetSlip("BAD123", fetcher as typeof fetch)).rejects.toThrow("The code is invalid.");
  });
});
