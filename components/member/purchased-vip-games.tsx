import { CopyBookingCodeButton } from "@/components/member/copy-booking-code-button";
import { Shell, SectionHead } from "@/components/ui/layout";

type VipPurchase = {
  id: string;
  planName: string;
  amountMinor: number;
  currency: string;
  purchasedAt: Date;
  booking: { title: string; platform: string; code: string; shareUrl: string | null; totalOdds: number | null } | null;
  games: Array<{
    id: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    kickoffAt: Date;
    market: string;
    selection: string;
    odds: number;
    result: string;
  }>;
};

const purchaseDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Accra",
});

function resultChip(result: string) {
  if (result === "WON") return { label: "Won", className: "result result-won" };
  if (result === "LOST") return { label: "Lost", className: "result result-lost" };
  if (["VOID", "PUSH", "CANCELLED"].includes(result)) return { label: "Void", className: "result result-void" };
  return { label: "Open", className: "result result-pending" };
}

function formatAmount(amountMinor: number) {
  return new Intl.NumberFormat("en-GH", {
    minimumFractionDigits: amountMinor % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

/** Bought slips, newest first. Each opens to the full book plus its booking code. */
export function PurchasedVipGames({ purchases }: { purchases: VipPurchase[] }) {
  if (!purchases.length) return null;

  return (
    <section id="my-vip-games" className="scroll-mt-24 border-b border-line-2 bg-paper py-12" aria-labelledby="my-vip-games-heading">
      <Shell>
        <SectionHead
          id="my-vip-games-heading"
          kicker="Yours to keep"
          title="Purchased slips"
          count={`${purchases.length} ${purchases.length === 1 ? "slip" : "slips"}`}
        />

        <div className="mt-6 divide-y divide-line border-y border-line-2">
          {purchases.map((purchase) => {
            const completed = purchase.games.length > 0 && purchase.games.every((game) => game.result !== "PENDING");
            return (
              <details key={purchase.id} className="group">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-1 py-4 [&::-webkit-details-marker]:hidden">
                  <svg viewBox="0 0 20 20" className="size-4 shrink-0 text-faint transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="m7 4 6 6-6 6" />
                  </svg>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{purchase.planName}</span>
                    <span className="eyebrow mt-1 block">
                      <span className="num">{purchaseDateFormatter.format(purchase.purchasedAt)}</span> ·{" "}
                      {purchase.games.length} {purchase.games.length === 1 ? "game" : "games"}
                    </span>
                  </span>
                  <span className={`result ${completed ? "result-void" : "result-pending"}`}>
                    {completed ? "Settled" : "Live"}
                  </span>
                  <span className="num w-24 shrink-0 text-right text-sm font-semibold">
                    {purchase.currency} {formatAmount(purchase.amountMinor)}
                  </span>
                </summary>

                <div className="pb-5 pl-7 pr-1">
                  {purchase.games.length ? (
                    <div className="border-t border-line">
                      {purchase.games.map((game) => {
                        const chip = resultChip(game.result);
                        return (
                          <div key={game.id} className="flex items-start justify-between gap-3 border-b border-line py-3 last:border-b-0">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-snug">
                                {game.homeTeam} <span className="font-normal text-faint">v</span> {game.awayTeam}
                              </p>
                              <p className="eyebrow mt-1.5">
                                {game.market} · {game.selection} · <span className="num">{game.odds}</span>
                              </p>
                            </div>
                            <span className={chip.className} aria-label={chip.label}>
                              {chip.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="border-t border-line py-8 text-center text-sm text-muted">
                      The games for this slip have not been published yet.
                    </p>
                  )}

                  {purchase.booking ? (
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-sharp border border-line-2 bg-blue-wash px-4 py-3">
                      <span className="eyebrow eyebrow-blue">Booking code</span>
                      <span className="num text-sm font-semibold tracking-[0.04em]">
                        {purchase.booking.platform}:{purchase.booking.code}
                      </span>
                      <CopyBookingCodeButton code={purchase.booking.code} />
                    </div>
                  ) : null}
                </div>
              </details>
            );
          })}
        </div>
      </Shell>
    </section>
  );
}
