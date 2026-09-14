import type { ReactNode } from "react";
import { Sidebar } from "@/components/app/sidebar";
import { BottomNav } from "@/components/app/bottom-nav";
import { Topbar } from "@/components/app/topbar";
import { FixtureNotice } from "@/components/app/fixture-notice";
import type { Viewer } from "@/lib/domain/viewer";

/**
 * The one frame every page renders in, guest or member: sidebar from 1200px
 * up, bottom bar below it, top utilities throughout. Guests and members used
 * to get different chrome (a marketing header with its own menu), which made
 * the same destination look like two different apps.
 *
 * `.app-shell` is what switches the page to the stadium token set — see the
 * header of app/globals.css.
 *
 * `bleed` drops the content column's width cap and side padding, for pages
 * whose sections run edge to edge and pad themselves (the landing hero, the
 * legacy `Shell` bands). Without it those pages sit inside a second gutter.
 *
 * The bottom padding on <main> is not decoration: the bottom bar is fixed, so
 * without it the last card on every screen sits underneath the navigation.
 */
export function AppShell({ viewer, bleed = false, children }: { viewer: Viewer; bleed?: boolean; children: ReactNode }) {
  const guest = viewer.id === "guest";

  return (
    <div className="app-shell min-h-dvh xl:pl-60">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Sidebar guest={guest} />

      <div className="flex min-h-dvh flex-col">
        <Topbar viewer={viewer} />

        <main
          id="main-content"
          className={
            bleed
              ? "w-full min-w-0 flex-1 pb-20 xl:pb-0"
              : "app-main mx-auto w-full max-w-[84rem] flex-1 px-4 pb-28 pt-4 sm:px-5 sm:pt-5 xl:pb-10"
          }
        >
          <FixtureNotice />
          {children}
        </main>
      </div>

      <BottomNav guest={guest} />
    </div>
  );
}
