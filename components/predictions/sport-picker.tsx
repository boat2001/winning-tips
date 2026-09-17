"use client";

import { SportIcon } from "@/components/ui/sport-icon";
import { SPORTS } from "@/lib/domain/tip-filters";
import type { SportSlug } from "@/lib/domain/tips";
import { cn } from "@/lib/utils/cn";

/**
 * One chip per sport for the VIP and free boards, filtering what is already on
 * the page. One sport is always selected, football by default; there is
 * deliberately no "All".
 *
 * Equal segments with the icon above the label on phones; a chip row from sm up.
 */
export function SportPicker({
  value,
  onChange,
  tone = "light",
  className,
}: {
  value: SportSlug;
  onChange: (sport: SportSlug) => void;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div role="group" aria-label="Filter by sport" className={cn("grid grid-cols-3 gap-1.5 sm:flex sm:gap-2", className)}>
      {SPORTS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex min-w-0 flex-col items-center justify-center gap-1 rounded-control border px-1 py-1.5 text-xs font-semibold transition-colors",
              "sm:min-h-9 sm:shrink-0 sm:flex-row sm:gap-1.5 sm:rounded-pill sm:py-1 sm:pl-1.5 sm:pr-3.5 sm:text-sm",
              tone === "light"
                ? active
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-card-line bg-card-2 text-ink-700 hover:border-blue-400"
                : active
                  ? "border-green-400 bg-green-400 text-navy-950"
                  : "border-navy-600 bg-navy-800 text-on-navy-2 hover:border-green-400",
            )}
          >
            <SportIcon sport={option.value} size="xs" className="rounded-full" />
            <span className="max-w-full truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
