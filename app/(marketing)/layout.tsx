import { AppShell } from "@/components/app/app-shell";
import { getCurrentViewer } from "@/lib/app/current-viewer";

/**
 * The guest landing page.
 *
 * It renders in the same shell as every other page, so a guest gets the same
 * bottom bar and header as a member. `bleed` because the hero and the bands
 * below it run edge to edge and carry their own gutters.
 */
export default async function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const viewer = await getCurrentViewer();

  return (
    <AppShell viewer={viewer} bleed>
      {children}
    </AppShell>
  );
}
