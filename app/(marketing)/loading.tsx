import { TipsBoardSkeleton } from "@/components/app/loading-skeletons";
import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors the landing page: the hero's copy column, then the free tips band.
 *
 * Built on the real `.landing-hero` / `.landing-copy` / `.landing-trust`
 * classes, so the placeholder takes exactly the hero's padding and height at
 * every width instead of approximating it. The artwork is left out — a grey
 * block where the athletes go reads as broken, not as loading.
 */
export default function LandingLoading() {
  return (
    <>
      <LoadingStatus />
      <section className="landing-hero" aria-hidden>
        <div className="landing-wash" />
        <div className="landing-copy">
          <Skeleton className="h-3 w-56 max-w-full" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-9 w-72 max-w-full sm:h-12 sm:w-96" />
            <Skeleton className="h-9 w-64 max-w-full sm:h-12 sm:w-[22rem]" />
            <Skeleton className="h-9 w-56 max-w-full sm:h-12 sm:w-80" />
          </div>
          <div className="mt-5 space-y-2.5">
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-11/12 max-w-md" />
            <Skeleton className="h-4 w-3/5 max-w-md" />
          </div>
          <div className="landing-actions">
            <Skeleton className="h-14 w-full rounded-[14px] md:h-[62px] md:w-64" />
            <Skeleton className="h-[50px] w-full rounded-[14px] md:h-[58px] md:w-40" />
          </div>
          <div className="landing-channels">
            <Skeleton className="h-10 w-28 rounded-pill" />
            <Skeleton className="h-10 w-28 rounded-pill" />
          </div>
          <div className="landing-trust">
            {[0, 1, 2].map((item) => (
              <div key={item}>
                <Skeleton className="size-6 shrink-0 rounded-md" />
                <Skeleton className="h-3 w-20 max-w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-band" aria-hidden>
        <div className="landing-container">
          <div className="max-w-2xl space-y-3">
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-9 w-80 max-w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <TipsBoardSkeleton footer className="mt-8" />
        </div>
      </section>
    </>
  );
}
