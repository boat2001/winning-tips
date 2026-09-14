import Link from "next/link";
import type { Metadata } from "next";
import { ProfileForm } from "@/components/auth/profile-form";
import { PageMasthead, Shell } from "@/components/ui/layout";
import { adminRoles } from "@/lib/auth/constants";
import { requireUser } from "@/lib/auth/authorization";
import { getDatabase } from "@/lib/db/client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Winning Tips account details and review your payment history.",
  robots: { index: false, follow: false },
};

const paymentDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Accra",
});

function statusClass(status: string) {
  if (status === "SUCCESS") return "result result-won";
  if (status === "PENDING") return "result result-pending";
  if (status === "FAILED" || status === "CANCELLED") return "result result-lost";
  return "result result-void";
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  const [purchasedVipCount, payments] = await Promise.all([
    getDatabase().payment.count({ where: { userId: user.id, status: "SUCCESS", bookingId: { not: null } } }),
    getDatabase().payment.findMany({
      where: { userId: user.id },
      include: { plan: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  const { error } = await searchParams;
  const isAdmin = adminRoles.includes(user.role as (typeof adminRoles)[number]);

  return (
    <>
      <PageMasthead kicker={`@${user.username}`} title={user.displayName || user.username} lede={`Signed in as ${user.email}`}>
        <div className="flex flex-wrap gap-5 border-y border-line-2 py-4">
          <Link href="/home" className="eyebrow eyebrow-blue transition-colors hover:text-ink">
            Dashboard →
          </Link>
          <Link href="/activity" className="eyebrow eyebrow-blue transition-colors hover:text-ink">
            Activity →
          </Link>
          {isAdmin ? (
            <Link href="/admin" className="eyebrow eyebrow-blue transition-colors hover:text-ink">
              Admin panel →
            </Link>
          ) : null}
        </div>
      </PageMasthead>

      <Shell className="pb-16">
        {error === "forbidden" ? (
          <p className="mb-8 rounded-sharp border-l-[3px] border-hold bg-hold-bg px-4 py-3 text-sm font-medium text-hold">
            Your account does not have admin access.
          </p>
        ) : null}

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <section>
            <h2 className="display-heading border-b-2 border-ink pb-3 text-2xl font-semibold">Profile</h2>
            <ProfileForm displayName={user.displayName} phone={user.phone} />

            <h2 className="display-heading mt-14 border-b-2 border-ink pb-3 text-2xl font-semibold">Payments</h2>
            <div className="mt-2">
              {payments.length ? (
                payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between gap-4 border-b border-line py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{(payment.plan?.name ?? "VIP card")}</p>
                      <p className="eyebrow mt-1.5 truncate">
                        <span className="num">{paymentDateFormatter.format(payment.createdAt)}</span> · {payment.reference}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <span className="num text-sm font-semibold">
                        {payment.currency} {(payment.amountMinor / 100).toFixed(2)}
                      </span>
                      <span className={statusClass(payment.status)}>{payment.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="border-b border-line py-10 text-center text-sm text-muted">No payments yet.</p>
              )}
            </div>
          </section>

          <aside>
            <h2 className="eyebrow border-b border-line-2 pb-3">At a glance</h2>
            <dl className="mt-2">
              <div className="flex items-baseline justify-between gap-4 border-b border-line py-3.5">
                <dt className="text-sm text-muted">VIP slips bought</dt>
                <dd className="num text-sm font-semibold">{purchasedVipCount}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-line py-3.5">
                <dt className="text-sm text-muted">Role</dt>
                <dd className="text-sm font-semibold">{user.role.replaceAll("_", " ").toLowerCase()}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-line py-3.5">
                <dt className="text-sm text-muted">Username</dt>
                <dd className="num text-sm font-semibold">@{user.username}</dd>
              </div>
            </dl>
            <Link href="/home#my-vip-games" className="btn btn-ghost mt-6 w-full">
              View your games
            </Link>
          </aside>
        </div>
      </Shell>
    </>
  );
}
