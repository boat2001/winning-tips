import { PanelSkeleton } from "@/components/app/loading-skeletons";
import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";
import { Shell } from "@/components/ui/layout";

/**
 * The older content pages (about, VIP, sign-in, legal…) inside the app frame.
 * They share only a masthead — kicker, title, lede — followed by content, so
 * that is the shape drawn: no particular page's layout is promised.
 */
export default function PublicLoading() {
  return (
    <Shell className="min-h-[65vh] pb-14 pt-8">
      <LoadingStatus />
      <Skeleton className="h-[3px] w-full max-w-xs rounded-full" />
      <Skeleton className="mt-5 h-3 w-28" />
      <Skeleton className="mt-4 h-10 w-full max-w-md" />
      <Skeleton className="mt-4 h-4 w-full max-w-xl" />
      <div className="mt-10 grid gap-3 md:grid-cols-2">
        <PanelSkeleton />
        <PanelSkeleton lines={3} />
      </div>
    </Shell>
  );
}
