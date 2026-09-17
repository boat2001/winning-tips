"use client";

import Link from "next/link";
import { useState } from "react";
import { Crown, Lock } from "lucide-react";
import { CheckoutButton } from "@/components/payments/checkout-button";
import { SportPicker } from "@/components/predictions/sport-picker";
import { sportLabel } from "@/components/ui/sport-icon";
import { buttonClass } from "@/components/ui/button";
import { Card, SectionHead } from "@/components/ui/surface";
import type { SportSlug } from "@/lib/domain/tips";
import { cn } from "@/lib/utils/cn";
import {
  VIP_TIERS,
  formatSlipPrice,
  resolveVipSlip,
  type VipBookingLike,
  type VipPlanLike,
  type VipSlipStatus,
} from "@/lib/vip/slip-status";

/** A slip that was never published is not the same as one that sold out, so
    the two carry different words as well as different colours. */
const STATUS: Record<VipSlipStatus, { label: string; className: string }> = {
  available: { label: "Open", className: "bg-[#ddfbe4] text-[#006a24]" },
  "sold-out": { label: "Sales closed", className: "bg-[#ffe4e4] text-[#b0201e]" },
  unpublished: { label: "Coming up", className: "bg-card-2 text-ink-500" },
  results: { label: "Settled", className: "bg-blue-50 text-blue-600" },
};

const CLOSED_CTA: Record<Exclude<VipSlipStatus, "available">, string> = {
  "sold-out": "Sales closed",
  unpublished: "Not published yet",
  results: "Results published",
};

/** Bronze, silver and gold. Never the only cue — the tier's name is on the card. */
const TIER_ACCENT: Record<string, string> = {
  VIP1: "#b87333",
  VIP2: "#9aa3b2",
  VIP3: "#d4a017",
};

function legResult(result: string) {
  if (result === "WON") return { label: "Won", className: "bg-[#ddfbe4] text-[#006a24]" };
  if (result === "LOST") return { label: "Lost", className: "bg-[#ffe4e4] text-[#b0201e]" };
  if (["VOID", "PUSH", "CANCELLED"].includes(result)) return { label: "Void", className: "bg-[#eef2f7] text-ink-700" };
  return null;
}

/**
 * Today's VIP slips: always three cards, VIP 1, VIP 2 and VIP 3.
 *
 * The cards come from the fixed tier list rather than from the plans that
 * loaded, so a tier with no plan or no slip today still shows its card, marked
 * "Coming up", instead of silently disappearing. Only a tier with a real plan
 * can ever be bought.
 *
 * Same sales rules as the /vip page (lib/vip/slip-status). Pending legs show
 * the fixture but not the pick, which is what the buyer is paying for.
 */
