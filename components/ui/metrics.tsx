import type { ReactNode } from "react";
import { type ConfidenceBand, confidenceLabel, probabilityPercent } from "@/lib/domain/tips";
import type { TipGrade } from "@/lib/domain/tips";
import { cn } from "@/lib/utils/cn";

/**
 * Data display primitives: confidence, odds, grades and stat tiles.
 *
 * Every one of these follows the same two rules from the guide. Status is never
 * carried by colour alone (§16) — there is always a label, a glyph or a shape
 * alongside it. And a model probability is never dressed up as a certainty
 * (§8) — the accessible name always says "confidence", never "chance of
 * winning".
 */

/* ---------------------------------------------------------------- confidence */

/**
 * The three-bar signal mark plus its percentage, as every tip row shows it.
 *
 * The bars rise with the band, so the meter reads at a glance without the
 * number and without relying on the green.
 */
export function ConfidenceMeter({
  probability,
  band,
  variant = "chip",
  className,
}: {
  probability: number | null;
  band: ConfidenceBand | null;
  /** `chip` sits on a white card; `bare` sits directly on navy. */
  variant?: "chip" | "bare";
  className?: string;
}) {
  if (probability === null || band === null) return <span className={cn("text-xs text-ink-500", variant === "bare" && "text-on-navy-2", className)}>Not model-rated</span>;
  const percent = probabilityPercent(probability);
  const filled = band === "VERY_HIGH" ? 3 : band === "HIGH" ? 3 : band === "MEDIUM" ? 2 : 1;
  const onNavy = variant === "bare";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2",
        variant === "chip" && "rounded-lg bg-green-100 px-2.5 py-1.5",
        className,
      )}
      title={`${confidenceLabel(band)} — model probability ${percent}%`}
    >
      <span aria-hidden className="flex items-end gap-[2px]">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={cn(
              "w-[3px] rounded-[1px]",
              index === 0 ? "h-2" : index === 1 ? "h-3" : "h-4",
              index < filled ? "bg-green-500" : onNavy ? "bg-navy-600" : "bg-green-100",
            )}
          />
        ))}
      </span>
      <span className="leading-tight">
        <span className={cn("tabular block text-sm font-bold", onNavy ? "text-on-navy" : "text-ink-900")}>
          {percent}%
        </span>
        {/* Shown at every width: the mobile mocks label the chip, and the tip
            rows now give it a column rather than squeezing it beside the team
            names. */}
        <span
          className={cn("conf-word text-[0.6875rem] font-medium", onNavy ? "text-on-navy-muted" : "text-ink-500")}
        >
          Confidence
        </span>
      </span>
      <span className="sr-only">{confidenceLabel(band)}. Model probability {percent} percent.</span>
    </span>
  );
}

/* --------------------------------------------------------------------- odds */

/**
 * A captured decimal price.
 *
 * `stale` is not a styling flag: when a snapshot is older than the freshness
 * threshold the number must not be shown at all (§6), so this renders a prompt
 * to open the operator instead.
 */
export function OddsPill({
  decimal,
  stale = false,
  className,
}: {
  decimal: number;
  stale?: boolean;
  className?: string;
}) {
  if (stale) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-lg border border-navy-600 px-2.5 py-2 text-center text-[0.6875rem] font-semibold leading-tight text-ink-500",
          className,
        )}
      >
        Open bookmaker
        <span className="sr-only"> to see current odds</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "tabular inline-flex min-w-[3.5rem] items-center justify-center rounded-lg bg-green-500 px-3 py-2 text-[0.9375rem] font-bold text-white",
        className,
      )}
    >
      {decimal.toFixed(2)}
      <span className="sr-only"> decimal odds</span>
    </span>
  );
}

/* -------------------------------------------------------------------- grade */

const GRADE_STYLE: Record<TipGrade, string> = {
  WON: "bg-green-500 text-white",
  LOST: "bg-red-500 text-white",
  VOID: "bg-navy-700 text-on-navy-2",
  PUSH: "bg-navy-700 text-on-navy-2",
};

export function ResultBadge({ grade, className }: { grade: TipGrade; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider",
        GRADE_STYLE[grade],
        className,
      )}
    >
      {grade}
    </span>
  );
}

/* ---------------------------------------------------------------- stat tile */

/**
 * A single figure with its label, as the hero strip and the results summary use.
 *
 * `tone` colours only the value, never the label, so the tile stays readable
 * when the figure is red.
 */
export function StatTile({
  value,
  label,
  tone = "ink",
  surface = tone === "on-navy" ? "navy" : "card",
  icon,
  footnote,
  className,
}: {
  value: ReactNode;
  label: string;
  tone?: "ink" | "won" | "lost" | "on-navy";
  /** The ground the tile sits on. Decides the label colour and the shade of a
   *  won/lost value — card ink on navy fails contrast, which is how "Won" and
   *  "Lost" came out near-invisible on the navy performance panels. */
  surface?: "card" | "navy";
  icon?: ReactNode;
  footnote?: ReactNode;
  className?: string;
}) {
  const onNavy = surface === "navy";
  const valueTone = {
    ink: onNavy ? "text-on-navy" : "text-ink-900",
    won: onNavy ? "text-green-400" : "text-green-600",
    lost: "text-red-500",
    "on-navy": "text-on-navy",
  }[tone];
  const labelTone = onNavy ? "text-on-navy-2" : "text-ink-500";

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {icon}
        <p className={cn("tabular text-lg font-bold leading-none sm:text-[1.375rem]", valueTone)}>{value}</p>
      </div>
      {/* Wraps rather than truncates: "Total Picks" clipped to "Total Pic..."
          tells the reader nothing, and three of these sit side by side on a
          390px screen (guide §12). */}
      <p className={cn("mt-1.5 text-[0.6875rem] font-medium leading-tight sm:text-[0.8125rem]", labelTone)}>{label}</p>
      {footnote}
    </div>
  );
}
