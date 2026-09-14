import { describe, expect, it } from "vitest";
import { slipSchedule } from "@/lib/bookings/schedule";
const now = new Date("2026-09-14T12:00:00Z");
describe("pre-match slip scheduling", () => {
  it("assigns tomorrow's matches to tomorrow and closes at the earliest kickoff", () => {
    expect(slipSchedule(["2026-09-15T20:00:00Z", "2026-09-15T15:00:00Z"], "2026-09-20T00:00:00Z", now)).toEqual({ bookingDate: "2026-09-15", deadline: new Date("2026-09-15T15:00:00Z") });
  });
  it("honors a provider expiry earlier than kickoff", () => {
    expect(slipSchedule(["2026-09-15T20:00:00Z"], "2026-09-15T10:00:00Z", now).deadline.toISOString()).toBe("2026-09-15T10:00:00.000Z");
  });
  it("refuses any already-started leg, even if the booking code has not expired", () => {
    expect(() => slipSchedule(["2026-09-14T11:00:00Z", "2026-09-15T15:00:00Z"], "2026-09-20T00:00:00Z", now)).toThrow("started");
  });
  it("refuses invalid times and empty slips", () => {
    expect(() => slipSchedule([], "2026-09-15T00:00:00Z", now)).toThrow();
    expect(() => slipSchedule(["bad"], "2026-09-15T00:00:00Z", now)).toThrow();
  });
});