export function VipSlipCards({
  plans,
  bookings,
  purchasedBookingIds,
  signedIn,
  paymentsConfigured,
  previewPurchaseCtas = false,
  loginNext,
  unavailable = false,
}: {
  plans: VipPlanLike[];
  bookings: ReadonlyMap<string, VipBookingLike>;
  purchasedBookingIds: readonly string[];
  signedIn: boolean;
  paymentsConfigured: boolean;
  previewPurchaseCtas?: boolean;
  loginNext: string;
  unavailable?: boolean;
}) {
  // Narrows the legs shown on each card. A slip is still bought whole, so the
  // card says how many of its games the filter is hiding.
  const [sport, setSport] = useState<SportSlug | null>(null);
  return (
    <section id="vip-slips" className="section-stack scroll-mt-24" aria-label="Today's VIP slips">
      <SectionHead
        title="Today's VIP Slips"
        description="Bought once, yours to keep. No subscription."
        icon={<Crown aria-hidden className="size-5 text-gold-500" />}
        action={{ label: "VIP history", href: "/vip" }}
      />

      <SportPicker value={sport} onChange={setSport} tone="dark" />

      {unavailable ? (
        <p role="status" className="rounded-control border border-gold-500/40 bg-navy-800 px-4 py-3 text-sm text-on-navy-2">
          Today&apos;s slip details couldn&apos;t load, so these cards may be missing games. Try again in a moment.
        </p>
      ) : null}

      <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
        {VIP_TIERS.map((tier) => {
          const plan = plans.find((item) => item.deck?.slug === tier.deckSlug);
          // A tier without a plan still gets its card; it just cannot be sold.
          const slip = resolveVipSlip(
            plan ?? { id: tier.deckSlug, name: tier.name, priceMinor: 0, currency: "GHS", isSoldOut: false, deck: { id: "", slug: tier.deckSlug } },
            bookings,
            purchasedBookingIds,
            previewPurchaseCtas,
          );
          const status: VipSlipStatus = plan ? slip.status : "unpublished";
          const { booking, predictions, isPurchased, priceMinor, currency } = slip;
          const price = formatSlipPrice(priceMinor, currency);
          const accent = TIER_ACCENT[tier.category];
          const count = predictions.length;
          const visible = sport ? predictions.filter((prediction) => prediction.sport === sport) : predictions;

          return (
            <Card as="article" key={tier.category} className="flex min-w-0 flex-col overflow-hidden">
              <div aria-hidden className="h-1.5 shrink-0" style={{ background: accent }} />

              <div className="flex items-center justify-between gap-3 border-b border-card-line px-4 py-3">
                <h3 className="flex min-w-0 items-center gap-2 text-base font-bold text-ink-900">
                  <Crown aria-hidden className="size-4 shrink-0" style={{ color: accent }} />
                  <span className="truncate">{plan?.name ?? tier.name}</span>
                </h3>
                <span className={cn("shrink-0 rounded-pill px-2.5 py-1 text-xs font-bold", STATUS[status].className)}>
                  {STATUS[status].label}
                </span>
              </div>

              {count ? (
                <p className="border-b border-card-line bg-card-2 px-4 py-2 text-xs font-semibold text-ink-500">
                  {visible.length === count ? count : `${visible.length} of ${count}`} {count === 1 ? "game" : "games"}
                  {sport && visible.length !== count ? ` · ${sportLabel(sport)}` : ""}
                  {status === "available" ? ` · ${price}` : ""}
                </p>
              ) : null}

              {count && !visible.length ? (
                <p className="flex-1 px-4 py-10 text-center text-sm text-ink-500">
                  No {sport ? sportLabel(sport).toLowerCase() : ""} games on this slip.
                </p>
              ) : count ? (
                <ul className="max-h-72 flex-1 divide-y divide-card-line overflow-y-auto">
                  {visible.map((prediction) => {
                    const chip = legResult(prediction.result);
                    return (
                      <li key={prediction.id} className="px-4 py-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-ink-900">
                            {prediction.fixture.homeTeam.name} <span className="font-medium text-ink-400">vs</span>{" "}
                            {prediction.fixture.awayTeam.name}
                          </p>
                          {chip ? (
                            <span className={cn("shrink-0 rounded-pill px-2 py-0.5 text-xs font-bold", chip.className)}>{chip.label}</span>
                          ) : null}
                        </div>
                        {prediction.market && prediction.selection ? (
                          <p className="mt-1 text-xs text-ink-700">
                            {prediction.market} · <span className="font-semibold text-ink-900">{prediction.selection}</span>
                          </p>
                        ) : (
                          <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
                            <Lock aria-hidden className="size-3" />
                            {isPurchased ? "Your pick is in Your VIP slips" : "Pick unlocks after purchase"}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="flex-1 px-4 py-10 text-center text-sm text-ink-500">Nothing published for this slip today.</p>
              )}

              <div className="border-t border-card-line p-4">
                {isPurchased ? (
                  <Link href="/home#my-vip-games" className={buttonClass("primary", "md", "w-full")}>
                    View your games
                  </Link>
                ) : status !== "available" ? (
                  <span
                    aria-disabled="true"
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-pill bg-card-2 px-5 text-sm font-semibold text-ink-500"
                  >
                    {CLOSED_CTA[status]}
                  </span>
                ) : signedIn && plan && booking ? (
                  <CheckoutButton
                    planId={plan.id}
                    bookingId={booking.id}
                    priceMinor={priceMinor}
                    configured={paymentsConfigured}
                    label={`Buy · ${price}`}
                    buttonClassName={buttonClass("success", "md", "w-full")}
                  />
                ) : (
                  <Link href={`/login?next=${encodeURIComponent(loginNext)}`} className={buttonClass("success", "md", "w-full")}>
                    Log in to buy · {price}
                  </Link>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
