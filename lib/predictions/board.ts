import "server-only";

import { getPublicBookingsByDates, type PublicBooking } from "@/lib/bookings/queries";
import { isDesignPreview } from "@/lib/config/countries";
import { getFixtureDateWindows } from "@/lib/football/dates";
import { getPredictionDayBoard, type PublicPrediction } from "@/lib/predictions/queries";

export interface BoardDay {
  key: "yesterday" | "today";
  label: string;
  date: string;
  predictions: PublicPrediction[];
}

export interface FreeTipsBoard {
  days: BoardDay[];
  bookingsByDate: Record<string, PublicBooking[]>;
  unavailable: boolean;
}

/**
 * The free card for the last two days: yesterday, so a visitor can see how the
 * picks landed, and today, the card they can still act on. Tomorrow is left
 * off on purpose — its codes are not final and its games are a day away.
 *
 * Free predictions only, whoever is viewing. VIP legs are sold on their own
 * cards and never appear on this board, not even as locked rows.
 *
 * Never throws. A database failure comes back as `unavailable`, so the board
 * can say so instead of showing an empty card that reads like a quiet day.
 */
export async function getFreeTipsBoard(reference = new Date()): Promise<FreeTipsBoard> {
  const [yesterday, today] = getFixtureDateWindows(reference);
  const empty: BoardDay[] = [
    { key: "yesterday", label: yesterday.label, date: yesterday.date, predictions: [] },
    { key: "today", label: today.label, date: today.date, predictions: [] },
  ];
  if (isDesignPreview()) return { days: empty, bookingsByDate: {}, unavailable: false };

  try {
    const [board, bookingsByDate] = await Promise.all([
      getPredictionDayBoard(reference),
      getPublicBookingsByDates([yesterday.date, today.date]),
    ]);
    const days = empty.map((day) => ({
      ...day,
      predictions: (board.find((item) => item.date === day.date)?.predictions ?? []).filter(
        (prediction) => prediction.visibility === "FREE",
      ),
    }));
    return { days, bookingsByDate, unavailable: false };
  } catch {
    return { days: empty, bookingsByDate: {}, unavailable: true };
  }
}
