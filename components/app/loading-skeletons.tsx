import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

/*
 * Loading placeholders shaped like the real screens and drawn on the same
 * surfaces — navy panels for framing, white cards for data — so a page does
 * not change character when its content lands. Each mirrors the component
 * named beside it; when that component's layout changes, change this too.
 */

/* Varied line lengths, so a list of placeholders reads as content rather than
   as a stack of identical bars. */
const LINE_WIDTHS = ["w-4/5", "w-3/5", "w-2/3", "w-3/4", "w-1/2"] as const;
const lineWidth = (index: number) => LINE_WIDTHS[index % LINE_WIDTHS.length];

/** components/app/page-header.tsx */
export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-0.5 pt-1">
      <Skeleton className="h-8 w-32 sm:h-9" />
      <Skeleton className="h-4 w-40" />
    </div>
  );
}

/** components/ui/surface.tsx › SectionHead */
export function SectionHeadSkeleton({ action = true }: { action?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-6 w-52 max-w-full" />
        <Skeleton className="h-3.5 w-64 max-w-full" />
      </div>
      {action ? <Skeleton className="h-9 w-24 shrink-0 rounded-pill" /> : null}
    </div>
  );
}

/** components/predictions/tips-board.tsx */
export function TipsBoardSkeleton({ rows = 4, footer = false, className }: { rows?: number; footer?: boolean; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-card bg-card shadow-card", className)}>
      <div className="grid grid-cols-2 border-b border-card-line">
        <div className="space-y-2 border-r border-card-line bg-card-2 px-4 py-3">
          <Skeleton tone="card" className="h-4 w-20" />
          <Skeleton tone="card" className="h-3 w-24" />
        </div>
        <div className="relative space-y-2 px-4 py-3">
          <Skeleton tone="card" className="h-4 w-14" />
          <Skeleton tone="card" className="h-3 w-24" />
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-card-line" />
        </div>
      </div>
      <div className="border-b border-card-line p-3">
        <Skeleton tone="card" className="h-11 w-full rounded-pill" />
      </div>
      <div className="divide-y divide-card-line">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="px-4 py-3.5 sm:grid sm:grid-cols-[2rem_minmax(0,1.6fr)_minmax(0,1fr)_3.5rem_4.5rem] sm:items-center sm:gap-x-4"
          >
            <Skeleton tone="card" className="hidden h-3 w-5 sm:block" />
            <div className="space-y-2">
              <Skeleton tone="card" className="h-3 w-32" />
              <Skeleton tone="card" className={cn("h-4", lineWidth(index))} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 sm:mt-0 sm:contents">
              <div className="flex-1 space-y-2">
                <Skeleton tone="card" className="h-3 w-20" />
                <Skeleton tone="card" className="h-4 w-14" />
              </div>
              <Skeleton tone="card" className="h-4 w-10 shrink-0 sm:justify-self-end" />
              <Skeleton tone="card" className="h-6 w-14 shrink-0 rounded-pill sm:justify-self-end" />
            </div>
          </div>
        ))}
      </div>
      {footer ? (
        <div className="flex min-h-11 items-center justify-center border-t border-card-line bg-card-2">
          <Skeleton tone="card" className="h-4 w-16" />
        </div>
      ) : null}
    </div>
  );
}

/* The tier colours are known before any data is, so the accent bars can show
   straight away — at half strength, so they still read as "loading". */
const TIER_ACCENTS = ["#b87333", "#9aa3b2", "#d4a017"] as const;

/** components/predictions/vip-slip-cards.tsx */
export function VipCardsSkeleton() {
  return (
    <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
      {TIER_ACCENTS.map((accent) => (
        <div key={accent} className="overflow-hidden rounded-card bg-card shadow-card">
          <div aria-hidden className="h-1.5 opacity-50" style={{ background: accent }} />
          <div className="flex items-center justify-between gap-3 border-b border-card-line px-4 py-3">
            <Skeleton tone="card" className="h-5 w-16" />
            <Skeleton tone="card" className="h-6 w-20 rounded-pill" />
          </div>
          <div className="divide-y divide-card-line">
            {[0, 1, 2].map((index) => (
              <div key={index} className="space-y-2 px-4 py-3">
                <Skeleton tone="card" className={cn("h-4", lineWidth(index + 1))} />
                <Skeleton tone="card" className="h-3 w-2/5" />
              </div>
            ))}
          </div>
          <div className="border-t border-card-line p-4">
            <Skeleton tone="card" className="h-11 w-full rounded-pill" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** components/app/page-hero.tsx, as the home dashboard uses it */
export function HomeHeroSkeleton() {
  return (
    <div className="rounded-[14px] border border-[#087ab5]/60 bg-navy-800 px-3 pb-3 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
      <div className="max-w-xl space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-9 w-64 max-w-full sm:h-12 sm:w-96" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-10 w-36 rounded-pill" />
        <Skeleton className="h-10 w-24 rounded-pill" />
      </div>
      <div className="mt-3 grid max-w-2xl grid-cols-3 gap-2 sm:gap-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="rounded-card bg-card p-3">
            <Skeleton tone="card" className="h-7 w-12" />
            <Skeleton tone="card" className="mt-2 h-3 w-16 max-w-full" />
            <Skeleton tone="card" className="mt-3 h-6 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** The home dashboard's "Explore Sports" tiles (.home-sports-list) */
export function SportTilesSkeleton() {
  return (
    <div className="home-sports-list">
      {[0, 1, 2].map((index) => (
        <div key={index} className="sport-tile">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="w-full space-y-1.5">
            <Skeleton className="h-3.5 w-16 max-w-full" />
            <Skeleton className="h-3 w-12 max-w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** components/predictions/tip-filters.tsx › TipFilterRow */
export function FilterRailSkeleton() {
  return (
    <div className="flex gap-2.5 overflow-hidden">
      <Skeleton className="h-11 w-24 shrink-0 rounded-pill" />
      <Skeleton className="h-11 w-28 shrink-0 rounded-pill" />
      <Skeleton className="h-11 w-32 shrink-0 rounded-pill" />
    </div>
  );
}

/** components/predictions/tip-row.tsx — the white list rows most screens are built from */
export function CardRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-card bg-card p-3.5 shadow-card">
          <Skeleton tone="card" className="size-10 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton tone="card" className="h-3 w-28" />
            <Skeleton tone="card" className={cn("h-4", lineWidth(index))} />
          </div>
          <Skeleton tone="card" className="h-8 w-14 shrink-0 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** components/ui/surface.tsx › Panel — a navy panel holding lines of text */
export function PanelSkeleton({ lines = 4, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-3 rounded-card border border-navy-600/50 bg-navy-800 p-5", className)}>
      <Skeleton className="h-5 w-44" />
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn("h-3.5", lineWidth(index))} />
      ))}
    </div>
  );
}
