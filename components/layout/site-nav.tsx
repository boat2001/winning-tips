"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { label: string; href: string };

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Desktop navigation. The active route is marked with a blue rule sitting on the
 * header's bottom hairline rather than a pill, which keeps the header a single
 * unbroken band.
 */
export function SiteNav({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="hidden h-full items-stretch md:flex" aria-label="Main navigation">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex items-center px-4 text-[0.8125rem] font-semibold uppercase tracking-[0.08em] transition-colors ${active ? "text-ink" : "text-muted hover:text-ink"}`}
          >
            {item.label}
            <span
              aria-hidden="true"
              className={`absolute inset-x-3 bottom-0 h-[3px] transition-colors ${active ? "bg-blue" : "bg-transparent"}`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
