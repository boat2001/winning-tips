import { PageHeaderSkeleton, TipsBoardSkeleton } from "@/components/app/loading-skeletons";
import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";

/**
 * Shown before any route group's layout has rendered, so it draws the app
 * frame itself: the sidebar from 1200px, the top bar, and the white bottom bar
 * below 1200px, matching components/app/app-shell.tsx. Once a layout is up,
 * the group's own loading.tsx takes over inside the real frame.
 */
export default function RootLoading() {
  return (
    <div className="app-shell min-h-dvh xl:pl-60">
      <LoadingStatus />

      <div aria-hidden className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-navy-600/50 bg-navy-950 px-4 pt-6 xl:flex">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-2.5 w-32" />
          </div>
        </div>
        <div className="mt-8 space-y-1.5">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="flex min-h-[58px] items-center gap-3.5 px-4">
              <Skeleton className="size-5 rounded-md" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* White below xl and navy from xl, like the real top bar. */}
      <div aria-hidden className="sticky top-0 z-30 border-b border-card-line bg-card xl:border-navy-600/50 xl:bg-navy-850">
        <div className="mx-auto flex h-16 max-w-[84rem] items-center gap-3 px-4 sm:px-5 xl:h-[4.5rem]">
          <div className="flex items-center gap-2.5 xl:hidden">
            <Skeleton tone="card" className="size-8 shrink-0 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton tone="card" className="h-4 w-24" />
              <Skeleton tone="card" className="h-2.5 w-36" />
            </div>
          </div>
          <Skeleton tone="card" className="ml-auto h-10 w-28 rounded-pill xl:hidden" />
          <Skeleton className="ml-auto hidden h-10 w-28 rounded-pill xl:block" />
        </div>
      </div>

      <div className="app-main mx-auto w-full max-w-[84rem] px-4 pb-28 pt-4 sm:px-5 sm:pt-5 xl:pb-10">
        <div className="page-stack">
          <PageHeaderSkeleton />
          <TipsBoardSkeleton />
        </div>
      </div>

      <div aria-hidden className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-card-line bg-card shadow-raised xl:hidden">
        <div className="mx-auto flex max-w-3xl">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="flex min-h-[3.5rem] flex-1 flex-col items-center justify-center gap-1.5 py-2">
              <Skeleton tone="card" className="size-5 rounded-md" />
              <Skeleton tone="card" className="h-2.5 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
