import {
  PageHeaderSkeleton,
  SectionHeadSkeleton,
  TipsBoardSkeleton,
  VipCardsSkeleton,
} from "@/components/app/loading-skeletons";
import { LoadingStatus } from "@/components/ui/skeleton";

/** Mirrors app/(app)/tips/page.tsx: header, the three VIP slip cards, then the free board. */
export default function TipsLoading() {
  return (
    <div className="page-stack">
      <LoadingStatus />
      <PageHeaderSkeleton />
      <section className="section-stack">
        <SectionHeadSkeleton />
        <VipCardsSkeleton />
      </section>
      <section className="section-stack">
        <SectionHeadSkeleton action={false} />
        <TipsBoardSkeleton />
      </section>
    </div>
  );
}
