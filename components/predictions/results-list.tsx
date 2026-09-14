import Link from "next/link";
import { CheckCircle2, ChevronRight, MinusCircle, XCircle } from "lucide-react";
import { ResultBadge } from "@/components/ui/metrics";
import { SportIcon } from "@/components/ui/sport-icon";
import type { GradedTipRow } from "@/lib/domain/performance";
import type { TipGrade } from "@/lib/domain/tips";
import { formatSettledDate } from "@/lib/utils/datetime";
import { formatKickoffTime } from "@/lib/utils/datetime";

/**
 * Settled tips.
 *
 * Two renderings of the same rows: a real table from `lg` up, and cards below
 * it. A wide table on a phone either clips columns or scrolls sideways, and
 * guide §12 forbids clipping data — so the narrow viewport gets labelled cards
 * instead. Only one is ever displayed, and `hidden` removes the other from the
 * accessibility tree, so nothing is announced twice.
 */

/** A glyph beside every badge, so the outcome never rests on colour alone. */
const GRADE_GLYPH: Record<TipGrade, typeof CheckCircle2> = {
  WON: CheckCircle2,
  LOST: XCircle,
  VOID: MinusCircle,
  PUSH: MinusCircle,
};

const GRADE_GLYPH_TONE: Record<TipGrade, string> = {
  WON: "text-green-500",
  LOST: "text-red-500",
  VOID: "text-on-navy-muted",
  PUSH: "text-on-navy-muted",
};

export function ResultsList({ rows, timezone }: { rows: readonly GradedTipRow[]; timezone: string }) {
  // No captured prices means the Odds column would be a full column of
  // em-dashes. An empty column reads as broken data rather than as absent data,
  // so the table drops it entirely until there is something to put in it.
  const hasOdds = rows.some((row) => row.odds !== null);

  return (
    <>
      <div className="hidden overflow-hidden rounded-card border border-navy-600/50 bg-navy-800 lg:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-navy-600/60">
              {["Sport", "Match", "Market", ...(hasOdds ? ["Odds"] : []), "Result", "Date"].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="px-4 py-3 text-[0.8125rem] font-semibold text-on-navy-muted"
                >
                  {heading}
                </th>
              ))}
              <th scope="col" className="w-10">
                <span className="sr-only">View tip</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const Glyph = GRADE_GLYPH[row.grade];
              return (
                <tr key={row.id} className="border-b border-navy-600/40 last:border-b-0 hover:bg-navy-700/40">
                  <td className="px-4 py-3">
                    <SportIcon sport={row.sport} size="sm" labelled />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/tips/${row.slug}`} className="block font-bold text-on-navy hover:text-green-400">
                      {row.fixture}
                    </Link>
                    <span className="text-[0.8125rem] text-on-navy-muted">{row.competition}</span>
                  </td>
                  <td className="px-4 py-3 text-[0.9375rem] text-on-navy-2">{row.market}</td>
                  {hasOdds ? (
                    <td className="tabular px-4 py-3 font-bold text-on-navy">
                      {row.odds === null ? "—" : row.odds.toFixed(2)}
                    </td>
                  ) : null}
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <Glyph aria-hidden className={`size-4 shrink-0 ${GRADE_GLYPH_TONE[row.grade]}`} />
                      <ResultBadge grade={row.grade} />
                      {row.finalScore ? (
                        <span className="tabular text-[0.8125rem] font-semibold text-on-navy-2">{row.finalScore}</span>
                      ) : null}
                    </span>
                  </td>
                  <td className="tabular whitespace-nowrap px-4 py-3 text-[0.8125rem] text-on-navy-2">
                    {formatSettledDate(row.settledAt, timezone)}
                    <span aria-hidden className="mx-1.5 text-on-navy-muted">
                      •
                    </span>
                    {formatKickoffTime(row.settledAt, timezone)}
                  </td>
                  <td className="pr-3">
                    <Link href={`/tips/${row.slug}`} className="inline-flex size-9 items-center justify-center rounded-full text-on-navy-muted hover:text-on-navy">
                      <ChevronRight aria-hidden className="size-4" />
                      <span className="sr-only">View {row.fixture}</span>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-2.5 lg:hidden">
        {rows.map((row) => {
          const Glyph = GRADE_GLYPH[row.grade];
          return (
            <li key={row.id}>
              <Link href={`/tips/${row.slug}`} className="flex items-center gap-3 rounded-card bg-card p-3 shadow-card">
                <SportIcon sport={row.sport} />

                <div className="min-w-0 flex-1">
                  <p className="text-[0.9375rem] font-bold leading-snug text-ink-900">{row.fixture}</p>
                  <p className="text-[0.8125rem] text-ink-500">{row.market}</p>
                  <p className="tabular text-xs text-ink-400">
                    {formatSettledDate(row.settledAt, timezone)}
                    <span aria-hidden className="mx-1.5">
                      •
                    </span>
                    Full time
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {row.odds === null ? null : (
                    <span className="tabular text-[0.9375rem] font-bold text-ink-900">{row.odds.toFixed(2)}</span>
                  )}
                  <ResultBadge grade={row.grade} />
                  <span className="flex items-center gap-1.5">
                    {row.finalScore ? (
                      <span className="tabular text-[0.8125rem] font-semibold text-ink-500">{row.finalScore}</span>
                    ) : null}
                    <Glyph aria-hidden className={`size-4 ${GRADE_GLYPH_TONE[row.grade]}`} />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
