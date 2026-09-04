import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("skeleton-shimmer", className)} />;
}

export function LoadingStatus() {
  return <span className="sr-only" role="status">Loading page</span>;
}
