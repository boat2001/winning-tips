import type { Metadata } from "next";
import { PageMasthead, Shell } from "@/components/ui/layout";
import { communityLinks } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact the Winning Tips desk about your account, a prediction or a VIP slip.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const phone = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim();
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  const channels = [
    { title: "Telegram", detail: "Free channel, daily card and announcements", value: "Open channel", href: communityLinks.telegram },
    { title: "WhatsApp", detail: "The same daily card, straight to your phone", value: "Open channel", href: communityLinks.whatsapp },
    { title: "Phone", detail: "Office hours, Accra time", value: phone || "Number coming soon", href: phone ? `tel:${phone.replace(/\s+/g, "")}` : undefined },
    { title: "Email", detail: "For anything that needs a paper trail", value: email || "Address coming soon", href: email ? `mailto:${email}` : undefined },
  ];

  return (
    <>
      <PageMasthead
        kicker="Get in touch"
        title="Contact the desk"
        lede="Account problems, payment questions or a query about a specific pick — pick whichever channel suits you."
      />

      <Shell className="pb-16">
        <div className="border-t-2 border-ink">
          {channels.map((channel) => {
            const body = (
              <>
                <span className="min-w-0 sm:w-40 sm:shrink-0">
                  <span className="display-heading block text-lg font-semibold">{channel.title}</span>
                </span>
                <span className="min-w-0 flex-1 text-sm leading-6 text-ink-2">{channel.detail}</span>
                <span className={`text-sm font-semibold ${channel.href ? "text-blue" : "text-faint"}`}>{channel.value}</span>
              </>
            );

            const rowClass = "flex flex-col gap-1.5 border-b border-line py-5 sm:flex-row sm:items-baseline sm:gap-6";

            return channel.href ? (
              <a
                key={channel.title}
                href={channel.href}
                target={channel.href.startsWith("http") ? "_blank" : undefined}
                rel={channel.href.startsWith("http") ? "noreferrer" : undefined}
                className={`${rowClass} transition-colors hover:bg-surface`}
              >
                {body}
              </a>
            ) : (
              <div key={channel.title} className={`${rowClass} opacity-60`}>
                {body}
              </div>
            );
          })}
        </div>

        <p className="mt-8 max-w-2xl text-sm leading-6 text-muted">
          We never ask for your password, and we will never message you first asking for a payment. If someone does,
          it is not us.
        </p>
      </Shell>
    </>
  );
}
