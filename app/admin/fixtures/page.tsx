import Link from "next/link";
import { getFixtureDateWindows } from "@/lib/football/dates";
import { getFixturesByDate } from "@/lib/football/queries";

export const dynamic = "force-dynamic";

type DayKey = "yesterday" | "today" | "tomorrow";

function getTeamMark(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function formatKickoff(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default async function AdminFixturesPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const requestedDay = (await searchParams).day;
  const activeDay: DayKey = ["yesterday", "today", "tomorrow"].includes(requestedDay ?? "")
    ? (requestedDay as DayKey)
    : "today";
  const windows = getFixtureDateWindows();
  const activeWindow = windows.find((window) => window.key === activeDay) ?? windows[1];

  let fixtures: Awaited<ReturnType<typeof getFixturesByDate>> = [];
  let databaseError = false;

  try {
    fixtures = await getFixturesByDate(activeWindow.date);
  } catch {
    databaseError = true;
  }

  const groupedFixtures = fixtures.reduce<Map<string, typeof fixtures>>((groups, fixture) => {
    const current = groups.get(fixture.league.name) ?? [];
    current.push(fixture);
    groups.set(fixture.league.name, current);
    return groups;
  }, new Map());

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-7 sm:py-10">
      <h1 className="text-3xl font-semibold tracking-[-0.045em] text-ink sm:text-4xl">Tips desk</h1>

      <section className="mt-6 overflow-hidden rounded-sharp border border-line bg-white">
        <nav className="grid grid-cols-3 gap-1 border-b border-line bg-paper p-2 sm:p-3" aria-label="Tips day">
          {windows.map((window) => {
            const active = window.key === activeDay;
            return (
              <Link
                key={window.key}
                href={`/admin/fixtures?day=${window.key}`}
                aria-current={active ? "page" : undefined}
                className={`rounded-sharp px-3 py-3 text-center transition-colors ${active ? "bg-ink text-white" : "text-ink/55 hover:bg-blue-wash"}`}
              >
                <span className="block text-sm font-semibold">{window.label}</span>
                <span className={`mt-0.5 block text-[0.65rem] font-bold uppercase tracking-[0.12em] ${active ? "text-blue-wash" : "text-blue/50"}`}>
                  {window.date.slice(5)}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-2 border-b border-ink/8 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue/55">{activeWindow.label}&apos;s tips</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-ink">{formatFullDate(activeWindow.start)}</h2>
          </div>
          <span className="w-fit rounded-full bg-blue-wash px-3 py-1.5 text-xs font-semibold text-blue">
            {fixtures.length} {fixtures.length === 1 ? "match" : "matches"}
          </span>
        </div>

        {databaseError ? (
          <div className="px-6 py-16 text-center">
            <p className="font-semibold text-ink">The tips database is not ready.</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/55">Run the Stage 2 migration and seed, then refresh this desk.</p>
          </div>
        ) : groupedFixtures.size === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-sharp bg-blue-wash text-sm font-semibold text-ink">00</span>
            <p className="mt-4 font-semibold text-ink">No matches available for tips today</p>
            <p className="mt-1 text-sm text-ink/55">Run the secure match sync or seed the development data.</p>
          </div>
        ) : (
          <div className="divide-y divide-ink/8">
            {[...groupedFixtures.entries()].map(([league, leagueFixtures]) => (
              <section key={league} className="px-4 py-6 sm:px-7">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">{league}</h3>
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-blue/45">
                    {leagueFixtures[0].league.country}
                  </span>
                </div>
                <div className="space-y-2">
                  {leagueFixtures.map((fixture) => (
                    <Link href={`/admin/predictions/new?fixtureId=${fixture.id}`} key={fixture.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-sharp border border-line bg-paper px-3 py-4 transition hover:border-blue hover:bg-blue-wash sm:gap-6 sm:px-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-sharp bg-white text-[0.65rem] font-semibold text-blue">{getTeamMark(fixture.homeTeam.name)}</span>
                        <span className="truncate text-sm font-semibold text-ink">{fixture.homeTeam.name}</span>
                      </div>
                      <div className="text-center">
                        {fixture.status === "FINISHED" ? (
                          <p className="text-lg font-semibold text-ink">{fixture.homeScore}–{fixture.awayScore}</p>
                        ) : (
                          <p className="text-sm font-semibold text-ink">{formatKickoff(fixture.kickoffAt)}</p>
                        )}
                        <p className="mt-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-blue/45">{fixture.status}</p>
                      </div>
                      <div className="flex min-w-0 flex-row-reverse items-center gap-3 text-right">
                        <span className="grid size-9 shrink-0 place-items-center rounded-sharp bg-white text-[0.65rem] font-semibold text-blue">{getTeamMark(fixture.awayTeam.name)}</span>
                        <span className="truncate text-sm font-semibold text-ink">{fixture.awayTeam.name}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      <p className="mt-5 text-center text-xs font-semibold text-ink/45">Select a match above to create a new sports tip.</p>
    </main>
  );
}
