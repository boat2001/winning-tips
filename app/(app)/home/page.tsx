import type { Metadata } from "next";
import Link from "next/link";
import { Target, BarChart3, Bookmark, Crown } from "lucide-react";
import athleteGroup from "@/public/assets/athletes/athlete-group.webp";
import { PageHero } from "@/components/app/page-hero";
import { FormBars } from "@/components/predictions/form-bars";
import { TipsBoard } from "@/components/predictions/tips-board";
import { ButtonLink } from "@/components/ui/button";
import { Card, Panel, SectionHead } from "@/components/ui/surface";
import { StatTile } from "@/components/ui/metrics";
import { SportIcon, sportLabel } from "@/components/ui/sport-icon";
import { getCurrentViewer, requireMember } from "@/lib/app/current-viewer";
import { getTipsData } from "@/lib/app/tips";
import { DataNotice } from "@/components/app/data-notice";
import { winRatePercent } from "@/lib/domain/performance";
import { dailyForm, resultsForRange, summarizeResults } from "@/lib/domain/result-summary";
import { applyTipFilters } from "@/lib/domain/tip-filters";
import { greetingFor } from "@/lib/domain/viewer";
import { getMemberVipPurchases } from "@/lib/vip/queries";
import { CopyBookingCodeButton } from "@/components/member/copy-booking-code-button";
import { getFreeTipsBoard } from "@/lib/predictions/board";

export const metadata: Metadata = { title: "Home", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function HomePage() {
  const user = await requireMember("/home");
  const [viewer, data, purchases, board] = await Promise.all([getCurrentViewer(), getTipsData(), user ? getMemberVipPurchases(user.id) : [], getFreeTipsBoard()]);
  const picks = applyTipFilters(data.tips, { window: "today", sport: null, query: null });
  const week = summarizeResults(resultsForRange(data.tips, "7d"), "7d");
  const accuracy = winRatePercent(week.winRate);
  const [lead, ...rest] = greetingFor(viewer.timezone).split(" ");
  // The date and today's count, rather than a slogan. It tells the member
  // something they did not already know, and it changes every day.
  const today = `${new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: viewer.timezone }).format(new Date())} · ${picks.length === 1 ? "1 prediction" : `${picks.length} predictions`} published`;
  return <div className="home-page page-stack">
    <PageHero className="home-hero" kicker={`Welcome back, ${viewer.displayName}`} title={<>{lead} <span className="text-green-400">{rest.join(" ")}</span> <span aria-hidden>👋</span></>}
      subtitle={today} artwork={athleteGroup}>
      {/* VIP leads: it is the product. Free tips sit beside it as the second
          action, and both land on real content rather than a sign-up wall. */}
      <div className="hero-actions mb-3 flex flex-wrap gap-2">
        <ButtonLink href="/tips#vip-slips" variant="success" size="sm"><Crown aria-hidden className="size-4" />Check VIP Tips</ButtonLink>
        <ButtonLink href="#free-tips" variant="ghost" size="sm">Free Tips</ButtonLink>
      </div>
      <ul className="hero-stats grid grid-cols-3 gap-2 sm:gap-3">
        <Card as="li" className="p-3"><StatTile icon={<Target aria-hidden className="size-7 text-green-500" />} value={accuracy === null ? "—" : `${accuracy}%`} label="Win Rate" footnote={<span className="stat-note">Last 7 days · {week.won + week.lost} decided</span>} /></Card>
        <Card as="li" className="p-3"><StatTile icon={<BarChart3 aria-hidden className="size-7 text-blue-500" />} value={picks.length} label="Today's Picks" footnote={<span className="stat-note">Published predictions</span>} /></Card>
        <Card as="li" className="p-3"><StatTile icon={<Bookmark aria-hidden className="size-7 text-green-500" />} value={data.tips.filter(t => t.savedByViewer).length} label="Saved Tips" footnote={<Link className="stat-note" href="/saved-tips">Your shortlist →</Link>} /></Card>
      </ul>
    </PageHero>
    <DataNotice unavailable={data.unavailable} />
    <div className="home-grid">
      <section id="free-tips" className="section-stack min-w-0 scroll-mt-24"><SectionHead title="Free Tips & Predictions" action={{ label: "All Tips", href: "/tips" }} />
        <TipsBoard days={board.days} bookingsByDate={board.bookingsByDate} unavailable={board.unavailable} timezone={viewer.timezone} />
        {/* The free card ends on the paid one: a member who has read today's
            free tips is the likeliest person to want the VIP slips. */}
        <ButtonLink href="/tips#vip-slips" variant="success" className="w-full"><Crown aria-hidden className="size-4" />View VIP Tips</ButtonLink>
      </section>
      <section className="home-sports section-stack min-w-0"><SectionHead title="Explore Sports" action={{ label: "View All", href: "/tips" }} />
        <ul className="home-sports-list">{(["football", "basketball", "tennis"] as const).map(sport => <li key={sport}><Link href={`/tips?sport=${sport}`} className="sport-tile"><SportIcon sport={sport} size="sm" /><span><strong>{sportLabel(sport)}</strong><small>{sport === "football" ? "Top Leagues" : sport === "basketball" ? "NBA & More" : "ATP & WTA"}</small></span></Link></li>)}</ul>
      </section>
    </div>
    <Panel as="section" className="p-4 sm:p-5"><SectionHead title="Recent Performance" icon={<BarChart3 aria-hidden className="size-5 text-blue-400" />} action={{ label: "Full Results", href: "/results" }} />
      <div className="mt-4 grid gap-4 md:grid-cols-[1.5fr_1fr]"><ul className="grid grid-cols-4 gap-2 rounded-control border border-navy-600 p-3">
        <li><StatTile tone="on-navy" value={week.settled} label="Graded" /></li><li><StatTile tone="won" surface="navy" value={week.won} label="Won" /></li><li><StatTile tone="lost" surface="navy" value={week.lost} label="Lost" /></li><li><StatTile tone="on-navy" value={accuracy === null ? "—" : `${accuracy}%`} label="Win Rate" /></li>
      </ul><FormBars bars={dailyForm(data.tips)} /></div>
      <p className="mt-3 text-xs text-on-navy-muted">Win rate = wins ÷ wins and losses. Voids and pushes are excluded. No prediction is guaranteed.</p>
    </Panel>
    {purchases.length ? <Panel as="section" id="my-vip-games" className="scroll-mt-24 p-4 sm:p-5"><SectionHead title="Your VIP slips" action={{ label: "Browse VIP", href: "/tips#vip-slips" }} />
      <div className="mt-4 space-y-3">{purchases.map(p => <details key={p.id} className="rounded-card border border-navy-600 p-4"><summary className="cursor-pointer font-semibold">{p.booking?.title ?? p.planName} <span className="ml-2 text-xs text-green-400">Purchased · yours to keep</span></summary><div className="mt-4 space-y-3">{p.booking && <div className="flex flex-wrap items-center gap-3"><span>{p.booking.platform}: {p.booking.code}</span><CopyBookingCodeButton code={p.booking.code} /></div>}{p.games.map(game => <div key={game.id} className="border-t border-navy-600 pt-3"><p className="font-semibold">{game.homeTeam} vs {game.awayTeam}</p><p className="text-sm text-on-navy-2">{game.market} · {game.selection} · {game.result}</p></div>)}</div></details>)}</div>
    </Panel> : null}
  </div>;
}
