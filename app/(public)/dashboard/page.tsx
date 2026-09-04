import type { Metadata } from "next";
import { MemberDashboard } from "@/components/member/member-dashboard";
import { requireUser } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard", description: "View Smart Tips predictions, VIP access and account activity.", robots: { index: false, follow: false } };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  return <MemberDashboard user={user} />;
}
