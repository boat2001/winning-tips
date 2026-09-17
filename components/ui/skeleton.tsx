import { cn } from "@/lib/utils/cn";

/**
 * A loading placeholder. `tone` follows the surface it sits on: `navy` for the
 * page ground and navy panels, `card` inside the white data cards.
 */
export function Skeleton({ className, tone = "navy" }: { className?: string; tone?: "navy" | "card" }) {
  return <div aria-hidden="true" className={cn("skeleton-shimmer", tone === "card" && "skeleton-on-card", className)} />;
}

export function LoadingStatus() {
  return <span className="sr-only" role="status">Loading page</span>;
}
