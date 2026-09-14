import type { SportSlug } from "@/lib/domain/tips";
import { cn } from "@/lib/utils/cn";

/**
 * Sport marks, drawn as SVG rather than cropped from the supplied ball
 * photographs.
 *
 * The mocks show photographic balls in a tinted circular tile. The three balls
 * in design-reference/shared/source-assets/balls.png overlap in one cluster, so
 * separating them cleanly is not possible without retouching the owner's
 * artwork — which §15 forbids. Drawing them keeps the colour coding of the mock
 * (white football, orange basketball, yellow-green tennis) while staying crisp
 * at 24px and adding no image weight to a page that renders a dozen of them.
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

function Football() {
  /* Central pentagon plus five edge patches. An earlier version radiated thin
     seams from the middle, which collapsed into an asterisk at the 28px the
     tile actually renders — the edge patches are what make it read as a ball. */
  return (
    <svg viewBox="0 0 32 32" aria-hidden className="size-full">
      <circle cx="16" cy="16" r="14.5" fill="#fff" stroke="#0d1b2e" strokeWidth="1.6" />
      <path d="M16 9.1l6.2 4.5-2.37 7.3h-7.66L9.8 13.6z" fill="#0d1b2e" />
      <g fill="#0d1b2e">
        <path d="M13.1 2.2h5.8l-2.9 4.6z" />
        <path d="M28.6 11.9l-1.8 5.5-3.6-3.6z" />
        <path d="M22.6 28.2l-4.7-3.4 4.5-2.1z" />
        <path d="M9.4 28.2l.2-5.5 4.5 2.1z" />
        <path d="M3.4 11.9l5.4 1.9-3.6 3.6z" />
      </g>
      <g stroke="#0d1b2e" strokeWidth="1.4" strokeLinecap="round" fill="none">
        <path d="M16 9.1V6.8M22.2 13.6l2.2-.8M19.83 20.9l1.1 1.8M12.17 20.9l-1.1 1.8M9.8 13.6l-2.2-.8" />
      </g>
    </svg>
  );
}

function Basketball() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className="size-full">
      <circle cx="16" cy="16" r="14.5" fill="#e8722c" stroke="#8a3d10" strokeWidth="1.5" />
      <g stroke="#8a3d10" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <path d="M1.5 16h29M16 1.5v29" />
        <path d="M5.6 5.6c5.6 5.6 5.6 15.2 0 20.8M26.4 5.6c-5.6 5.6-5.6 15.2 0 20.8" />
      </g>
    </svg>
  );
}

function Tennis() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className="size-full">
      <circle cx="16" cy="16" r="14.5" fill="#d4e94a" stroke="#7c8c1b" strokeWidth="1.5" />
      <g stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M4.7 5.4c4.6 4.2 4.6 17 0 21.2M27.3 5.4c-4.6 4.2-4.6 17 0 21.2" />
      </g>
    </svg>
  );
}

const SPORT_MARK: Record<SportSlug, () => React.ReactElement> = {
  football: Football,
  basketball: Basketball,
  tennis: Tennis,
};

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
  size?: "sm" | "md" | "lg";
  labelled?: boolean;
  className?: string;
}) {
  const Mark = SPORT_MARK[sport];
  const tile = { sm: "size-9 p-1.5", md: "size-11 p-2", lg: "size-14 p-2.5" }[size];

  return (
    <span
      role={labelled ? "img" : undefined}
      aria-label={labelled ? SPORT_LABEL[sport] : undefined}
      aria-hidden={labelled ? undefined : true}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-xl", TILE_TINT[sport], tile, className)}
    >
      <Mark />
    </span>
  );
}
