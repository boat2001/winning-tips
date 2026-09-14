import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { UserMenu } from "@/components/app/user-menu";
import type { Viewer } from "@/lib/domain/viewer";

/**
 * The top utility bar, which changes shape across the three viewport families
 * exactly as the mocks do:
 *
 *   mobile   logo, then bell and a search *link*
 *   tablet   logo, a search field, bell and account chip
 *   desktop  no logo (the sidebar carries it), search field, bell, account chip
 *
 * The mobile search is a link to the tips screen rather than a collapsed input.
 * A search field that expands over the header is a second focus trap to
 * maintain, and the mock shows an icon, not a field.
 */
export function Topbar({ viewer }: { viewer: Viewer }) {
  return (
    <header className="sticky top-0 z-30 border-b border-navy-600/50 bg-navy-850/95 backdrop-blur supports-[backdrop-filter]:bg-navy-850/80">
      <div className="mx-auto flex h-16 max-w-[84rem] items-center gap-3 px-4 sm:gap-4 sm:px-5 xl:h-[4.5rem]">
        <Link href="/home" className="shrink-0 xl:hidden">
          <Logo size="sm" priority />
        </Link>

        {/* Search is a real form so Enter submits and the browser treats it as
            search. It posts to the tips screen, which owns filtering. */}
        <form action="/tips" role="search" className="hidden min-w-0 flex-1 md:block">
          <label htmlFor="app-search" className="sr-only">
            Search teams, leagues, or markets
          </label>
          <div className="relative max-w-xl">
            <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-on-navy-muted" />
            <input
              id="app-search"
              name="q"
              type="search"
              autoComplete="off"
              placeholder="Search teams, leagues, or markets..."
              className="h-11 w-full rounded-pill border border-navy-600 bg-navy-900/80 pl-11 pr-4 text-sm text-on-navy placeholder:text-on-navy-muted focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/tips"
            aria-label="Search tips"
            className="inline-flex size-11 items-center justify-center rounded-full text-on-navy-2 transition-colors hover:bg-navy-700 hover:text-on-navy md:hidden"
          >
            <Search aria-hidden className="size-5" />
          </Link>

          <Link
            href="/notifications"
            className="relative inline-flex size-11 items-center justify-center rounded-full text-on-navy-2 transition-colors hover:bg-navy-700 hover:text-on-navy"
          >
            <Bell aria-hidden className="size-5" />
            {viewer.unreadNotifications > 0 ? (
              <span aria-hidden className="absolute right-2.5 top-2.5 size-2.5 rounded-full bg-green-400 ring-2 ring-navy-850" />
            ) : null}
            <span className="sr-only">
              Notifications
              {viewer.unreadNotifications > 0 ? `, ${viewer.unreadNotifications} unread` : ""}
            </span>
          </Link>

          <span className="hidden text-xs text-on-navy-2 md:block">{viewer.countryName}</span>{viewer.id === "guest" ? <Link href="/login" className="rounded-pill bg-green-400 px-3 py-2 text-xs font-semibold text-navy-950">Sign in</Link> : <span className="hidden sm:block"><UserMenu viewer={viewer} /></span>}
        </div>
      </div>
    </header>
  );
}
