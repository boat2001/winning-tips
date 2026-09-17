import Image, { type StaticImageData } from "next/image";
import type { SportSlug } from "@/lib/domain/tips";
import { cn } from "@/lib/utils/cn";
import football from "@/public/assets/sports/football.webp";
import basketball from "@/public/assets/sports/basketball.webp";
import tennis from "@/public/assets/sports/tennis.webp";

/**
 * Sport marks: one ball image per sport, from Microsoft's Fluent Emoji 3D set
 * (MIT). The owner's balls.webp shows all three balls overlapping in one
 * cluster, so it can't be split into separate marks without retouching it.
 * Recorded in docs/design-decisions.md.
 */

const TILE_TINT: Record<SportSlug, string> = {
  football: "bg-[#eef3fb]",
  basketball: "bg-[#fdeee4]",
  tennis: "bg-[#f0f8dd]",
};

const SPORT_LABEL: Record<SportSlug, string> = {
  football: "Football",
  basketball: "Basketball",
  tennis: "Tennis",
};

export function sportLabel(sport: SportSlug): string {
  return SPORT_LABEL[sport];
}

const SPORT_MARK: Record<SportSlug, StaticImageData> = { football, basketball, tennis };

/**
 * The mark on its tinted tile, as tip rows and the sport explorer use it.
 *
 * Decorative by default: the sport is always named in adjacent text, so
 * repeating it for a screen reader would just add noise. Pass `labelled` where
 * the mark stands alone.
 */
export function SportIcon({
  sport,
  size = "md",
  labelled = false,
  className,
}: {
  sport: SportSlug;
  size?: "xs" | "sm" | "md" | "lg";
  labelled?: boolean;
  className?: string;
}) {
  const tile = { xs: "size-6 p-0.5", sm: "size-9 p-1.5", md: "size-11 p-2", lg: "size-14 p-2.5" }[size];

  return (
    <span
      role={labelled ? "img" : undefined}
      aria-label={labelled ? SPORT_LABEL[sport] : undefined}
      aria-hidden={labelled ? undefined : true}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-xl", TILE_TINT[sport], tile, className)}
    >
      <Image src={SPORT_MARK[sport]} alt="" sizes="40px" className="size-full object-contain" />
    </span>
  );
}
