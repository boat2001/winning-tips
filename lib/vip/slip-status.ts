import type { SportSlug } from "@/lib/domain/tips";

/**
 * Where a tier's VIP slip stands today.
 *
 * Shared by every screen that sells a slip, so the sales rules — when a card
 * is open, closed, settled or not yet published — cannot drift between them.
 */

/** The three tiers sold every day. Cards are drawn from this list, not from
    whatever plans happen to load, so VIP 1, 2 and 3 are always on screen. */
export const VIP_TIERS = [
  { category: "VIP1", deckSlug: "vip-deck", name: "VIP 1" },
  { category: "VIP2", deckSlug: "vip-2-deck", name: "VIP 2" },
  { category: "VIP3", deckSlug: "vip-3-deck", name: "VIP 3" },
] as const;

export const categoryByDeckSlug = {
  "vip-deck": "VIP1",
  "vip-2-deck": "VIP2",
  "vip-3-deck": "VIP3",
} as const;

export type VipSlipStatus = "available" | "sold-out" | "unpublished" | "results";

export interface VipPlanLike {
  id: string;
  name: string;
  priceMinor: number;
  currency: string;
  isSoldOut: boolean;
  deck: { id: string; slug: string } | null;
}

export interface VipSlipLeg {
  id: string;
  result: string;
  /** Null until the leg settles: pending legs arrive redacted. */
  market: string | null;
  selection: string | null;
  sport: SportSlug;
  fixture: { homeTeam: { name: string }; awayTeam: { name: string } };
}

export interface VipBookingLike {
  id: string;
  category: string;
  priceMinor: number | null;
  currency: string;
  isSoldOut: boolean;
  salesClosed: boolean;
  predictions: VipSlipLeg[];
}

export function resolveVipSlip(
  plan: VipPlanLike,
  bookings: ReadonlyMap<string, VipBookingLike>,
  purchasedBookingIds: readonly string[],
  previewPurchaseCtas = false,
) {
  const category = plan.deck?.slug ? categoryByDeckSlug[plan.deck.slug as keyof typeof categoryByDeckSlug] : undefined;
  const booking = category ? bookings.get(category) : undefined;
  const predictions = booking?.predictions ?? [];
  const hasResults = predictions.some((prediction) => prediction.result !== "PENDING");
  const isPurchased = !previewPurchaseCtas && Boolean(booking && purchasedBookingIds.includes(booking.id));
  // The card carries the price and the sales state. The tier's plan is only a
  // fallback for a day whose card has not been loaded yet.
  const priceMinor = booking?.priceMinor ?? plan.priceMinor;
  const closed = booking?.salesClosed ?? false;
  const soldOut = booking ? booking.isSoldOut : plan.isSoldOut;
  const notPublished = !booking || predictions.length === 0 || priceMinor <= 0;
  const status: VipSlipStatus = notPublished ? "unpublished" : soldOut || closed ? "sold-out" : hasResults ? "results" : "available";

  return { category, booking, predictions, isPurchased, priceMinor, currency: booking?.currency ?? plan.currency, status };
}

export function formatSlipPrice(amountMinor: number, currency: string) {
  const hasPesewas = amountMinor % 100 !== 0;
  const amount = new Intl.NumberFormat("en-GH", {
    minimumFractionDigits: hasPesewas ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
  return `${currency} ${amount}`;
}
