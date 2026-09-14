import Link from "next/link";
import { Bell } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { UserMenu } from "@/components/app/user-menu";
import { ButtonLink } from "@/components/ui/button";
import { homeHrefFor } from "@/lib/config/navigation";
import { siteConfig } from "@/lib/config/site";
import type { Viewer } from "@/lib/domain/viewer";

/**
 * The top utility bar. It carries identity and account actions only:
 * navigation belongs to the sidebar and the bottom bar, and there is no search
 * — the tips screen owns filtering, and a second way in only split attention.
 *
 *   below xl  logo with tagline, then account actions
 *   xl        no logo (the sidebar carries it), account actions on the right
 */
export function Topbar({ viewer }: { viewer: Viewer }) {
  const guest = viewer.id === "guest";

  return (
    <header className="sticky top-0 z-30 border-b border-navy-600/50 bg-navy-850/95 backdrop-blur supports-[backdrop-filter]:bg-navy-850/80">
      <div className="mx-auto flex h-16 max-w-[84rem] items-center gap-3 px-4 sm:gap-4 sm:px-5 xl:h-[4.5rem]">
        <Link href={homeHrefFor(guest)} aria-label={`${siteConfig.name} home`} className="min-w-0 shrink-0 xl:hidden">
          <Logo size="sm" showTagline priority />
        </Link>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <span className="hidden text-xs text-on-navy-2 md:block">{viewer.countryName}</span>

          {guest ? (
            <>
              {/* Dropped below 400px, where beside the two-line lockup it
                  wrapped to "Log / in"; Profile in the bottom bar still leads
                  to sign-in. */}
              <Link
                href="/login"
                className="hidden min-h-11 items-center whitespace-nowrap px-2 text-sm font-semibold text-on-navy-2 transition-colors hover:text-on-navy min-[400px]:inline-flex"
              >
                Log in
              </Link>
              <ButtonLink href="/register" variant="success" size="sm" className="whitespace-nowrap">
                Get Started
              </ButtonLink>
            </>
          ) : (
            <>
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
              <span className="hidden sm:block">
                <UserMenu viewer={viewer} />
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
