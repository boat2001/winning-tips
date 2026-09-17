import Link from "next/link";
import type { Metadata } from "next";
import { PageMasthead, Shell } from "@/components/ui/layout";

export const metadata: Metadata = {
  title: "Help Centre",
  description: "Get help with Winning Tips predictions, accounts, booking codes and VIP slips.",
  alternates: { canonical: "/help" },
};

const topics = [
  ["Predictions", "Browse the free card for yesterday, today and tomorrow, and search by team or competition.", "/tips"],
  ["VIP slips", "See what is inside a slip before you buy, and how purchased slips stay unlocked for good.", "/vip"],
  ["Your account", "Update your display name and phone number, and review your payment history.", "/account"],
  ["Activity", "A full ledger of sign-ins, profile changes, payments and VIP access on your account.", "/activity"],
  ["Contact us", "Reach the desk on Telegram, WhatsApp, phone or email.", "/contact"],
  ["Responsible gaming", "Limits, warning signs, and where to get support.", "/responsible-betting"],
] as const;

export default function HelpPage() {
  return (
    <>
      <PageMasthead
        kicker="Support"
        title="Help centre"
        lede="The short answers first. If none of these cover it, the contact page lists every way to reach us."
      />
      <Shell className="pb-16">
        <div className="grid border-t-2 border-ink sm:grid-cols-2">
          {topics.map(([title, copy, href]) => (
            <Link
              key={href}
              href={href}
              className="group border-b border-line py-6 transition-colors hover:bg-surface sm:px-6 sm:odd:pl-0 sm:even:border-l sm:even:border-l-line-2"
            >
              <h2 className="display-heading text-xl font-semibold transition-colors group-hover:text-blue">{title}</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-ink-2">{copy}</p>
              <span className="eyebrow eyebrow-blue mt-4 block">Open →</span>
            </Link>
          ))}
        </div>
      </Shell>
    </>
  );
}
