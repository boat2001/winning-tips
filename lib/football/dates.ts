import type { FixtureDateWindow } from "@/lib/football/types";

const dayInMilliseconds = 86_400_000;

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function fromDateKey(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) || toDateKey(date) !== value ? null : date;
}

export function getUtcDayRange(date: string) {
  const start = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(start.getTime())) {
    throw new Error(`Invalid fixture date: ${date}`);
  }

  return {
    start,
    end: new Date(start.getTime() + dayInMilliseconds),
  };
}

export function getFixtureDateWindows(reference = new Date()): FixtureDateWindow[] {
  const today = Date.UTC(
    reference.getUTCFullYear(),
    reference.getUTCMonth(),
    reference.getUTCDate(),
  );

  return [
    { key: "yesterday", label: "Yesterday", offset: -1 },
    { key: "today", label: "Today", offset: 0 },
    { key: "tomorrow", label: "Tomorrow", offset: 1 },
  ].map(({ key, label, offset }) => {
    const start = new Date(today + offset * dayInMilliseconds);
    return {
      key: key as FixtureDateWindow["key"],
      label,
      date: toDateKey(start),
      start,
      end: new Date(start.getTime() + dayInMilliseconds),
    };
  });
}

export function getUpcomingDateKeys(days: number, reference = new Date()) {
  if (!Number.isInteger(days) || days < 1 || days > 14) {
    throw new Error("Fixture sync days must be an integer between 1 and 14.");
  }

  const start = Date.UTC(
    reference.getUTCFullYear(),
    reference.getUTCMonth(),
    reference.getUTCDate(),
  );

  return Array.from({ length: days }, (_, offset) =>
    toDateKey(new Date(start + offset * dayInMilliseconds)),
  );
}
