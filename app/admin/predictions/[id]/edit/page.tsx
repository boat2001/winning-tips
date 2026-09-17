import { notFound } from "next/navigation";
import { updatePrediction } from "@/app/admin/predictions/actions";
import { PredictionForm } from "@/components/admin/prediction-form";
import { getDatabase } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function EditPredictionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [prediction, fixtures, decks] = await Promise.all([
    getDatabase().prediction.findUnique({ where: { id } }),
    getDatabase().fixture.findMany({ include: { league: true, homeTeam: true, awayTeam: true }, orderBy: { kickoffAt: "desc" }, take: 80 }),
    getDatabase().deck.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!prediction) notFound();
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-7 sm:py-10 [&>*]:max-w-3xl"><h1 className="text-4xl font-semibold tracking-[-0.05em] text-ink">Edit prediction</h1><div className="mt-8 rounded-sharp border border-line bg-white p-6 sm:p-8"><PredictionForm action={updatePrediction} fixtures={fixtures} decks={decks} prediction={prediction} /></div></main>;
}
