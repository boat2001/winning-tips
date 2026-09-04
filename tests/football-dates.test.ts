import { describe, expect, it } from "vitest";
import {
  fromDateKey,
  getFixtureDateWindows,
  getUpcomingDateKeys,
  getUtcDayRange,
} from "@/lib/football/dates";

describe("football date helpers", () => {
  it("parses valid calendar date keys and rejects invalid dates", () => {
    expect(fromDateKey("2026-08-18")?.toISOString()).toBe("2026-08-18T12:00:00.000Z");
    expect(fromDateKey("2026-02-30")).toBeNull();
    expect(fromDateKey("18-08-2026")).toBeNull();
  });

  it("builds stable yesterday, today and tomorrow UTC windows", () => {
    const windows = getFixtureDateWindows(new Date("2026-08-13T21:30:00Z"));

    expect(windows.map(({ key, date }) => ({ key, date }))).toEqual([
      { key: "yesterday", date: "2026-08-12" },
      { key: "today", date: "2026-08-13" },
      { key: "tomorrow", date: "2026-08-14" },
    ]);
  });

  it("creates an exclusive UTC database range", () => {
    const range = getUtcDayRange("2026-08-13");
    expect(range.start.toISOString()).toBe("2026-08-13T00:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-08-14T00:00:00.000Z");
  });

  it("limits upcoming sync windows", () => {
    expect(getUpcomingDateKeys(3, new Date("2026-08-13T10:00:00Z"))).toEqual([
      "2026-08-13",
      "2026-08-14",
      "2026-08-15",
    ]);
    expect(() => getUpcomingDateKeys(15)).toThrow(/between 1 and 14/);
  });
});
