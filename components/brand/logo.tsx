import Image from "next/image";
import markImage from "@/public/brand/winning-tips-mark.png";
import { siteConfig } from "@/lib/config/site";

const markSize = {
  sm: "h-8",
  /* Sidebar lockup. One step under the mock's 56px so the tagline can sit in
     the name's column and still end inside the 240px rail. */
  md: "h-12",
  lg: "h-16",
} as const;

const textSize = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-3xl",
} as const;

/* The tagline is uppercase and longer than the mixed-case name, so it is the
   line that sets the lockup's width. The small size must fit the 64px top bar;
   the medium one is tracked tight to end inside the 240px sidebar. */
const taglineSize = {
  sm: "mt-1 text-[0.625rem] tracking-[0.08em]",
  md: "mt-1.5 text-[0.625rem] tracking-[0.04em]",
  lg: "mt-2 text-xs tracking-[0.1em]",
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
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <Image src={markImage} alt="" priority={priority} className={`${markSize[size]} w-auto shrink-0`} />
      {/* The tagline is part of the name's column, directly under it, with the
          mark standing beside both lines — the brand lockup. It used to hang
          under the whole row, starting beneath the mark, which read as a
          caption rather than part of the name. It needs the name, so a
          mark-only logo never shows it. */}
      {showText ? (
        <span className="flex min-w-0 flex-col">
          <span
            className={`whitespace-nowrap font-brand ${textSize[size]} font-bold leading-none tracking-[-0.01em] text-on-navy`}
          >
            Winning<span className="text-green-400">Tips</span>
          </span>
          {showTagline ? (
            <span className={`kicker whitespace-nowrap leading-none ${taglineSize[size]}`}>{siteConfig.tagline}</span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
