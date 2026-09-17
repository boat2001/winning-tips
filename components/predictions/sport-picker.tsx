"use client";

import { LayoutGrid } from "lucide-react";
import { SportIcon } from "@/components/ui/sport-icon";
import { SPORTS } from "@/lib/domain/tip-filters";
import type { SportSlug } from "@/lib/domain/tips";
import { cn } from "@/lib/utils/cn";

/**
 * "All" plus one chip per sport, for boards that filter what is already on the
 * page. The tips list filters through the URL instead (SportFilter), because it
 * is a server-rendered search.
 *
 * Four equal segments with the icon above the label on phones, where four
 * chips in a row would overflow; a chip row from sm up.
 */
export function SportPicker({
  value,
  onChange,
  tone = "light",
  className,
}: {
  value: SportSlug | null;
  onChange: (sport: SportSlug | null) => void;
  tone?: "light" | "dark";
  className?: string;
}) {
  const options: { value: SportSlug | null; label: string }[] = [{ value: null, label: "All" }, ...SPORTS];
  return (
    <div role="group" aria-label="Filter by sport" className={cn("grid grid-cols-4 gap-1 min-[360px]:gap-1.5 sm:flex sm:gap-2", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex min-w-0 flex-col items-center justify-center gap-1 rounded-control border px-0.5 py-1.5 text-[0.625rem] font-semibold min-[360px]:text-[0.6875rem] transition-colors",
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
            {option.value ? (
              <SportIcon sport={option.value} size="xs" className="rounded-full" />
            ) : (
              <span aria-hidden className="inline-flex size-6 shrink-0 items-center justify-center">
                <LayoutGrid className="size-4" />
              </span>
            )}
            <span className="max-w-full truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
