import Image from "next/image";
import markImage from "@/public/brand/winning-tips-mark.png";

const markSize = {
  sm: "h-8",
  /* Sidebar lockup, measured against design-reference/desktop/home.png. */
  md: "h-14",
  lg: "h-16",
} as const;

const textSize = {
  sm: "text-lg",
  md: "text-[1.375rem]",
  lg: "text-3xl",
} as const;

/**
 * The Winning Tips lockup for the stadium system: the pitch-and-tick mark beside
 * a wordmark that splits Winning (white) from Tips (green), echoing the green
 * swoosh in the mark.
 *
 * This is the stadium-system counterpart to components/brand/wordmark.tsx, which
 * still serves the newsprint routes. They are separate on purpose — the two
 * systems set the name in different faces and different colours, and folding
 * them into one component with a `theme` prop would just move the branch
 * somewhere less obvious. The newsprint one goes when its last route does.
 *
 * The mark is imported rather than referenced by path so its URL carries a
 * content hash: replace the file and every cache invalidates on its own.
 */
export function Logo({
  size = "md",
  showText = true,
  showTagline = false,
  priority = false,
}: {
  size?: keyof typeof markSize;
  showText?: boolean;
  showTagline?: boolean;
  priority?: boolean;
}) {
  return (
    <span className="inline-flex min-w-0 flex-col">
      <span className="inline-flex min-w-0 items-center gap-2.5">
        <Image src={markImage} alt="" priority={priority} className={`${markSize[size]} w-auto shrink-0`} />
        {showText ? (
          <span
            className={`whitespace-nowrap font-brand ${textSize[size]} font-bold leading-none tracking-[-0.01em] text-on-navy`}
          >
            Winning<span className="text-green-400">Tips</span>
          </span>
        ) : null}
      </span>
      {/* Tracked tighter than the standard kicker so it holds one line inside
          the 240px sidebar; wrapped, it reads as two stray fragments. */}
      {showTagline ? (
        <span className="kicker mt-2 whitespace-nowrap pl-0.5 text-[0.6875rem] tracking-[0.1em]">
          Data. Insight. More wins.
        </span>
      ) : null}
    </span>
  );
}
