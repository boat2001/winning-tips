import Link from "next/link";
import { getDatabase } from "@/lib/db/client";
import { togglePredictionPublication } from "@/app/admin/predictions/actions";

export const dynamic = "force-dynamic";

export default async function AdminPredictionsPage() {
  const predictions = await getDatabase().prediction.findMany({ include: { fixture: { include: { homeTeam: true, awayTeam: true, league: true } }, deck: true }, orderBy: { createdAt: "desc" } });
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-7 sm:py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><h1 className="text-3xl font-semibold tracking-[-0.045em] text-ink sm:text-4xl">Predictions</h1><Link href="/admin/predictions/new" className="inline-flex min-h-11 items-center justify-center rounded-sharp bg-blue-500 px-5 text-sm font-semibold text-white hover:bg-blue-600">New prediction</Link></div>
      <div className="mt-6 overflow-hidden rounded-sharp border border-line bg-white">
        {predictions.length === 0 ? <p className="p-10 text-center text-sm text-muted">No predictions yet.</p> : <div className="divide-y divide-line">{predictions.map((prediction) => <article key={prediction.id} className="grid gap-4 p-5 sm:grid-cols-[1.4fr_0.8fr_0.65fr_auto] sm:items-center sm:px-6"><div><p className="text-xs font-bold text-blue">{prediction.fixture.league.name}</p><h2 className="mt-1 text-base font-semibold text-ink">{prediction.fixture.homeTeam.name} vs {prediction.fixture.awayTeam.name}</h2><p className="mt-1 text-xs text-faint">{prediction.market} · {prediction.selection} @ {prediction.odds.toString()}</p></div><div><p className="text-xs font-bold text-faint">{prediction.deck?.name ?? "No Deck"}</p><p className="mt-1 text-sm font-semibold text-ink-2">{prediction.visibility}</p></div><div><span className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold ${prediction.status === "PUBLISHED" ? "bg-blue-wash text-blue" : "bg-line text-muted"}`}>{prediction.status}</span></div><div className="flex gap-2"><Link href={`/admin/predictions/${prediction.id}/edit`} className="rounded-sharp border border-line px-3 py-2 text-xs font-semibold text-ink-2 hover:border-blue hover:text-blue">Edit</Link><form action={togglePredictionPublication}><input type="hidden" name="id" value={prediction.id} /><input type="hidden" name="nextStatus" value={prediction.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} /><button className="rounded-sharp bg-ink px-3 py-2 text-xs font-semibold text-white">{prediction.status === "PUBLISHED" ? "Unpublish" : "Publish"}</button></form></div></article>)}</div>}
      </div>
    </main>
  );
}
