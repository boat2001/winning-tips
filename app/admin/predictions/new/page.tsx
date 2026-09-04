import { createPrediction } from "@/app/admin/predictions/actions";
import { PredictionForm } from "@/components/admin/prediction-form";
import { getDatabase } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function NewPredictionPage({ searchParams }: { searchParams: Promise<{ fixtureId?: string }> }) {
  const [{ fixtureId }, fixtures, decks] = await Promise.all([
    searchParams,
    getDatabase().fixture.findMany({ include: { league: true, homeTeam: true, awayTeam: true }, orderBy: { kickoffAt: "desc" }, take: 80 }),
    getDatabase().deck.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  return <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14"><h1 className="text-4xl font-semibold tracking-[-0.05em] text-ink">Create prediction</h1><div className="mt-8 rounded-sharp border border-line bg-white p-6 sm:p-8"><PredictionForm action={createPrediction} fixtures={fixtures} decks={decks} selectedFixtureId={fixtureId} /></div></main>;
}
