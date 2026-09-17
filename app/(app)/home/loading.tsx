import {
  HomeHeroSkeleton,
  PanelSkeleton,
  SectionHeadSkeleton,
  SportTilesSkeleton,
  TipsBoardSkeleton,
} from "@/components/app/loading-skeletons";
import { LoadingStatus } from "@/components/ui/skeleton";

/** Mirrors app/(app)/home/page.tsx: hero, free tips board beside the sports, performance. */
export default function HomeLoading() {
  return (
    <div className="home-page page-stack">
      <LoadingStatus />
      <HomeHeroSkeleton />
      <div className="home-grid">
        <section className="section-stack min-w-0">
          <SectionHeadSkeleton />
          <TipsBoardSkeleton />
        </section>
        <section className="home-sports section-stack min-w-0">
          <SectionHeadSkeleton />
          <SportTilesSkeleton />
        </section>
      </div>
      <PanelSkeleton lines={3} />
    </div>
  );
}
