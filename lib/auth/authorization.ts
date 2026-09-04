import "server-only";
import { redirect } from "next/navigation";
import { adminRoles } from "@/lib/auth/constants";
import { getCurrentUser } from "@/lib/auth/session";

export async function requireUser(destination = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(destination)}`);
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!adminRoles.includes(user.role as (typeof adminRoles)[number])) redirect("/account?error=forbidden");
  return user;
}

export async function requireManagementAdmin() {
  const user = await requireAdmin();
  if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") redirect("/admin?error=forbidden");
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireAdmin();
  if (user.role !== "SUPER_ADMIN") redirect("/admin?error=forbidden");
  return user;
}

export function hasPremiumAccess(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) return false;
  return adminRoles.includes(user.role as (typeof adminRoles)[number]);
}

export async function getPremiumAccessContext(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) return { allPremium: false, deckIds: [] as string[] };
  if (adminRoles.includes(user.role as (typeof adminRoles)[number])) return { allPremium: true, deckIds: [] as string[] };
  return { allPremium: false, deckIds: [] as string[] };
}
