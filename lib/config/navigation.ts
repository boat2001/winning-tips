import type { LucideIcon } from "lucide-react";
import { BarChart3, Home, User, Users, Zap } from "lucide-react";

/**
 * The five destinations of the member app, in the order the mocks show them.
 *
 * One list feeds three different navigations — the desktop sidebar, the
 * tablet/mobile bottom bar, and the mobile drawer — so the order and labels can
 * never drift between viewports. Adding a sixth item means checking the bottom
 * bar first: five is the practical ceiling for a 320px-wide tab row.
 */
export interface AppNavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: LucideIcon;
}

export const appNavigation: readonly AppNavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Tips", href: "/tips", icon: Zap },
  { label: "Results", href: "/results", icon: BarChart3 },
  { label: "Community", href: "/community", icon: Users },
  { label: "Profile", href: "/profile", icon: User },
] as const;

/**
 * Whether a nav item should read as current.
 *
 * Exact match on the top-level route, plus a prefix match for its children, so
 * /tips/man-city-vs-arsenal still lights up "Tips". The prefix test requires a
 * following slash: without it, a future /tips-archive route would wrongly mark
 * /tips as current.
 */
export function isCurrentRoute(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
