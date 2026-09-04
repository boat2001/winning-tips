import Link from "next/link";
import { CheckoutButton } from "@/components/payments/checkout-button";
import { SectionHead } from "@/components/ui/layout";

type VipPlan = {
  id: string;
  name: string;
  priceMinor: number;
  currency: string;
  isSoldOut: boolean;
  deck: { id: string; slug: string } | null;
};

type VipBooking = {
  id: string;
  category: string;
  predictions: Array<{
    id: string;
    result: string;
    market: string | null;
    selection: string | null;
    fixture: { homeTeam: { name: string }; awayTeam: { name: string } };
  }>;
};

const categoryByDeckSlug = {
  "vip-deck": "VIP1",
  "vip-2-deck": "VIP2",
  "vip-3-deck": "VIP3",
} as const;

/** A slip that was never published is not the same as one that sold out, so the
    two carry different words and different accents. */
const statusLabel = {
  available: "Open",
  "sold-out": "Sales closed",
  unpublished: "Coming up",
  results: "Settled",
} as const;

const statusAccent: Partial<Record<keyof typeof statusLabel, string>> = {
  "sold-out": "#b0201e",
  unpublished: "#6e7681",
  results: "#0b5cff",
};

/** Tier accents read as bronze, silver and gold without ever being the only cue. */
const tierAccent: Record<string, string> = {
  VIP1: "#9a6330",
  VIP2: "#767e8c",
  VIP3: "#a5811b",
};

function formatCheckoutPrice(amountMinor: number) {
  const hasPesewas = amountMinor % 100 !== 0;
  const amount = new Intl.NumberFormat("en-GH", {
    minimumFractionDigits: hasPesewas ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
  return `GHS ${amount}`;
}

function resultChip(result: string) {
  if (result === "WON") return { label: "Won", className: "result result-won" };
  if (result === "LOST") return { label: "Lost", className: "result result-lost" };
  if (["VOID", "PUSH", "CANCELLED"].includes(result)) return { label: "Void", className: "result result-void" };
  return null;
}

export function FeaturedVipMatches({
  plans,
  bookings,
  userSignedIn,
  purchasedBookingIds,
  paymentsConfigured,
  previewPurchaseCtas = false,
  loginNext = "/predictions#featured-vip-matches",
}: {
  plans: VipPlan[];
  bookings: Map<string, VipBooking>;
  userSignedIn: boolean;
  purchasedBookingIds: string[];
  paymentsConfigured: boolean;
  previewPurchaseCtas?: boolean;
  loginNext?: string;
}) {
  return (
    <section id="featured-vip-matches" className="scroll-mt-24" aria-labelledby="featured-vip-heading">
      <SectionHead
        id="featured-vip-heading"
        kicker="Premium"
        title="Today's VIP slips"
        action={{ label: "VIP history", href: "/vip#vip-history-heading" }}
      />

      {plans.length ? (
        <div className="mt-6 grid items-start gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const category = plan.deck?.slug ? categoryByDeckSlug[plan.deck.slug as keyof typeof categoryByDeckSlug] : undefined;
            const booking = category ? bookings.get(category) : undefined;
            const predictions = booking?.predictions ?? [];
            const hasResults = predictions.some((prediction) => prediction.result !== "PENDING");
            const isPurchased = !previewPurchaseCtas && Boolean(booking && purchasedBookingIds.includes(booking.id));
            const notPublished = !booking || predictions.length === 0 || plan.priceMinor <= 0;
            const status = notPublished ? "unpublished" : plan.isSoldOut ? "sold-out" : hasResults ? "results" : "available";
            const checkoutPrice = formatCheckoutPrice(plan.priceMinor);
            const accent = statusAccent[status] ?? tierAccent[category ?? "VIP1"] ?? "#0b5cff";

            return (
              <article key={plan.id} className="flex min-w-0 flex-col rounded-sharp border border-line-2 bg-surface">
                <div className="h-[3px] shrink-0" style={{ background: accent }} aria-hidden="true" />

                <div className="flex items-center justify-between gap-3 border-b border-line-2 px-4 py-3">
                  <h3 className="display-heading min-w-0 text-lg font-semibold">{plan.name}</h3>
                  <span className="eyebrow shrink-0" style={{ color: accent }}>
                    {statusLabel[status]}
                  </span>
                </div>

                <div className="max-h-72 min-h-0 flex-1 overflow-y-auto">
                  {predictions.length ? (
                    predictions.map((prediction) => {
                      const chip = resultChip(prediction.result);
                      return (
                        <div key={prediction.id} className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 last:border-b-0">
                          <p className="min-w-0 flex-1 text-sm font-medium leading-snug">
                            {prediction.fixture.homeTeam.name}{" "}
                            <span className="font-normal text-faint">v</span>{" "}
                            {prediction.fixture.awayTeam.name}
                          </p>
                          {chip ? (
                            <span className={`${chip.className} shrink-0`} aria-label={chip.label}>
                              {chip.label}
                            </span>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <p className="px-4 py-10 text-center text-sm text-muted">
                      Nothing published for this slip today.
                    </p>
                  )}
                </div>

                <div className="border-t border-line-2 p-4">
                  {isPurchased ? (
                    <Link href="/dashboard#my-vip-games" className="btn btn-ghost w-full">
                      View your games
                    </Link>
                  ) : status === "sold-out" ? (
                    <span className="btn btn-ghost w-full" aria-disabled="true">
                      Sales closed
                    </span>
                  ) : status === "unpublished" ? (
                    <span className="btn btn-ghost w-full" aria-disabled="true">
                      Not published yet
                    </span>
                  ) : status === "results" ? (
                    <span className="btn btn-ghost w-full" aria-disabled="true">
                      Results published
                    </span>
                  ) : userSignedIn ? (
                    <CheckoutButton planId={plan.id} configured={paymentsConfigured} label={`Buy · ${checkoutPrice}`} />
                  ) : (
                    <Link href={`/login?next=${encodeURIComponent(loginNext)}`} className="btn btn-primary w-full">
                      Log in to buy · {checkoutPrice}
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="mt-6 rounded-sharp border border-line-2 bg-surface px-5 py-10 text-center text-sm text-muted">
          VIP slips are being prepared. Check back shortly.
        </p>
      )}
    </section>
  );
}
