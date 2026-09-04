import { getDatabase } from "@/lib/db/client";
import { getFixtureDateWindows, getUtcDayRange } from "@/lib/football/dates";

export const fixtureBrowserInclude = {
  league: true,
  homeTeam: true,
  awayTeam: true,
} as const;

export async function getFixturesByDate(date: string) {
  const { start, end } = getUtcDayRange(date);

  return getDatabase().fixture.findMany({
    where: { kickoffAt: { gte: start, lt: end } },
    include: fixtureBrowserInclude,
    orderBy: [{ league: { name: "asc" } }, { kickoffAt: "asc" }],
  });
}

export async function getYesterdayTodayTomorrowFixtures(reference = new Date()) {
  const windows = getFixtureDateWindows(reference);
  const fixtureSets = await Promise.all(
    windows.map((window) => getFixturesByDate(window.date)),
  );

  return windows.map((window, index) => ({
    ...window,
    fixtures: fixtureSets[index],
  }));
}
