import Link from "next/link";
import { ChannelLinks } from "@/components/brand/channel-links";
import { Wordmark } from "@/components/brand/wordmark";
import { siteConfig } from "@/lib/config/site";

const groups = [
  {
    title: "Tips",
    links: [
      ["Home", "/"],
      ["All predictions", "/predictions"],
      ["VIP slips", "/vip"],
      ["Your dashboard", "/dashboard"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", "/about"],
      ["Help centre", "/help"],
      ["Contact", "/contact"],
      ["Settings", "/account"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Terms of service", "/terms"],
      ["Privacy policy", "/privacy"],
      ["Responsible gaming", "/responsible-betting"],
    ],
  },
] as const;

/**
 * The footer closes the page on the deepest of the three paper tints — still
 * light, but a shade below the body so the document has an obvious bottom edge.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-line-2 bg-paper-2 text-ink">
      <div className="mx-auto max-w-[76rem] px-5 py-12 sm:py-16">
        <div className="rule-double" />
        <div className="grid gap-10 pt-10 md:grid-cols-[1.4fr_repeat(3,minmax(0,0.75fr))]">
          <div>
            <Link href="/" aria-label={`${siteConfig.name} home`} className="inline-flex">
              <Wordmark size="md" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-ink-2">
              Every published pick shows the market, the selection, the odds and the reasoning. Wins
              and losses both stay on the record.
            </p>
            <ChannelLinks className="mt-6" compact />
          </div>

          {groups.map((group) => (
            <div key={group.title}>
              <h2 className="eyebrow eyebrow-blue">{group.title}</h2>
              <nav className="mt-4 grid gap-2.5">
                {group.links.map(([label, href]) => (
                  <Link key={href} href={href} className="text-sm text-ink-2 transition-colors hover:text-blue">
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-line-2">
        <div className="mx-auto flex max-w-[76rem] flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="eyebrow">
            © {new Date().getFullYear()} {siteConfig.name}
          </p>
          {/* The run-on line wrapped mid-phrase on phones, so the last clause
              breaks onto its own line there. The middle separator only appears
              once there is width to set the whole thing as one row. */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-x-2">
            <p className="eyebrow">18+ only · Bet responsibly</p>
            <span aria-hidden="true" className="eyebrow hidden sm:inline">·</span>
            <p className="eyebrow">Never chase a loss</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
