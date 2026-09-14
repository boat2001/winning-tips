import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * The header for an interior app screen.
 *
 * Deliberately not `PageHero`. The mocks give every screen the same treatment —
 * stadium photograph, athlete cut-out, handwritten slogan, three-beat tagline —
 * which is landing-page language. Repeated on Tips, Results, Community and
 * Profile it stops meaning anything: the fifth "Win together" is wallpaper, and
 * ~200px of vertical space on every screen goes to decoration rather than to
 * the data the member opened the app to read.
 *
 * So the welcome moment stays on Home and on the landing page, where arriving
 * is the event. Everywhere else the header does its actual job: name the screen,
 * say what you are looking at, and hold the controls that change it.
 *
 * `meta` is for a fact — a count, a date range, a status. Not a slogan.
 */
export function PageHeader({
  title,
  meta,
  children,
  className,
}: {
  title: string;
  meta?: ReactNode;
  /** Controls that belong to the screen: filters, range pickers. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("page-header", className)}>
      <div className="page-header-title">
        <h1>{title}</h1>
        {meta ? <p className="page-header-meta">{meta}</p> : null}
      </div>
      {children ? <div className="page-header-controls">{children}</div> : null}
    </header>
  );
}
