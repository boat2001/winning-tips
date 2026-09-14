"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { SidebarPromo } from "@/components/app/sidebar-promo";
import { homeHrefFor, isCurrentRoute, navigationFor } from "@/lib/config/navigation";

/**
 * The desktop left rail (guide §12: sidebar from 1200px up).
 *
 * Hidden below `xl` because that is where the bottom bar takes over — the two
 * navigations are never on screen together, and each is the only one rendered
 * for its viewport family rather than one being visually hidden.
 */
export function Sidebar({ guest }: { guest: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-navy-600/50 bg-navy-950 xl:flex">
      <div className="px-4 pb-6 pt-6">
        <Link href={homeHrefFor(guest)} className="inline-flex rounded-control focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-400">
          <Logo size="md" showTagline priority />
        </Link>
      </div>

      <nav aria-label="Main" className="flex-1 px-3">
        <ul className="flex flex-col gap-1.5">
          {navigationFor(guest).map((item) => {
            const Icon = item.icon;
            const current = isCurrentRoute(pathname, item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={`relative flex items-center gap-3.5 rounded-control px-4 py-3 text-[0.9375rem] transition-colors ${
                    current
                      ? "bg-navy-800 font-semibold text-on-navy"
                      : "font-medium text-on-navy-2 hover:bg-navy-900/70 hover:text-on-navy"
                  }`}
                >
                  {/* The current item carries a green edge as well as a fill and a
                      weight change, so it never depends on colour alone (§16). */}
                  {current ? (
                    <span aria-hidden className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-green-400" />
                  ) : null}
                  <Icon
                    aria-hidden
                    strokeWidth={current ? 2.4 : 2}
                    className={`size-5 shrink-0 ${current ? "text-green-400" : "text-on-navy-muted"}`}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3">
        <SidebarPromo />
      </div>
    </aside>
  );
}
