"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/app/(public)/logout-action";
import { ChannelLinks } from "@/components/brand/channel-links";
import type { NavItem } from "@/components/layout/site-nav";

/**
 * Full-height sheet rather than a dropdown card. On a phone the menu is the
 * whole screen, so it gets the display face at poster size and each row is
 * numbered like a fixture list. White ground, ink type — the same paper the
 * rest of the site is printed on.
 */
export function MobileNavigation({
  items,
  authenticated,
  admin,
}: {
  items: readonly NavItem[];
  authenticated: boolean;
  admin: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function closeFromKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeFromKeyboard);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeFromKeyboard);
    };
  }, [isOpen]);

  const secondary = authenticated
    ? [
        { label: "Settings", href: "/account" },
        ...(admin ? [{ label: "Admin panel", href: "/admin" }] : []),
      ]
    : [
        { label: "Log in", href: "/login" },
        { label: "Create account", href: "/register" },
      ];

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        onClick={() => setIsOpen((open) => !open)}
        className="grid size-10 place-items-center text-ink transition-colors hover:text-blue"
      >
        {/* Three stacked rules — the same motif the page headers use — with the
            middle one short. It folds into a cross when the sheet is open. */}
        <span className="relative block h-[13px] w-[22px]" aria-hidden="true">
          <i className={`absolute left-0 top-0 block h-[2px] bg-current transition-all duration-200 ${isOpen ? "w-[22px] translate-y-[5.5px] rotate-45" : "w-[22px]"}`} />
          <i className={`absolute left-0 top-[5.5px] block h-[2px] w-[14px] bg-current transition-opacity duration-200 ${isOpen ? "opacity-0" : "opacity-100"}`} />
          <i className={`absolute left-0 top-[11px] block h-[2px] bg-current transition-all duration-200 ${isOpen ? "w-[22px] -translate-y-[5.5px] -rotate-45" : "w-[22px]"}`} />
        </span>
      </button>

      {isOpen ? (
        <div
          id="mobile-navigation"
          className="fixed inset-x-0 bottom-0 top-16 z-[60] flex flex-col overflow-y-auto bg-surface text-ink"
        >
          <nav aria-label="Mobile navigation" className="border-t-2 border-ink">
            {items.map((item, index) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-baseline gap-4 border-b border-line px-5 py-4 transition-colors ${active ? "bg-blue-wash" : "hover:bg-paper"}`}
                >
                  <span className="eyebrow num w-6 shrink-0">{String(index + 1).padStart(2, "0")}</span>
                  <span className={`display-heading text-3xl font-semibold ${active ? "text-blue" : "text-ink"}`}>
                    {item.label}
                  </span>
                  {active ? <span aria-hidden="true" className="ml-auto h-2 w-2 self-center bg-blue" /> : null}
                </Link>
              );
            })}
          </nav>

          {/* One row. Signed in this can hold three items on a narrow phone, so it
              wraps rather than overflowing. */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-line px-5 py-4">
            {secondary.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="py-2 text-sm font-semibold uppercase tracking-[0.08em] text-ink-2 transition-colors hover:text-blue"
              >
                {item.label}
              </Link>
            ))}
            {authenticated ? (
              <form action={logoutAction}>
                <button className="py-2 text-sm font-semibold uppercase tracking-[0.08em] text-ink-2 transition-colors hover:text-blue">
                  Log out
                </button>
              </form>
            ) : null}
          </div>

          <div className="mt-auto bg-paper px-5 py-6">
            <p className="eyebrow eyebrow-blue">Free community</p>
            <ChannelLinks className="mt-3 flex-nowrap" full />
            <div className="mt-5 flex flex-col gap-1">
              <p className="eyebrow">18+ only</p>
              <p className="eyebrow">Predictions are opinions, not guarantees</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
