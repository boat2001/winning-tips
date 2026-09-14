import { AppShell } from "@/components/app/app-shell";
import { SiteLinksFooter } from "@/components/app/site-links-footer";
import { getCurrentViewer } from "@/lib/app/current-viewer";

/**
 * Legacy newsprint pages, re-skinned by `.legacy-content`. Same shell for
 * guests and members; `bleed` because these pages wrap every band in `Shell`,
 * which already sets the measure and the side gutter.
 */
export default async function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const viewer = await getCurrentViewer();

  return (
    <AppShell viewer={viewer} bleed>
      <div className="legacy-content min-h-[70vh]">{children}</div>
      <SiteLinksFooter />
    </AppShell>
  );
}
