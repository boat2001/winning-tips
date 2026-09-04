import type { Metadata } from "next";
import Link from "next/link";
import { ActivityList } from "@/components/member/activity-list";
import { PageMasthead, Shell } from "@/components/ui/layout";
import { requireUser } from "@/lib/auth/authorization";
import { getMemberActivity } from "@/lib/member/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Activity",
  description: "Review your Smart Tips account, payment and VIP activity.",
  robots: { index: false, follow: false },
};

export default async function ActivityPage() {
  const user = await requireUser("/activity");
  const activities = await getMemberActivity(user.id, 50);

  return (
    <>
      <PageMasthead
        kicker="Ledger"
        title="Account activity"
        lede="Sign-ins, profile changes, payments and VIP access, newest first."
      >
        <div className="flex flex-wrap gap-5 border-y border-line-2 py-4">
          <Link href="/dashboard" className="eyebrow eyebrow-blue transition-colors hover:text-ink">
            Dashboard →
          </Link>
          <Link href="/account" className="eyebrow eyebrow-blue transition-colors hover:text-ink">
            Settings →
          </Link>
        </div>
      </PageMasthead>

      <Shell className="pb-16">
        <div className="max-w-3xl">
          <ActivityList activities={activities} />
        </div>
      </Shell>
    </>
  );
}
