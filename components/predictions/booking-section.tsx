"use client";

import { useState } from "react";

type Booking = {
  id: string;
  title: string;
  platform: string;
  code: string;
};

function platformLabel(platform: string) {
  return /sporty/i.test(platform) ? "Sporty" : platform;
}

/**
 * Booking codes sit in the open as a strip under the board rather than behind a
 * popover. They are the one thing a punter copies every day, so hiding them
 * behind a click was costing a step.
 */
export function BookingSection({ bookings, date }: { bookings: Booking[]; date: string }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const formattedDate = new Date(`${date}T12:00:00.000Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  if (!bookings.length) return null;

  async function copyBooking(booking: Booking) {
    try {
      await navigator.clipboard.writeText(`${platformLabel(booking.platform)}:${booking.code}`);
      setCopiedId(booking.id);
      window.setTimeout(() => setCopiedId((current) => (current === booking.id ? null : current)), 1800);
    } catch {
      setCopiedId(null);
    }
  }

  return (
    <section
      className="mt-4 rounded-sharp border border-line-2 bg-blue-wash"
      aria-label={`Booking codes for ${formattedDate}`}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <p className="eyebrow eyebrow-blue">Booking codes</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {bookings.map((booking) => (
            <div key={booking.id} className="flex items-center gap-2">
              <span className="num text-sm font-semibold tracking-[0.04em] text-ink">
                {platformLabel(booking.platform)}:{booking.code}
              </span>
              <button
                type="button"
                onClick={() => copyBooking(booking)}
                aria-label={`Copy ${booking.platform} booking code ${booking.code}`}
                className="grid size-8 shrink-0 place-items-center rounded-sharp border border-blue/30 text-blue transition-colors hover:bg-blue hover:text-white"
              >
                {copiedId === booking.id ? (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-[2.4]">
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2">
                    <rect x="8" y="4" width="11" height="14" rx="1" />
                    <path d="M16 20H6a2 2 0 0 1-2-2V7" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
