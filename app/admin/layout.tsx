import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/authorization";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAdmin();
  return <AdminShell displayName={user.displayName || user.username} role={user.role}>{children}</AdminShell>;
}
