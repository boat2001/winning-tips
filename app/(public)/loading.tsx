import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";
import { Shell } from "@/components/ui/layout";

/** Mirrors the masthead-then-board rhythm every public page uses. */
export default function PublicLoading() {
  return (
    <div className="min-h-[65vh] bg-paper pb-14 pt-8">
      <LoadingStatus />
      <Shell>
        <div className="rule-double" />
        <Skeleton className="mt-5 h-3 w-28" />
        <Skeleton className="mt-4 h-10 w-full max-w-md" />
        <Skeleton className="mt-4 h-4 w-full max-w-xl" />

        <div className="mt-10 border border-line-2 bg-surface">
          <div className="grid grid-cols-3 border-b border-line-2">
            {[0, 1, 2].map((tab) => (
              <div key={tab} className="border-r border-line-2 p-3 last:border-r-0">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-2 h-3 w-14" />
              </div>
            ))}
          </div>
          <div className="border-b border-line-2 p-3">
            <Skeleton className="h-[2.875rem] w-full" />
          </div>
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="grid gap-3 border-b border-line px-4 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_5.5rem] sm:items-center sm:gap-x-4">
              <div>
                <Skeleton className="h-3 w-32" />
                <Skeleton className="mt-2 h-4 w-4/5" />
              </div>
              <div>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-2 h-4 w-2/3" />
              </div>
              <Skeleton className="h-5 w-16 sm:justify-self-end" />
            </div>
          ))}
        </div>
      </Shell>
    </div>
  );
}
