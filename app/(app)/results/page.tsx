import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, CalendarDays, Target, Trophy } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { DataNotice } from "@/components/app/data-notice";
import { ResultsChart } from "@/components/predictions/results-chart";
import { ResultsList } from "@/components/predictions/results-list";
import { Card, Panel, SectionHead } from "@/components/ui/surface";
import { SportIcon, sportLabel } from "@/components/ui/sport-icon";
import { getCurrentViewer } from "@/lib/app/current-viewer";
import { getTipsData } from "@/lib/app/tips";
import { PERFORMANCE_RANGE_LABEL, type PerformanceRange, winRatePercent } from "@/lib/domain/performance";
import { resultsForRange, summarizeResults, toResultRows, dailyForm } from "@/lib/domain/result-summary";
import { formatDateRange } from "@/lib/utils/datetime";

export const metadata: Metadata = { title: "Results", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const ranges: readonly PerformanceRange[] = ["today", "7d", "30d", "all"];
const grades = ["ALL", "WON", "LOST", "VOID", "PUSH"] as const;
export default async function ResultsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [viewer, data, params] = await Promise.all([getCurrentViewer(), getTipsData(), searchParams]);
  const range = ranges.find(r => r === params.range) ?? "7d";
  const grade = grades.find(g => g === params.grade) ?? "ALL";
  const selected = resultsForRange(data.tips, range);
  const summary = summarizeResults(selected, range);
  const summaries = (["today", "7d", "all"] as const).map(r => summarizeResults(resultsForRange(data.tips, r), r));
  const rows = toResultRows(selected.filter(t => grade === "ALL" || t.grade === grade));
  const requestedPage = typeof params.page === "string" ? Number(params.page) : 1;
  const pages = Math.max(1, Math.ceil(rows.length / 20));
  const page = Number.isSafeInteger(requestedPage) ? Math.min(pages, Math.max(1, requestedPage)) : 1;
  const href = (changes: Record<string, string>) => "/results?" + new URLSearchParams({ range, grade, ...changes });
  const windowDays = range === "today" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : null;
  const rangeWindow = windowDays === null
    ? null
    : (() => {
        const end = new Date();
        const start = new Date(end);
        start.setUTCDate(start.getUTCDate() - (windowDays - 1));
        return formatDateRange(start.toISOString(), end.toISOString(), viewer.timezone);
      })();
  return <div className="results-page page-stack">
    {/* The window being viewed is the fact worth stating, so it is the meta
        line rather than a second pill repeating what the chips already say. */}
    <PageHeader title="Results" meta={rangeWindow ?? "Every published prediction, settled"}>
      <nav aria-label="Results period" className="rail flex gap-2.5">{ranges.map(r => <Link key={r} href={href({range:r})} aria-current={range === r ? "true" : undefined} className={`inline-flex shrink-0 items-center gap-2 rounded-pill border px-4 py-2.5 text-sm font-semibold transition-colors ${range === r ? "border-green-400 bg-green-500 text-white" : "border-navy-600 bg-navy-950/80 text-on-navy-2 hover:border-blue-400 hover:text-on-navy"}`}>{range === r ? <CalendarDays aria-hidden className="size-4" /> : null}{PERFORMANCE_RANGE_LABEL[r]}</Link>)}</nav>
    </PageHeader>
    <DataNotice unavailable={data.unavailable} />
    <ul className="results-summary grid grid-cols-3 gap-2 sm:gap-3">{summaries.map((s,i) => { const Icon = [Trophy, BarChart3, Target][i]; const percent = winRatePercent(s.winRate); return <Card as="li" key={s.range} className="flex items-center gap-3 p-3 sm:p-4"><Icon aria-hidden className={`size-8 shrink-0 ${i === 1 ? "text-blue-500" : "text-green-500"}`} /><div><p className="text-xs text-ink-500">{["Today", "Last 7 Days", "All Time"][i]}</p><p className="text-xl font-bold text-ink-900">{i === 2 ? percent === null ? "—" : `${percent}%` : `${s.won} / ${s.settled}`}</p><p className="text-xs text-ink-500">{i === 2 ? `${s.settled} graded tips` : percent === null ? "No decided tips" : `${percent}% win rate`}</p></div></Card> })}</ul>
    <Panel className="min-w-0 p-4 sm:p-5"><SectionHead title="Daily net results" description="Wins minus losses per day, last 7 days" icon={<BarChart3 aria-hidden className="size-5 text-blue-400" />} /><ResultsChart className="mt-4" bars={dailyForm(data.tips)} /></Panel>
    <section className="section-stack">
      {/* The status filter sits with the list it filters. It used to be a
          column of five tall buttons beside the chart, where it read as a
          control for the chart — which it never changed. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2>Recent Results</h2>
        <nav aria-label="Filter by result" className="rail flex gap-2">{grades.map(g => { const count = g === "ALL" ? selected.length : selected.filter(t => t.grade === g).length; return <Link key={g} href={href({grade:g})} aria-current={grade === g ? "true" : undefined} className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-pill border px-4 text-sm font-semibold transition-colors ${grade === g ? "border-blue-400 bg-blue-500 text-white" : "border-navy-600 bg-navy-800 text-on-navy-2 hover:border-blue-400 hover:text-on-navy"}`}>{g === "ALL" ? "All" : g.charAt(0)+g.slice(1).toLowerCase()}<span className={`tabular text-xs ${grade === g ? "text-white/80" : "text-on-navy-muted"}`}>{count}</span></Link>; })}</nav>
      </div>
      {rows.length ? <ResultsList rows={rows.slice((page-1)*20,page*20)} timezone={viewer.timezone} /> : <Panel className="p-8 text-center text-on-navy-2">No {grade === "ALL" ? "" : grade.toLowerCase() + " "}results in this period yet.</Panel>}
      {pages > 1 && <nav aria-label="Results pages" className="flex justify-between">{page > 1 ? <Link href={href({page:String(page-1)})}>← Previous</Link> : <span />}<span>{page} / {pages}</span>{page < pages && <Link href={href({page:String(page+1)})}>Next →</Link>}</nav>}
    </section>
    <section className="section-stack"><SectionHead title="Performance Breakdown" /><ul className="performance-breakdown grid grid-cols-2 gap-2 sm:grid-cols-4">{(["football","basketball","tennis","overall"] as const).map(sport => {
      const stats = sport === "overall" ? summary : summarizeResults(selected.filter(t => t.sport === sport),range);
      const percent = winRatePercent(stats.winRate);
      return <Panel as="li" key={sport} className="p-3 sm:p-4"><div className="flex items-center gap-2">{sport === "overall" ? <Trophy aria-hidden className="size-7 text-gold-500" /> : <SportIcon sport={sport} size="sm" />}<div><p className="text-sm font-semibold">{sport === "overall" ? "Overall" : sportLabel(sport)}</p><p className="text-xs text-on-navy-2">{stats.won} / {stats.won+stats.lost} decided</p></div></div><p className="mt-2 text-sm font-bold text-green-400">{percent === null ? "No results" : `${percent}%`}</p><div className="mt-2 h-1.5 rounded bg-navy-700"><div className="h-full rounded bg-green-500" style={{width:`${percent ?? 0}%`}} /></div></Panel>;
    })}</ul></section>
    {/* The promise first, the arithmetic second. Keeping losses on the page is
        this product's strongest honest claim, and it was buried in grey 12px
        type reading like a disclaimer rather than a commitment. */}
    <p className="max-w-3xl text-sm text-on-navy-2">
      <strong className="font-semibold text-on-navy">Every prediction we publish stays on this page, won or lost.</strong>{" "}
      <span className="text-on-navy-muted">Win rate is wins ÷ (wins + losses). Voids and pushes stay in the record but are excluded from that rate. Times are fixture kick-off in {viewer.timezone}. We don&apos;t publish profit figures without a disclosed staking method.</span>
    </p>
  </div>;
}
