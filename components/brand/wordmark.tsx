import Image from "next/image";
import markImage from "@/public/brand/smart-tips-mark.png";

/* The mark is cropped to its own edges, so it is sized by height and left to
   find its own width. Its natural ratio is 330x277. */
const markSize = {
  sm: "h-6",
  md: "h-8",
  lg: "h-12",
} as const;

const textSize = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
} as const;

/**
 * The single source of the Smart Tips lockup: the ball-and-arrow mark beside a
 * condensed wordmark that splits SMART (ink) from TIPS (blue), echoing the blue
 * arrow in the mark. Used by the header, footer, auth screens and admin shell so
 * the brand never drifts between surfaces. The PNG carries real transparency, so
 * it sits on any of the three paper tints without a knockout box behind it.
 *
 * The mark is imported rather than referenced by path so its URL carries a
 * content hash: replace the file and every cache invalidates on its own.
 */
export function Wordmark({
  size = "md",
  showText = true,
  priority = false,
}: {
  size?: keyof typeof markSize;
  showText?: boolean;
  priority?: boolean;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <Image
        src={markImage}
        alt=""
        priority={priority}
        className={`${markSize[size]} w-auto shrink-0`}
      />
      {showText ? (
        <span
          className={`display-heading whitespace-nowrap ${textSize[size]} font-bold leading-none tracking-[0.01em] text-ink`}
        >
          Smart<span className="text-blue">Tips</span>
        </span>
      ) : null}
    </span>
  );
}
