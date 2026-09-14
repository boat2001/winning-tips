import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * The two surfaces of the stadium system.
 *
 * `Card` is the white data surface — tip rows, stat tiles, settings lists.
 * `Panel` is the raised navy surface — chart containers, section wrappers that
 * stay on the dark ground.
 *
 * Both exist because the mocks alternate between them deliberately: data that
 * needs to be read precisely goes on white, framing and chrome stays navy. Using
 * the wrong one is the single easiest way to make a screen stop looking like the
 * design, so they are named for their role rather than their colour.
 */

export function Card({
  as: Component = "div",
  id,
  className,
  children,
}: {
  as?: "div" | "article" | "li" | "section";
  /** Present so a section can be an in-page anchor target. */
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Component id={id} className={cn("rounded-card bg-card text-ink-900 shadow-card", className)}>
      {children}
    </Component>
  );
}

export function Panel({
  as: Component = "div",
  id,
  className,
  children,
}: {
  as?: "div" | "section" | "article" | "li";
  /** Present so a section can be an in-page anchor target. */
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Component id={id} className={cn("rounded-card border border-navy-600/50 bg-navy-800", className)}>
      {children}
    </Component>
  );
}

/**
 * A section heading with an optional trailing link, as every mock section uses.
 *
 * The action is a real link rather than a styled span so it is reachable by
 * keyboard and announces its destination; the chevron is decorative.
 */
export function SectionHead({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-x-4", className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon}
        <div className="min-w-0">
          <h2>{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-on-navy-muted">{description}</p> : null}
        </div>
      </div>

      {action ? (
        <Link
          href={action.href}
          className="inline-flex shrink-0 items-center gap-1 rounded-pill border border-navy-600 bg-navy-800/80 px-3.5 py-2 text-sm font-semibold text-on-navy transition-colors hover:border-blue-400 hover:text-blue-300"
        >
          {action.label}
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}
