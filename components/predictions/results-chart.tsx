import type { FormBar } from "@/components/predictions/form-bars";
import { cn } from "@/lib/utils/cn";

/**
 * Daily net results over the last seven days.
 *
 * Plots wins minus losses, so a losing day sits below the zero line exactly as
 * the mock's chart does. The mock's axis is units of profit; this product does
 * not publish a units figure without an approved staking method (§22), and net
 * decided outcomes is the honest quantity we do have.
 *
 * Built as HTML chrome around a stretched SVG rather than one scaling SVG. A
 * `viewBox` that scales to its container scales its text with it — axis labels
 * come out 6px on a phone and 25px on a desktop. Only the path stretches here,
 * with `vector-effect` holding the stroke at 2px, so labels stay at their
 * intended size and the markers stay circular.
 */
export function ResultsChart({ bars, className }: { bars: readonly FormBar[]; className?: string }) {
  if (bars.length === 0) return null;

  const net = bars.map((bar) => bar.won - bar.lost);
  const high = Math.max(1, ...net);
  const low = Math.min(0, ...net);
  // Pad the domain so an extreme is never drawn on the frame itself.
  const max = high + 1;
  const min = low - 1;
  const span = max - min;

  const xOf = (index: number) => (bars.length === 1 ? 50 : (index / (bars.length - 1)) * 100);
  const yOf = (value: number) => ((max - value) / span) * 100;

  // Whole-number ticks on an even step, always including zero. Thirds of the
  // span rounded to integers skipped values ("3, 2, 0, -1") and were spread
  // evenly by flexbox while their gridlines sat at their true positions, so
  // labels and lines disagreed.
  const step = Math.max(1, Math.ceil(span / 4));
  const ticks: number[] = [];
  for (let tick = Math.floor(max / step) * step; tick >= min; tick -= step) ticks.push(tick);
  const path = net.map((value, index) => `${index === 0 ? "M" : "L"}${xOf(index)},${yOf(value)}`).join(" ");
  const zeroY = yOf(0);

  const totalWon = bars.reduce((sum, bar) => sum + bar.won, 0);
  const totalLost = bars.reduce((sum, bar) => sum + bar.lost, 0);

  return (
    <figure className={cn("min-w-0", className)}>
      <div className="flex gap-2.5">
        <div aria-hidden className="tabular relative w-6 shrink-0 text-right text-[0.6875rem] font-medium text-on-navy-muted">
          {ticks.map((tick) => (
            <span key={tick} style={{ top: `${yOf(tick)}%` }} className="absolute right-0 -translate-y-1/2 leading-none">
              {tick > 0 ? `+${tick}` : tick}
            </span>
          ))}
        </div>

        <div className="relative h-40 min-w-0 flex-1">
          {/* Solid hairlines one shade off the surface — never dashed, which
              reads as a threshold rather than a grid. The zero line is a shade
              stronger because it is the one that carries meaning. */}
          {ticks.map((tick, index) => (
            <span
              key={`grid-${tick}-${index}`}
              aria-hidden
              style={{ top: `${yOf(tick)}%` }}
              className="absolute inset-x-0 h-px bg-navy-600/45"
            />
          ))}
          <span aria-hidden style={{ top: `${zeroY}%` }} className="absolute inset-x-0 h-px bg-navy-600" />

          <svg
            aria-hidden
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible"
          >
            <defs>
              <linearGradient id="results-chart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3cf980" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#3cf980" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${path} L100,${zeroY} L0,${zeroY} Z`} fill="url(#results-chart-fill)" stroke="none" />
            <path
              d={path}
              fill="none"
              stroke="#3cf980"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {net.map((value, index) => (
            <span
              key={`${bars[index]!.day}-${index}`}
              aria-hidden
              style={{ left: `${xOf(index)}%`, top: `${yOf(value)}%` }}
              className={cn(
                "absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-navy-800",
                value < 0 ? "bg-red-500" : "bg-green-400",
              )}
            />
          ))}
        </div>
      </div>

      <div
        aria-hidden
        className="mt-2 flex gap-2 pl-[2.125rem] text-[0.6875rem] font-medium text-on-navy-muted"
      >
        {bars.map((bar, index) => (
          <span
            key={`${bar.day}-label-${index}`}
            className={cn(
              "min-w-0 flex-1 truncate",
              index === 0 ? "text-left" : index === bars.length - 1 ? "text-right" : "text-center",
            )}
          >
            {bar.day}
          </span>
        ))}
      </div>

      <figcaption className="sr-only">
        Net decided outcomes per day over the last {bars.length} days: {totalWon} won and {totalLost} lost in total. A
        point below the zero line is a day with more losses than wins. Full figures are in the table below.
      </figcaption>

      <details className="mt-1 text-xs text-on-navy-2">
        <summary className="min-h-11 cursor-pointer py-3">Daily totals and chart data</summary>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Won</th>
              <th scope="col">Lost</th>
              <th scope="col">Net</th>
            </tr>
          </thead>
          <tbody>
            {bars.map((bar, index) => (
              <tr key={`${bar.day}-row-${index}`}>
                <th scope="row" className="font-normal">
                  {bar.day}
                </th>
                <td>{bar.won}</td>
                <td>{bar.lost}</td>
                <td>{net[index]! > 0 ? `+${net[index]}` : net[index]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
