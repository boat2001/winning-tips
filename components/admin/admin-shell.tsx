"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/(public)/logout-action";
import { Wordmark } from "@/components/brand/wordmark";

const navigation = [
  ["Dashboard", "/admin", "dashboard"],
  ["Games Management", "/admin/games", "games"],
  ["VIP Games Control", "/admin/games-control", "controls"],
  ["Users", "/admin/users", "users"],
  ["Notifications", "/admin/notifications", "notifications"],
  ["SMS", "/admin/sms", "messages"],
  ["Settings", "/admin/settings", "settings"],
] as const;

type NavIconName = (typeof navigation)[number][2] | "logout";

function NavIcon({ name }: { name: NavIconName }) {
  const paths: Record<NavIconName, React.ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    games: <><path d="M8.5 7h7a5.5 5.5 0 0 1 5.32 6.9l-1.08 4.12a2.6 2.6 0 0 1-4.37 1.16L13.9 17.7a2.7 2.7 0 0 0-3.8 0l-1.47 1.48a2.6 2.6 0 0 1-4.37-1.16L3.18 13.9A5.5 5.5 0 0 1 8.5 7Z" /><path d="M8 11v4M6 13h4M16 12h.01M18 14h.01" /></>,
    controls: <><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="13" cy="18" r="2" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    notifications: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    messages: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.94 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.57 15 1.7 1.7 0 0 0 3 14H3v-4h.08A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.57 1.7 1.7 0 0 0 10 3V3h4v.08A1.7 1.7 0 0 0 15.06 4.6a1.7 1.7 0 0 0 1.88-.34L17 4.2 19.83 7l-.06.06A1.7 1.7 0 0 0 19.43 9 1.7 1.7 0 0 0 21 10h.08v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[1.05rem] fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export function AdminShell({ children, role }: { children: React.ReactNode; displayName: string; role: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const visibleNavigation = navigation.filter(([, href]) => {
    if (href === "/admin/users" || href === "/admin/settings") return role === "SUPER_ADMIN";
    if (href === "/admin/games-control") return role === "SUPER_ADMIN" || role === "ADMIN";
    return true;
  });

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  const sidebar = (
    <>
      <div className="flex h-16 items-center border-b border-line px-4">
        <Wordmark size="sm" />
      </div>
      <p className="eyebrow border-b border-line px-4 py-3">Control panel</p>
      <nav className="flex-1 overflow-y-auto py-2" aria-label="Admin navigation">
        {visibleNavigation.map(([label, href, icon]) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${active ? "bg-blue-wash text-blue" : "text-ink-2 hover:bg-paper hover:text-ink"}`}
            >
              <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-[3px] ${active ? "bg-blue" : "bg-transparent"}`} />
              <NavIcon name={icon} />
              {label}
            </Link>
          );
        })}
        <form action={logoutAction}>
          <button className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-ink-2 transition-colors hover:bg-paper hover:text-lost">
            <NavIcon name="logout" />
            Log out
          </button>
        </form>
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-paper md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line-2 bg-paper-2 md:flex">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button aria-label="Close admin menu" className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col border-r border-line-2 bg-paper-2">{sidebar}</aside>
        </div>
      )}

      <div className="admin-content min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-line-2 bg-surface px-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open admin menu"
              className="grid size-10 shrink-0 place-items-center border border-line-2 text-ink md:hidden"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <Link href="/admin" className="flex min-w-0 items-center gap-2 md:hidden">
              <Wordmark size="sm" />
            </Link>
            <p className="eyebrow hidden md:block">Control panel · {role.replaceAll("_", " ").toLowerCase()}</p>
          </div>

          <Link href="/" className="btn btn-ghost h-10 min-h-10 shrink-0 gap-2 px-3">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2">
              <path d="M14 5h5v5M19 5l-8 8" />
              <path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
            </svg>
            <span className="hidden sm:inline">View site</span>
          </Link>
        </header>
        {children}
      </div>
    </div>
  );
}
