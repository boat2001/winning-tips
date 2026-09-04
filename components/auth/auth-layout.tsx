import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { siteConfig } from "@/lib/config/site";

const points = [
  "Every free pick shows its market, selection, odds and reasoning",
  "Settled results stay published — wins and losses both",
  "VIP slips are bought one at a time, never on subscription",
] as const;

/**
 * Auth screens are a split masthead: the brand argument on the paper tint to the
 * left, the form on white to the right. The two grounds are a shade apart rather
 * than inverted, so the split reads as one sheet folded, not two themes.
 * On phones the panel collapses above the form and the argument is dropped so
 * the fields stay above the fold.
 */
export function AuthLayout({
  kicker,
  title,
  lede,
  children,
  footer,
}: {
  kicker: string;
  title: string;
  lede: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="lg:grid lg:min-h-[calc(100vh-6.25rem)] lg:grid-cols-2">
      <aside className="flex flex-col justify-between border-b border-line-2 bg-paper-2 px-5 py-8 sm:px-8 lg:border-b-0 lg:border-r lg:px-12 lg:py-14">
        <Link href="/" aria-label={`${siteConfig.name} home`} className="inline-flex w-fit">
          <Wordmark size="md" priority />
        </Link>

        <div className="mt-10 hidden lg:block">
          <p className="eyebrow eyebrow-blue">{siteConfig.tagline}</p>
          <ul className="mt-6 space-y-4">
            {points.map((point) => (
              <li key={point} className="flex gap-3 border-t border-line-2 pt-4 text-sm leading-6 text-ink-2">
                <span aria-hidden="true" className="mt-2.5 h-[3px] w-4 shrink-0 bg-blue" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="eyebrow mt-10 hidden lg:block">18+ only · Bet responsibly</p>
      </aside>

      <main className="bg-surface px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="mx-auto w-full max-w-md">
          <div className="rule-double" />
          <p className="eyebrow eyebrow-blue pt-5">{kicker}</p>
          <h1 className="display-heading mt-3 text-[clamp(1.875rem,6vw,2.5rem)] font-bold leading-[0.95]">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted">{lede}</p>
          {children}
          {footer ? <div className="mt-8 border-t border-line-2 pt-5">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
