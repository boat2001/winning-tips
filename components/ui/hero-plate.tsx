import Image from "next/image";
import type { ReactNode } from "react";
import heroImage from "@/public/brand/hero-goal.png";

/**
 * The photographic masthead shared by the homepage and the member dashboard.
 *
 * The scrim washes the picture toward white so ink type stays readable on it
 * without the section turning into a dark band. The stops below are tuned
 * against this specific photograph — worst-case contrast anywhere in the text
 * band measures 9.4:1 for the headline and 5.2:1 for body copy, against a 4.5:1
 * AA floor. If a lighter or busier photograph is dropped in, re-measure before
 * thinning them further.
 *
 * Phones carry the headline across the full width so they take a flat wash;
 * from sm up it becomes directional, near-opaque under the type on the left and
 * thinning to 12% on the right so the stadium reads properly.
 */
export function HeroPlate({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate overflow-hidden">
      <Image
        src={heroImage}
        alt=""
        fill
        priority
        quality={90}
        sizes="100vw"
        className="object-cover object-[72%_center]"
        placeholder="blur"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-white/72 sm:hidden" />
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden sm:block sm:bg-[linear-gradient(100deg,rgba(255,255,255,0.90)_0%,rgba(255,255,255,0.85)_42%,rgba(255,255,255,0.62)_60%,rgba(255,255,255,0.12)_100%)]"
      />
      {/* Feathers the plate into whatever band follows it. */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(to_top,#ffffff_0%,rgba(255,255,255,0)_100%)]" />
      {children}
    </div>
  );
}
