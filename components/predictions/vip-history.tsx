import Link from "next/link";
import { SectionHead } from "@/components/ui/layout";
import { toDateKey } from "@/lib/football/dates";

type VipHistoryDeck = {
  id: string;
  name: string;
  slug: string;
  predictions: Array<{
    id: string;
    slug: string;
    homeTeam: string;
    awayTeam: string;
    market: string;
    selection: string;
    result: string;
  }>;
};

function resultChip(result: string) {
  if (result === "WON") return { label: "Won", className: "result result-won" };
  if (result === "LOST") return { label: "Lost", className: "result result-lost" };
  if (["VOID", "PUSH", "CANCELLED"].includes(result)) return { label: "Void", className: "result result-void" };
  return { label: "Open", className: "result result-pending" };
}

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** The archive. Losses are published here alongside wins, by design. */
export function VipHistory({ decks, date }: { decks: VipHistoryDeck[]; date: string }) {
  const selected = new Date(`${date}T12:00:00.000Z`);
  const previous = toDateKey(new Date(selected.getTime() - 86_400_000));
  const next = toDateKey(new Date(selected.getTime() + 86_400_000));

  return (
    <section className="mt-14" aria-labelledby="vip-history-heading">
      <SectionHead id="vip-history-heading" kicker="Archive" title="VIP history" />

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link href={`/vip?historyDate=${previous}#vip-history-heading`} className="btn btn-ghost h-10 min-h-10 px-3">
          ← Previous
        </Link>
        <form action="/vip" className="flex min-w-0 flex-1 gap-2 sm:max-w-xs">
          <input name="historyDate" type="date" defaultValue={date} className="field num h-10" aria-label="History date" />
          <button className="btn btn-ink h-10 min-h-10 px-4">Go</button>
        </form>
        <Link href={`/vip?historyDate=${next}#vip-history-heading`} className="btn btn-ghost h-10 min-h-10 px-3">
          Next →
        </Link>
      </div>

      <p className="eyebrow mt-4">{dayFormatter.format(selected)}</p>

      {decks.length ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {decks.map((deck) => (
            <article key={deck.id} className="min-w-0 rounded-sharp border border-line-2 bg-surface">
              <h3 className="display-heading border-b-2 border-ink px-4 py-3 text-lg font-semibold">{deck.name}</h3>
              {deck.predictions.length ? (
                <div className="max-h-96 overflow-y-auto">
                  {deck.predictions.map((prediction) => {
                    const chip = resultChip(prediction.result);
                    return (
                      <div key={prediction.id} className="border-b border-line px-4 py-3 last:border-b-0">
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 text-sm font-semibold leading-snug">
                            {prediction.homeTeam} <span className="font-normal text-faint">v</span> {prediction.awayTeam}
                          </p>
                          <span className={`${chip.className} shrink-0`} aria-label={chip.label}>
                            {chip.label}
                          </span>
                        </div>
                        <p className="eyebrow mt-1.5">
                          {prediction.market} · {prediction.selection}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="px-4 py-10 text-center text-sm text-muted">Nothing published for this slip on this date.</p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-sharp border border-line-2 bg-surface px-5 py-10 text-center text-sm text-muted">
          No VIP results have been published for this date.
        </p>
      )}
    </section>
  );
}
