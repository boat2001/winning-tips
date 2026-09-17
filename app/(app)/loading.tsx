import { CardRowsSkeleton, FilterRailSkeleton, PageHeaderSkeleton } from "@/components/app/loading-skeletons";
import { LoadingStatus } from "@/components/ui/skeleton";

/**
 * The member-app fallback, inside the real frame (the sidebar and bars stay
 * put). Results, community, profile and the rest share this shape — a header,
 * a control row and white list rows — which is what most of them are.
 * Home and Tips have their own, because their first screen is different.
 */
export default function AppLoading() {
  return (
    <div className="page-stack">
      <LoadingStatus />
      <PageHeaderSkeleton />
      <FilterRailSkeleton />
      <CardRowsSkeleton />
    </div>
  );
}
