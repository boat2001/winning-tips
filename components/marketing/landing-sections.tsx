import Link from "next/link";
import { BookOpenCheck, ChevronRight, ListChecks, MessageCircle, Scale, Send, ShieldCheck } from "lucide-react";
import { TopPickRow } from "@/components/predictions/tip-row";
import { SportIcon, sportLabel } from "@/components/ui/sport-icon";
import { communityLinks } from "@/lib/config/site";
import { winRatePercent } from "@/lib/domain/performance";
import { summarizeResults, resultsForRange } from "@/lib/domain/result-summary";
import { applyTipFilters } from "@/lib/domain/tip-filters";
import type { PublishedTip } from "@/lib/domain/tips";

/**
 * Everything below the landing hero (guide §14.1).
 *
 * The page used to end at the hero, so a visitor who scrolled found the footer
 * and nothing that answered "what is this, and can I trust it?". Each section
 * here answers one of those questions with the product itself — today's real
 * picks, the real record — rather than with claims. No figure on this page is
 * invented: the record shows what has been graded, or says it has not started.
 */
export function LandingSections({ tips, timezone }: { tips: readonly PublishedTip[]; timezone: string }) {
  const picks = applyTipFilters(tips, { window: "today", sport: null, query: null }).slice(0, 3);
  const record = summarizeResults(resultsForRange(tips, "all"), "all");

  return (
    <div className="landing-sections">
      <TodaySection picks={picks} timezone={timezone} />
      <HowItWorks />
      <RecordSection won={record.won} lost={record.lost} settled={record.settled} winRate={winRatePercent(record.winRate)} />
      <SportsSection />
      <CommunitySection />
      <FaqSection />
      <ResponsibleNote />
    </div>
  );
}

function SectionIntro({ id, kicker, title, children }: { id: string; kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="max-w-2xl">
      <p className="landing-kicker">{kicker}</p>
      <h2 id={id} className="landing-h2">{title}</h2>
      {children ? <p className="mt-3 text-[0.9375rem] leading-relaxed text-on-navy-2">{children}</p> : null}
    </div>
  );
}

