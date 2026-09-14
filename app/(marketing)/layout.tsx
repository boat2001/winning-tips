import { MarketingHeader } from "@/components/app/marketing-header";

/**
 * The guest-facing marketing shell.
 *
 * Its own route group because it takes neither chrome: no sidebar or bottom bar
 * (there is nothing to navigate yet) and none of the legacy newsprint header.
 * It still opts into the stadium tokens through `.app-shell`.
 */
export default function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="app-shell min-h-dvh">
      <MarketingHeader />
      <main>{children}</main>
    </div>
  );
}
