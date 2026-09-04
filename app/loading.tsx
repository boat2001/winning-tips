import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";

/** Root shell placeholder: masthead strip, nav row, then a page masthead. */
export default function RootLoading() {
  return (
    <div className="min-h-screen bg-paper">
      <LoadingStatus />
      <div className="hidden h-9 items-center border-b border-line bg-paper md:flex">
        <div className="mx-auto flex w-full max-w-[76rem] items-center justify-between px-5">
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="border-b border-line-2 bg-surface">
        <div className="mx-auto flex h-16 max-w-[76rem] items-center justify-between px-4 sm:px-5">
          <Skeleton className="h-9 w-36" />
          <div className="hidden gap-6 md:flex">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="size-10" />
        </div>
      </div>
      <div className="mx-auto max-w-[76rem] px-4 py-10 sm:px-5">
        <Skeleton className="h-[3px] w-full" />
        <Skeleton className="mt-5 h-3 w-28" />
        <Skeleton className="mt-4 h-12 w-full max-w-lg" />
        <Skeleton className="mt-4 h-4 w-full max-w-xl" />
        <div className="mt-10 grid gap-0 border-y border-line-2 sm:grid-cols-3">
          {[0, 1, 2].map((cell) => (
            <div key={cell} className="px-5 py-6 first:pl-0 sm:border-r sm:border-line-2 sm:last:border-r-0">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="mt-3 h-3 w-28" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-8 h-80 w-full" />
      </div>
    </div>
  );
}
