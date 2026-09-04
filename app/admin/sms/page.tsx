import Link from "next/link";
import { getDatabase } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function SmsPage() {
  const recipients = await getDatabase().user.count({ where: { isActive: true, phone: { not: null } } });
  const providerConfigured = Boolean(process.env.SMS_API_KEY && process.env.SMS_SENDER_ID);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-8 sm:px-7 sm:pb-10">
      <h1 className="text-3xl font-semibold tracking-[-0.05em] text-ink sm:text-4xl">SMS</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-sharp border border-line bg-white p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-ink">SMS Delivery</h2><p className="mt-2 text-sm text-muted">Send service updates to users who provided a phone number.</p></div><span className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold ${providerConfigured ? "bg-blue-wash text-blue" : "bg-hold-bg text-hold"}`}>{providerConfigured ? "CONFIGURED" : "SETUP REQUIRED"}</span></div><p className="mt-6 text-3xl font-semibold text-ink">{recipients.toLocaleString()}</p><p className="mt-1 text-sm text-muted">Available SMS recipients</p></section>
        <section className="rounded-sharp border border-line bg-white p-6"><h2 className="text-lg font-semibold text-ink">Provider Setup</h2><p className="mt-3 text-sm leading-6 text-muted">Configure <code className="rounded bg-line px-1.5 py-1 text-xs">SMS_API_KEY</code> and <code className="rounded bg-line px-1.5 py-1 text-xs">SMS_SENDER_ID</code> in the hosting environment before enabling message sending. This page will not pretend to send messages without a connected provider.</p><Link href="/admin/settings" className="mt-5 inline-flex rounded-sharp bg-[var(--color-blue)] px-4 py-2.5 text-xs font-semibold text-white">Open Settings</Link></section>
      </div>
    </main>
  );
}
