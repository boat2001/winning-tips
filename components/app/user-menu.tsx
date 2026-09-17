"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Crown, LogOut, Settings, ShieldCheck, User as UserIcon } from "lucide-react";
import { logoutAction } from "@/app/(public)/logout-action";
import { Avatar } from "@/components/ui/avatar";
import { type Viewer, planLabel } from "@/lib/domain/viewer";
import { cn } from "@/lib/utils/cn";

const MENU_ITEMS = [
  { label: "Your profile", href: "/profile", icon: UserIcon },
  { label: "Settings", href: "/profile#settings", icon: Settings },
] as const;

/**
 * The account chip in the top bar, with its menu.
 *
 * Built by hand rather than with <details>, which cannot be dismissed with
 * Escape and leaves the trigger without an `aria-expanded` state. The three
 * behaviours a menu has to get right are all here: Escape closes and returns
 * focus, a click outside closes, and the trigger describes its own state.
 */
export function UserMenu({ viewer }: { viewer: Viewer }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2.5 rounded-pill border border-card-line bg-card-2 py-1.5 pl-1.5 pr-2.5 transition-colors hover:border-blue-500 sm:pr-3 xl:border-navy-600 xl:bg-navy-800/70 xl:hover:border-blue-400"
      >
        <Avatar name={viewer.displayName} src={viewer.avatarUrl} size="sm" />
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block truncate text-[0.8125rem] font-semibold leading-tight text-ink-900 xl:text-on-navy">
            {viewer.displayName}
          </span>
          {/* gold-500 is too faint on the white bar below xl; the deeper gold reads. */}
          <span className="flex items-center gap-1 text-[0.6875rem] leading-tight text-gold xl:text-gold-500">
            {viewer.plan === "PREMIUM" ? <Crown aria-hidden className="size-3 fill-gold xl:fill-gold-500" /> : null}
            {planLabel(viewer.plan)}
          </span>
        </span>
        <ChevronDown aria-hidden className={cn("size-4 text-ink-400 transition-transform xl:text-on-navy-muted", open && "rotate-180")} />
      </button>

      {/* The menu takes the bar's tone: white under the white bar, navy at xl. */}
      {open ? (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 overflow-hidden rounded-card border border-card-line bg-card py-1.5 shadow-raised xl:border-navy-600 xl:bg-navy-850"
        >
          <p className="border-b border-card-line px-4 pb-2.5 pt-1.5 text-xs text-ink-500 xl:border-navy-600 xl:text-on-navy-muted">
            Signed in as <span className="font-semibold text-ink-900 xl:text-on-navy-2">{viewer.handle}</span>
          </p>

          {MENU_ITEMS.map((item) => (
            <Link
              key={item.href}
              role="menuitem"
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-card-2 hover:text-blue-600 xl:text-on-navy-2 xl:hover:bg-navy-800 xl:hover:text-on-navy"
            >
              <item.icon aria-hidden className="size-4" />
              {item.label}
            </Link>
          ))}

          {viewer.canAccessAdmin ? (
            <Link
              role="menuitem"
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 border-t border-card-line px-4 py-2.5 text-sm font-semibold text-green-600 transition-colors hover:bg-card-2 xl:border-navy-600 xl:text-green-400 xl:hover:bg-navy-800"
            >
              <ShieldCheck aria-hidden className="size-4" />
              Admin panel
            </Link>
          ) : null}

          {/* Sign-out is a form action, not a link: it revokes the session
              server-side and must not be triggerable by a prefetch or a
              crawler. Reuses the existing action rather than a second path. */}
          <form action={logoutAction} className="border-t border-card-line xl:border-navy-600">
            <button
              role="menuitem"
              type="submit"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-card-2 hover:text-blue-600 xl:text-on-navy-2 xl:hover:bg-navy-800 xl:hover:text-on-navy"
            >
              <LogOut aria-hidden className="size-4" />
              Log out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
