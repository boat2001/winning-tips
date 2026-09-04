import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Common measure for every band on the site. */
export function Shell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[76rem] px-4 sm:px-5", className)}>{children}</div>;
}

/**
 * Page masthead: heavy rule, mono kicker, condensed headline, optional lede.
 * Every page opens with one so the site reads as a continuous publication
 * rather than a stack of unrelated screens.
 */
export function PageMasthead({
  kicker,
  title,
  lede,
  children,
  className,
}: {
  kicker: string;
  title: string;
  lede?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Shell className={cn("pb-8 pt-8 sm:pt-10", className)}>
      <div className="rule-double" />
      <p className="eyebrow eyebrow-blue pt-5">{kicker}</p>
      <h1 className="mt-3 max-w-3xl">{title}</h1>
      {lede ? <p className="mt-4 max-w-2xl text-base leading-7 text-ink-2">{lede}</p> : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </Shell>
  );
}

/**
 * Section header. `count` renders on the right as a mono annotation, the way a
 * results page labels how many fixtures sit under a heading.
 */
export function SectionHead({
  kicker,
  title,
  count,
  action,
  id,
}: {
  kicker?: string;
  title: string;
  count?: string;
  action?: { label: string; href: string };
  id?: string;
}) {
  return (
    <div className="border-b-2 border-ink pb-3">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          {kicker ? <p className="eyebrow eyebrow-blue mb-2">{kicker}</p> : null}
          <h2 id={id} className="display-heading text-2xl font-semibold sm:text-3xl">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-5">
          {count ? <span className="eyebrow num">{count}</span> : null}
          {action ? (
            <Link href={action.href} className="eyebrow eyebrow-blue transition-colors hover:text-ink">
              {action.label} →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
