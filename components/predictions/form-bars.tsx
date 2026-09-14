import { cn } from "@/lib/utils/cn";

export interface FormBar {
  readonly day: string;
  readonly won: number;
  readonly lost: number;
}

/**
 * The seven-day form strip on the home and profile screens.
 *
 * Heights come from the counts rather than being drawn, so the strip cannot
 * disagree with the numbers beside it. A day with no settled tips renders a
 * short neutral stub instead of nothing, which keeps the weekday labels aligned
 * under their bars.
 *
 * It is a chart, so it carries a text summary: colour alone must never be the
 * only way to tell a winning day from a losing one (guide §14.6, §16).
 */
export function FormBars({ bars, className }: { bars: readonly FormBar[]; className?: string }) {
  const tallest = Math.max(1, ...bars.map((bar) => Math.max(bar.won, bar.lost)));
  const totalWon = bars.reduce((sum, bar) => sum + bar.won, 0);
  const totalLost = bars.reduce((sum, bar) => sum + bar.lost, 0);

  return (
    <figure className={cn("min-w-0", className)}>
      <div aria-hidden className="flex items-end justify-between gap-1.5">
        {bars.map((bar, index) => {
          const settled = bar.won + bar.lost;
          const losing = bar.lost > bar.won;
          const percent = settled === 0 ? 0 : Math.round((Math.max(bar.won, bar.lost) / tallest) * 100);

          return (
            <span key={`${bar.day}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              {/* The track carries the height, not the column: a percentage
                  height resolves against a definite-height parent, and an auto
                  one collapses every bar to nothing. */}
              <span className="flex h-16 w-full items-end justify-center">
                <span
                  style={{ height: `${percent}%`, minHeight: settled === 0 ? "0.375rem" : "0.5rem" }}
                  className={cn(
                    "w-full max-w-2.5 rounded-sm",
                    settled === 0 ? "bg-navy-600" : losing ? "bg-red-500" : "bg-green-400",
                  )}
                />
              </span>
              <span className="text-[0.6875rem] font-semibold text-on-navy-muted">{bar.day}</span>
            </span>
          );
        })}
      </div>

      <figcaption className="sr-only">
        Last seven days: {totalWon} won, {totalLost} lost.
        {bars.map((bar, index) => {
          const settled = bar.won + bar.lost;
          return ` Day ${index + 1}: ${settled === 0 ? "no settled tips" : `${bar.won} won, ${bar.lost} lost`}.`;
        })}
      </figcaption>
    </figure>
  );
}
