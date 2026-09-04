import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { SiteNav, type NavItem } from "@/components/layout/site-nav";
import { logoutAction } from "@/app/(public)/logout-action";
import { adminRoles } from "@/lib/auth/constants";
import { getCurrentUser } from "@/lib/auth/session";
import { communityLinks, siteConfig } from "@/lib/config/site";

const publicNavigation: readonly NavItem[] = [
  { label: "Today", href: "/" },
  { label: "Predictions", href: "/predictions" },
  { label: "VIP", href: "/vip" },
  { label: "About", href: "/about" },
];

const memberNavigation: readonly NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Predictions", href: "/predictions" },
  { label: "VIP", href: "/vip" },
  { label: "Activity", href: "/activity" },
];

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Africa/Accra",
});

export async function SiteHeader() {
  const user = await getCurrentUser();
  const isAdmin = Boolean(user && adminRoles.includes(user.role as (typeof adminRoles)[number]));
  const navigation = user ? memberNavigation : publicNavigation;

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-surface">
      {/* Dateline strip. A masthead needs a date on it; it also carries the
          community links off the main row so the nav stays uncluttered. It sits
          on the paper tint so it separates from the white nav row below without
          resorting to a dark band. */}
      <div className="hidden h-9 items-center border-b border-line bg-paper md:flex">
        <div className="mx-auto flex w-full max-w-[76rem] items-center justify-between px-5">
          <p className="eyebrow">
            {dateFormatter.format(new Date())} · Accra · {siteConfig.tagline}
          </p>
          <div className="flex items-center gap-5">
            <a href={communityLinks.telegram} target="_blank" rel="noreferrer" className="eyebrow transition-colors hover:text-ink">
              Telegram
            </a>
            <a href={communityLinks.whatsapp} target="_blank" rel="noreferrer" className="eyebrow transition-colors hover:text-ink">
              WhatsApp
            </a>
            <span className="eyebrow eyebrow-blue">18+</span>
          </div>
        </div>
      </div>

      <div className="border-b border-line-2">
        <div className="mx-auto flex h-16 max-w-[76rem] items-stretch justify-between gap-4 px-4 sm:px-5">
          <Link
            href={user ? "/dashboard" : "/"}
            aria-label={`${siteConfig.name} home`}
            className="flex min-w-0 items-center"
          >
            <Wordmark size="md" priority />
          </Link>

          <SiteNav items={navigation} />

          <div className="hidden items-center gap-4 md:flex">
            {user ? (
              <>
                {isAdmin ? (
                  <Link href="/admin" className="eyebrow eyebrow-blue transition-colors hover:text-ink">
                    Admin
                  </Link>
                ) : null}
                <Link href="/account" className="eyebrow transition-colors hover:text-ink">
                  Settings
                </Link>
                <form action={logoutAction}>
                  <button className="btn btn-ghost h-10 min-h-10">Log out</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="eyebrow transition-colors hover:text-ink">
                  Log in
                </Link>
                <Link href="/register" className="btn btn-primary h-10 min-h-10">
                  Join free
                </Link>
              </>
            )}
          </div>

          {/* Signed out, the control is the words rather than a glyph — no icon
              for "log in" is read reliably enough to be worth the ambiguity.
              Signed in it becomes the account mark, drawn on the same 24px grid
              and 1.6 stroke as the menu rules beside it. */}
          <div className="flex shrink-0 items-center gap-1 md:hidden">
            {user ? (
              <Link
                href="/account"
                aria-label="Open user account"
                className="grid size-10 place-items-center text-blue transition-colors hover:text-blue-deep"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[1.35rem] fill-none stroke-current stroke-[1.6]" strokeLinecap="square" strokeLinejoin="miter">
                  <path d="M8 4h8v6a4 4 0 0 1-8 0V4Z" />
                  <path d="M4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2" />
                </svg>
              </Link>
            ) : (
              <Link href="/login" className="eyebrow flex h-10 items-center px-2 text-ink-2 transition-colors hover:text-blue">
                Log in
              </Link>
            )}
            <MobileNavigation items={navigation} authenticated={Boolean(user)} admin={isAdmin} />
          </div>
        </div>
      </div>
    </header>
  );
}
