import type { ReactNode } from "react";

/**
 * Auth screens are one centred card: title, a line of context, the form, and a
 * footer link to the neighbouring screen. Nothing competes with the form — the
 * site header above already carries the brand.
 *
 * The card is centred in the viewport below the header (h-18 on mobile, h-20
 * from lg), so short forms sit mid-screen and long ones simply scroll.
 *
 * This renders a <div>, not a <main>: the public layout already provides the
 * page's main landmark.
 */
export function AuthLayout({
  title,
  lede,
  children,
  footer,
}: {
  title: string;
  lede: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100svh-4.5rem)] flex-col items-center justify-center px-4 py-10 sm:px-6 lg:min-h-[calc(100svh-5rem)] lg:py-14">
      <div className="w-full max-w-md rounded-card border border-line-2 bg-surface p-6 shadow-lg sm:p-8">
        <div className="text-center">
          <h1 className="text-[clamp(1.625rem,5vw,2rem)] font-bold leading-tight">{title}</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">{lede}</p>
        </div>
        {children}
        {footer ? <div className="mt-6 border-t border-line-2 pt-5 text-center">{footer}</div> : null}
      </div>

      <p className="mt-6 text-xs text-muted">18+ only · Bet responsibly</p>
    </div>
  );
}
