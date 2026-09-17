import { approveCollectedCard, collectFromSources, rejectCollectedCard } from "@/app/admin/sources/actions";
import { RunJobButton } from "@/components/admin/run-job-button";
import { requireAdmin } from "@/lib/auth/authorization";
import { adminRoles } from "@/lib/auth/constants";
import { pendingReviewCards, settledLegsForSource } from "@/lib/sources/queries";
import { tipSources } from "@/lib/sources/registry";
import { judgeSource, summariseRecord } from "@/lib/sources/scorecard";

export const dynamic = "force-dynamic";

const timeFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" });

/**
 * Where collected slips are judged.
 *
 * Two things sit here on purpose: what each source's slips have actually done,
 * and the cards waiting for a decision. A source is trusted by its settled
 * record alone — never by its own claims — and nothing collected reaches a
 * member until someone approves it here.
 */
export default async function AdminSourcesPage() {
  const actor = await requireAdmin();
  const canDecide = actor.role === adminRoles[0] || actor.role === adminRoles[1];

  const [records, pending] = await Promise.all([
    Promise.all(tipSources.map(async (source) => {
      const summary = summariseRecord(await settledLegsForSource(source.id));
      return { source, summary, verdict: judgeSource(summary) };
    })),
    pendingReviewCards(),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-7 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] text-ink sm:text-4xl">Sources</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Booking codes published by the sources below are loaded from the bookmaker, screened, and held here until you approve
            them. Screening refuses what cannot be sold honestly — it does not predict winners.
          </p>
        </div>
        {canDecide ? (
          <form action={collectFromSources}>
            <RunJobButton label="Collect now" busyLabel="Collecting…" />
          </form>
        ) : null}
      </div>

      <section className="mt-7 grid gap-3 md:grid-cols-2" aria-label="Source records">
        {records.map(({ source, summary, verdict }) => (
          <article key={source.id} className="rounded-sharp border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-ink">{source.name}</h2>
                <p className="mt-1 break-all text-xs text-muted">{source.url}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold ${source.enabled ? "bg-blue-wash text-blue" : "bg-hold-bg text-hold"}`}>
                {source.enabled ? "COLLECTING" : "OFF"}
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
              <div>
                <dt className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-faint">Settled</dt>
                <dd className="mt-1 text-lg font-semibold text-ink">{summary.settled}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-faint">Won</dt>
                <dd className="mt-1 text-lg font-semibold text-ink">{summary.won}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-faint">Win rate</dt>
                {/* Never a bare percentage: a rate without its sample says nothing. */}
                <dd className="mt-1 text-lg font-semibold text-ink">{summary.winRate === null ? "—" : `${Math.round(summary.winRate * 100)}%`}</dd>
              </div>
            </dl>

            <p className="mt-4 text-xs text-muted">{source.enabled ? verdict.reason : source.note}</p>
          </article>
        ))}
      </section>

      <section className="mt-8" aria-labelledby="review-queue-heading">
        <h2 id="review-queue-heading" className="text-lg font-semibold text-ink">Waiting for review ({pending.length})</h2>
        <div className="mt-3 space-y-3">
          {pending.map((card) => (
            <article key={card.id} className="rounded-sharp border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-ink">{card.title} · {card.code}</h3>
                  <p className="mt-1 text-xs text-muted">
                    From {card.source} · {card.predictions.length} games · Total odds {card.totalOdds?.toString() ?? "—"} · Collected {timeFormat.format(card.createdAt)}
                  </p>
                </div>
                {card.sourceUrl ? <a href={card.sourceUrl} rel="noreferrer noopener nofollow" target="_blank" className="text-xs font-semibold text-blue">Source page</a> : null}
              </div>

              <ul className="mt-4 divide-y divide-line border-y border-line">
                {card.predictions.map((pick) => (
                  <li key={pick.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{pick.fixture.homeTeam.name} vs {pick.fixture.awayTeam.name}</p>
                      <p className="mt-0.5 text-xs text-muted">{pick.selection} · {pick.market} · {timeFormat.format(pick.fixture.kickoffAt)}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-ink-2">{pick.odds.toString()}</span>
                  </li>
                ))}
              </ul>

              {canDecide ? (
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <form action={approveCollectedCard}>
                    <input type="hidden" name="id" value={card.id} />
                    <RunJobButton label="Approve and publish" busyLabel="Publishing…" />
                  </form>
                  <form action={rejectCollectedCard} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={card.id} />
                    <label className="text-xs font-bold text-ink-2">
                      Reason
                      <input name="reason" maxLength={300} placeholder="Why it was refused" className="mt-1.5 h-10 w-56 max-w-full rounded-sharp border border-line px-3 text-sm" />
                    </label>
                    <RunJobButton label="Reject" busyLabel="Rejecting…" tone="ghost" />
                  </form>
                </div>
              ) : null}
            </article>
          ))}
          {pending.length === 0 ? (
            <p className="rounded-sharp border border-line bg-white p-10 text-center text-sm text-muted">Nothing is waiting for review.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
