import { AppShell } from "@/components/app/app-shell";
import { MarketingHeader } from "@/components/app/marketing-header";
import { getCurrentViewer } from "@/lib/app/current-viewer";
import { SiteLinksFooter } from "@/components/app/site-links-footer";

export default async function PublicLayout({children}:Readonly<{children:React.ReactNode}>) {
  const viewer = await getCurrentViewer();
  if (viewer.id !== "guest") return <AppShell viewer={viewer}><div className="legacy-content">{children}</div><SiteLinksFooter /></AppShell>;
  return <div className="app-shell"><MarketingHeader /><main id="main-content" className="legacy-content min-h-[70vh]">{children}</main><SiteLinksFooter /></div>;
}
