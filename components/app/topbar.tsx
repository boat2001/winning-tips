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
 *   below xl  white bar: logo with tagline, then account actions — it pairs
 *             with the white bottom bar, so phones and tablets get a light
 *             frame round the navy content
 *   xl        navy bar beside the navy sidebar, no logo (the sidebar carries
 *             it), account actions on the right
 */
export function Topbar({ viewer }: { viewer: Viewer }) {
  const guest = viewer.id === "guest";

  return (
    // Opaque white below xl: any translucency lets the navy page through and
    // the bar reads grey. The frosted navy bar is kept for desktop.
    <header className="sticky top-0 z-30 border-b border-card-line bg-card xl:border-navy-600/50 xl:bg-navy-850/95 xl:backdrop-blur xl:supports-[backdrop-filter]:bg-navy-850/80">
      <div className="mx-auto flex h-16 max-w-[84rem] items-center gap-3 px-4 sm:gap-4 sm:px-5 xl:h-[4.5rem]">
        <Link href={homeHrefFor(guest)} aria-label={`${siteConfig.name} home`} className="min-w-0 shrink-0 xl:hidden">
          <Logo size="sm" showTagline priority tone="light" />
        </Link>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <span className="hidden text-xs text-ink-500 md:block xl:text-on-navy-2">{viewer.countryName}</span>

          {guest ? (
            <>
              {/* Dropped below 400px, where beside the two-line lockup it
                  wrapped to "Log / in"; Profile in the bottom bar still leads
                  to sign-in. */}
              <Link
                href="/login"
                className="hidden min-h-11 items-center whitespace-nowrap px-2 text-sm font-semibold text-ink-700 transition-colors hover:text-blue-600 min-[400px]:inline-flex xl:text-on-navy-2 xl:hover:text-on-navy"
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
                className="relative inline-flex size-11 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-card-2 hover:text-blue-600 xl:text-on-navy-2 xl:hover:bg-navy-700 xl:hover:text-on-navy"
              >
                <Bell aria-hidden className="size-5" />
                {viewer.unreadNotifications > 0 ? (
                  <span aria-hidden className="absolute right-2.5 top-2.5 size-2.5 rounded-full bg-green-500 ring-2 ring-card xl:bg-green-400 xl:ring-navy-850" />
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
