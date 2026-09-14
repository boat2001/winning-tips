/**
 * Date and time rendering for the member app.
 *
 * Everything is stored in UTC and rendered in the member's configured timezone
 * (guide §4). No function here reads the server's local zone — a render in a US
 * region must produce the same string as a render in Accra for the same member.
 */

/** "20:00" in the given zone. 24-hour, as every mock shows. */
export function formatKickoffTime(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(new Date(iso));
}

/** The calendar date in a zone, as YYYY-MM-DD, for same-day comparisons. */
function zonedDateKey(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  }).format(date);
}

/**
 * "Today", "Tomorrow", "Yesterday", or "Sat 22 Jun" for anything further out.
 *
 * Compared on the zoned calendar date rather than on an hours-apart difference,
 * so a 23:30 kick-off is "Today" right up until midnight local instead of
 * flipping to "Tomorrow" when it is 24 hours away.
 */
export function formatRelativeDay(iso: string, timezone: string, now: Date = new Date()): string {
  const target = new Date(iso);
  const targetKey = zonedDateKey(target, timezone);
  const todayKey = zonedDateKey(now, timezone);

  if (targetKey === todayKey) return "Today";

  const oneDay = 24 * 60 * 60 * 1000;
  if (targetKey === zonedDateKey(new Date(now.getTime() + oneDay), timezone)) return "Tomorrow";
  if (targetKey === zonedDateKey(new Date(now.getTime() - oneDay), timezone)) return "Yesterday";

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: timezone,
  }).format(target);
}

/** "Today 20:00" — the form every tip card uses. */
export function formatKickoff(iso: string, timezone: string, now: Date = new Date()): string {
  return `${formatRelativeDay(iso, timezone, now)} ${formatKickoffTime(iso, timezone)}`;
}

/** "Jun 22, 2024" for settled rows. */
export function formatSettledDate(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: timezone,
  }).format(new Date(iso));
}

/** "Jun 16 – Jun 22, 2024" for a performance range header. */
export function formatDateRange(fromIso: string, toIso: string, timezone: string): string {
  const short = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: timezone });
  const withYear = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  });
  return `${short.format(new Date(fromIso))} – ${withYear.format(new Date(toIso))}`;
}

/** Machine-readable value for a <time datetime> attribute. */
export function isoDateTime(iso: string): string {
  return new Date(iso).toISOString();
}

/**
 * "Just now", "12 min ago", "3 h ago", "Yesterday", then "8 Sep" — how a feed
 * dates a post. A full locale timestamp ("08/09/2026, 10:00:00 am") makes the
 * reader do arithmetic to learn the one thing they want: how fresh it is.
 */
export function formatPostedAt(iso: string, timezone: string, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60 && formatRelativeDay(iso, timezone, now) === "Today") return `${Math.floor(minutes / 60)} h ago`;
  const day = formatRelativeDay(iso, timezone, now);
  if (day === "Yesterday") return day;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: timezone }).format(new Date(iso));
}
