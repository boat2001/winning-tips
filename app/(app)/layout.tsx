import { AppShell } from "@/components/app/app-shell";
import { getCurrentViewer } from "@/lib/app/current-viewer";

/**
 * The member app: /home, /tips, /results, /community, /profile.
 *
 * Separate from the (public) route group because the two use different design
 * systems while the VIP-slip product is migrated — this group renders inside
 * `.app-shell`, which switches the page to the stadium tokens.
 */
export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const viewer = await getCurrentViewer();

  return <AppShell viewer={viewer}>{children}</AppShell>;
}
