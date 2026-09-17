import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button-link";
import { PageMasthead, SectionHead, Shell } from "@/components/ui/layout";

export const metadata: Metadata = {
  title: "About Us",
  description: "Why Winning Tips publishes its reasoning, its losses and its full settled record.",
  alternates: { canonical: "/about" },
};

const principles = [
  ["Show the working", "A selection with no reasoning is a guess with a logo on it. Every free pick names the market, the selection, the odds and why we like it."],
  ["Keep the losses up", "Settled predictions stay published whatever the result. The win rate on the homepage counts every settled pick, because deleting the bad ones would make the number meaningless."],
  ["Charge for the slip, not the month", "VIP slips are bought one at a time. There is no subscription, no auto-renewal and nothing to cancel."],
] as const;

export default function AboutPage() {
  return (
    <>
      <PageMasthead
        kicker="About"
        title="A tips site that shows its working"
        lede="Winning Tips exists because most tipping services publish a selection, hide the reasoning, and quietly delete whatever loses. We wanted the opposite of that."
      />

      <Shell className="pb-16">
        <SectionHead kicker="How we work" title="Three rules we hold to" />
        <div className="mt-8 grid divide-y divide-line-2 md:grid-cols-3 md:divide-x md:divide-y-0">
          {principles.map(([title, copy], index) => (
            <article key={title} className="py-6 md:px-6 md:py-0 md:first:pl-0 md:last:pr-0">
              <div className="flex items-baseline gap-3">
                <span className="num shrink-0 text-lg font-semibold text-blue">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="display-heading min-w-0 text-xl font-semibold">{title}</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink-2">{copy}</p>
            </article>
          ))}
        </div>

        <div className="mt-14 border-t-2 border-ink pt-8">
          <h2 className="display-heading max-w-2xl text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-[0.98]">
            The free card goes up every day. Start there.
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/tips">Today&apos;s predictions</ButtonLink>
            <ButtonLink href="/vip" variant="ghost">
              VIP slips
            </ButtonLink>
          </div>
        </div>
      </Shell>
    </>
  );
}
