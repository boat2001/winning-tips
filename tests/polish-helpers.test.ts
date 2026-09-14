import { describe, expect, it } from "vitest";
import { pickText } from "@/lib/domain/tips";
import { formatPostedAt } from "@/lib/utils/datetime";

describe("pickText", () => {
  it("prefixes selections that mean nothing without their market", () => {
    expect(pickText({ market: "Both Teams to Score", selection: "Yes" })).toBe("Both Teams to Score: Yes");
    expect(pickText({ market: "1X2", selection: "X" })).toBe("1X2: X");
  });
  it("leaves self-describing selections alone", () => {
    expect(pickText({ market: "Total Goals", selection: "Over 2.5 Goals" })).toBe("Over 2.5 Goals");
    expect(pickText({ market: "Moneyline", selection: "Lakers to Win" })).toBe("Lakers to Win");
  });
});

describe("formatPostedAt", () => {
  const now = new Date("2026-09-11T12:00:00Z");
  const tz = "Africa/Accra";
  it("counts minutes and hours on the same day", () => {
    expect(formatPostedAt("2026-09-11T11:59:40Z", tz, now)).toBe("Just now");
    expect(formatPostedAt("2026-09-11T11:48:00Z", tz, now)).toBe("12 min ago");
    expect(formatPostedAt("2026-09-11T09:00:00Z", tz, now)).toBe("3 h ago");
  });
  it("names yesterday and dates anything older", () => {
    expect(formatPostedAt("2026-09-10T20:00:00Z", tz, now)).toBe("Yesterday");
    expect(formatPostedAt("2026-09-08T10:00:00Z", tz, now)).toMatch(/^8 Sept?$/);
  });
  it("treats a future timestamp as just posted rather than negative", () => {
    expect(formatPostedAt("2026-09-11T12:05:00Z", tz, now)).toBe("Just now");
  });
});