function TodaySection({ picks, timezone }: { picks: readonly PublishedTip[]; timezone: string }) {
  return (
    <section className="landing-band" aria-labelledby="today-title">
      <div className="landing-container grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:items-center">
        <div>
          <p className="landing-kicker">Today</p>
          <h2 id="today-title" className="landing-h2">Read today&apos;s predictions before you decide anything</h2>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-on-navy-2">
            Every tip names the market, the selection and the reasoning behind it. Open one to see the analysis in full.
          </p>
          <Link href="/tips" className="landing-link mt-5">
            See all of today&apos;s tips <ChevronRight aria-hidden className="size-4" />
          </Link>
        </div>
        {picks.length > 0 ? (
          <ul className="space-y-2.5">
            {picks.map((tip) => (
              <TopPickRow key={tip.id} tip={tip} timezone={timezone} />
            ))}
          </ul>
        ) : (
          <div className="rounded-card border border-navy-600 bg-navy-800 p-6">
            <h3>Today&apos;s card is being prepared</h3>
            <p className="mt-2 text-sm text-on-navy-2">Predictions are published before kick-off. Look at what&apos;s coming up in the meantime.</p>
            <Link href="/tips?window=upcoming" className="landing-link mt-4">
              Upcoming tips <ChevronRight aria-hidden className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

const STEPS = [
  {
    icon: BookOpenCheck,
    title: "Read the prediction",
    body: "Each tip shows the fixture, the market, our selection and why we picked it. Nothing is hidden behind a teaser.",
  },
  {
    icon: ListChecks,
    title: "Check the record",
    body: "Every graded tip stays on the results page, losses included, so you can judge us on the whole history.",
  },
  {
    icon: Scale,
    title: "Decide for yourself",
    body: "We publish analysis, not bets. We never take stakes or hold money, and no prediction is guaranteed.",
  },
] as const;

function HowItWorks() {
  return (
    <section className="landing-band landing-band-alt" aria-labelledby="how-title">
      <div className="landing-container">
        <SectionIntro id="how-title" kicker="How it works" title="Three steps, and the last one is yours" />
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="landing-step">
              <span className="flex items-center gap-3">
                <span className="landing-step-number" aria-hidden>{index + 1}</span>
                <step.icon aria-hidden className="size-6 text-green-400" />
              </span>
              <h3 className="mt-4 text-lg">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-on-navy-2">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function RecordSection({ won, lost, settled, winRate }: { won: number; lost: number; settled: number; winRate: number | null }) {
  const others = settled - won - lost;
  return (
    <section className="landing-band" aria-labelledby="record-title">
      <div className="landing-container grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="landing-kicker">An open record</p>
          <h2 id="record-title" className="landing-h2">Every prediction we publish stays published, won or lost</h2>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-on-navy-2">
            Win rate is wins divided by wins and losses, and it is always shown beside how many tips it covers. Voids and pushes stay in the record.
          </p>
          <Link href="/results" className="landing-link mt-5">
            See the full record <ChevronRight aria-hidden className="size-4" />
          </Link>
        </div>
        {settled > 0 ? (
          <div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <RecordFigure label="Graded" value={String(settled)} />
            <RecordFigure label="Won" value={String(won)} tone="text-green-400" />
            <RecordFigure label="Lost" value={String(lost)} tone="text-red-500" />
            <RecordFigure label={others > 0 ? "Win rate*" : "Win rate"} value={winRate === null ? "—" : `${winRate}%`} />
          </dl>
          {others > 0 ? <p className="mt-2 text-xs text-on-navy-muted">*Excludes {others} void or push {others === 1 ? "result" : "results"}.</p> : null}
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-navy-600 p-6">
            <h3>The record starts with the first graded tip</h3>
            <p className="mt-2 text-sm text-on-navy-2">Results appear here as matches finish. Nothing is removed afterwards.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function RecordFigure({ label, value, tone = "text-on-navy" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-card border border-navy-600 bg-navy-800 p-4">
      <dt className="text-sm text-on-navy-2">{label}</dt>
      <dd className={`tabular mt-1 text-3xl font-bold ${tone}`}>{value}</dd>
    </div>
  );
}

const SPORT_NOTES = {
  football: "Top leagues",
  basketball: "NBA & more",
  tennis: "ATP & WTA",
} as const;

function SportsSection() {
  return (
    <section className="landing-band landing-band-alt" aria-labelledby="sports-title">
      <div className="landing-container">
        <SectionIntro id="sports-title" kicker="Sports" title="Football, basketball and tennis">
          Real, competitive fixtures only. We don&apos;t publish predictions on virtual games or casino outcomes.
        </SectionIntro>
        <ul className="mt-8 grid gap-3 sm:grid-cols-3">
          {(["football", "basketball", "tennis"] as const).map((sport) => (
            <li key={sport}>
              <Link href={`/tips?sport=${sport}`} className="landing-sport">
                <SportIcon sport={sport} size="lg" />
                <span className="min-w-0 flex-1">
                  <strong className="block text-lg">{sportLabel(sport)}</strong>
                  <span className="text-sm text-on-navy-2">{SPORT_NOTES[sport]}</span>
                </span>
                <ChevronRight aria-hidden className="size-5 shrink-0 text-on-navy-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function CommunitySection() {
  return (
    <section className="landing-band" aria-labelledby="community-title">
      <div className="landing-container">
        <div className="landing-community">
          <div className="min-w-0">
            <p className="landing-kicker text-white/80">Community</p>
            <h2 id="community-title" className="landing-h2">Get each day&apos;s tips where you already are</h2>
            <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-white/85">
              Join our Telegram and WhatsApp channels for daily tips, results and match talk with other fans.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={communityLinks.telegram} target="_blank" rel="noreferrer" className="landing-channel">
              <Send aria-hidden className="size-5" /> Telegram
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <a href={communityLinks.whatsapp} target="_blank" rel="noreferrer" className="landing-channel">
              <MessageCircle aria-hidden className="size-5" /> WhatsApp
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  {
    q: "Is Winning Tips a bookmaker?",
    a: "No. We publish predictions and analysis. We never take bets, hold money, or pay out winnings. If you choose to bet, you do it on a licensed operator's own platform.",
  },
  {
    q: "Are the predictions guaranteed?",
    a: "No prediction is guaranteed. Sport is uncertain, and some tips will lose. That is why every result, won or lost, stays on our results page.",
  },
  {
    q: "What does it cost?",
    a: "Today's free tips cost nothing. VIP slips are bought one at a time when you want them. There is no subscription and nothing renews automatically.",
    link: { href: "/pricing", label: "See VIP pricing" },
  },
  {
    q: "Who can use Winning Tips?",
    a: "Adults aged 18 and over. We are launching in Ghana first, with more countries to follow.",
  },
] as const;

function FaqSection() {
  return (
    <section className="landing-band landing-band-alt" aria-labelledby="faq-title">
      <div className="landing-container grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)]">
        <SectionIntro id="faq-title" kicker="Questions" title="Straight answers" />
        <div className="divide-y divide-navy-600 border-y border-navy-600">
          {FAQ.map((item) => (
            <details key={item.q} className="landing-faq group">
              <summary>
                {item.q}
                <ChevronRight aria-hidden className="size-5 shrink-0 text-on-navy-muted transition-transform group-open:rotate-90" />
              </summary>
              <p className="pb-5 text-[0.9375rem] leading-relaxed text-on-navy-2">
                {item.a}
                {"link" in item ? (
                  <>
                    {" "}
                    <Link href={item.link.href} className="font-semibold text-blue-300 underline-offset-4 hover:underline">{item.link.label}</Link>
                  </>
                ) : null}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function ResponsibleNote() {
  return (
    <section className="landing-band pb-12" aria-label="Responsible participation">
      <div className="landing-container">
        <div className="flex flex-col gap-4 rounded-card border border-navy-600 bg-navy-800 p-5 sm:flex-row sm:items-center">
          <ShieldCheck aria-hidden className="size-8 shrink-0 text-green-400" />
          <p className="min-w-0 flex-1 text-sm leading-relaxed text-on-navy-2">
            <strong className="text-on-navy">18+ only.</strong> Predictions are for information and entertainment. Only spend what you can afford to lose, and take a break if it stops being fun.
          </p>
          <Link href="/responsible-betting" className="landing-link shrink-0">
            Responsible participation <ChevronRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
