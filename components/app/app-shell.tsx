import type { ReactNode } from "react";
import { Sidebar } from "@/components/app/sidebar";
import { BottomNav } from "@/components/app/bottom-nav";
import { Topbar } from "@/components/app/topbar";
import { FixtureNotice } from "@/components/app/fixture-notice";
import type { Viewer } from "@/lib/domain/viewer";

/**
 * The member-app frame: sidebar from 1200px up, bottom bar below it, top
 * utilities throughout.
 *
 * `.app-shell` is what switches the page to the stadium token set — see the
 * header of app/globals.css. Routes outside this shell keep the legacy
 * newsprint system while the VIP-slip product is migrated.
 *
 * The bottom padding on <main> is not decoration: the bottom bar is fixed, so
 * without it the last card on every screen sits underneath the navigation.
 */
export function AppShell({ viewer, children }: { viewer: Viewer; children: ReactNode }) {
  return (
    <div className="app-shell min-h-dvh xl:pl-60">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Sidebar />

      <div className="flex min-h-dvh flex-col">
        <Topbar viewer={viewer} />

        <main id="main-content" className="mx-auto w-full max-w-[84rem] flex-1 px-4 pb-28 pt-4 sm:px-5 sm:pt-5 xl:pb-10">
          <FixtureNotice />
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
