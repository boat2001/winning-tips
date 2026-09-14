"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isCurrentRoute, navigationFor } from "@/lib/config/navigation";

/**
 * Sticky bottom navigation for mobile and tablet (guide §12).
 *
 * A white bar on the navy ground, the one place in the app where a light
 * surface carries navigation rather than data. Each target is a full-height
 * column so the touch area comfortably clears the 44px minimum even though the
 * icon itself is 22px.
 */
export function BottomNav({ guest }: { guest: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-card-line bg-card shadow-raised xl:hidden"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch">
        {navigationFor(guest).map((item) => {
          const Icon = item.icon;
          const current = isCurrentRoute(pathname, item.href);

          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className="flex min-h-[3.5rem] flex-col items-center justify-center gap-1 px-1 py-2"
              >
                <Icon
                  aria-hidden
                  strokeWidth={current ? 2.5 : 2}
                  className={`size-[1.375rem] shrink-0 ${current ? "text-blue-600" : "text-ink-400"}`}
                />
                <span
                  className={`w-full truncate text-center text-[0.6875rem] leading-none ${
                    current ? "font-semibold text-blue-600" : "font-medium text-ink-500"
                  }`}
                >
                  {item.label}
                </span>
                {/* Underline repeats what the colour says, for the same
                    not-colour-alone reason as the sidebar's green edge. */}
                <span
                  aria-hidden
                  className={`h-0.5 w-6 rounded-full ${current ? "bg-blue-600" : "bg-transparent"}`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
