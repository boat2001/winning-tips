import type { Deck, Fixture, League, Prediction, Team } from "@prisma/client";

type FixtureOption = Fixture & { league: League; homeTeam: Team; awayTeam: Team };
type PredictionValue = Prediction | null;

const inputClass = "mt-2 h-11 w-full rounded-sharp border border-line bg-white px-3 text-sm text-ink outline-none focus:border-blue focus:ring-4 focus:ring-blue/10";

export function PredictionForm({ action, fixtures, decks, prediction, selectedFixtureId }: { action: (formData: FormData) => void | Promise<void>; fixtures: FixtureOption[]; decks: Deck[]; prediction?: PredictionValue; selectedFixtureId?: string }) {
  return (
    <form action={action} className="grid gap-6">
      {prediction && <input type="hidden" name="id" value={prediction.id} />}
      <label className="text-sm font-bold text-ink-2">Match for this tip<select name="fixtureId" required defaultValue={prediction?.fixtureId ?? selectedFixtureId ?? ""} className={inputClass}><option value="" disabled>Select a match</option>{fixtures.map((fixture) => <option key={fixture.id} value={fixture.id}>{fixture.kickoffAt.toISOString().slice(0, 16).replace("T", " ")} · {fixture.homeTeam.name} vs {fixture.awayTeam.name} · {fixture.league.name}</option>)}</select></label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-bold text-ink-2">Market<input name="market" required defaultValue={prediction?.market} placeholder="e.g. Total Goals" className={inputClass} /></label>
        <label className="text-sm font-bold text-ink-2">Selection<input name="selection" required defaultValue={prediction?.selection} placeholder="e.g. Over 1.5 Goals" className={inputClass} /></label>
        <label className="text-sm font-bold text-ink-2">Odds<input name="odds" type="number" min="1.01" max="9999" step="0.01" required defaultValue={prediction?.odds.toString()} className={inputClass} /></label>
        <label className="text-sm font-bold text-ink-2">Confidence (%)<input name="confidence" type="number" min="1" max="100" required defaultValue={prediction?.confidence ?? 70} className={inputClass} /></label>
        <label className="text-sm font-bold text-ink-2">Deck<select name="deckId" defaultValue={prediction?.deckId ?? ""} className={inputClass}><option value="">No Deck</option>{decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}</select></label>
        <label className="text-sm font-bold text-ink-2">Visibility<select name="visibility" defaultValue={prediction?.visibility ?? "FREE"} className={inputClass}><option value="FREE">Free</option><option value="PREMIUM">Premium</option></select></label>
        <label className="text-sm font-bold text-ink-2">Publication<select name="status" defaultValue={prediction?.status ?? "DRAFT"} className={inputClass}><option value="DRAFT">Draft</option><option value="SCHEDULED">Scheduled</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></label>
        <label className="text-sm font-bold text-ink-2">Result<select name="result" defaultValue={prediction?.result ?? "PENDING"} className={inputClass}><option value="PENDING">Pending</option><option value="WON">Won</option><option value="LOST">Lost</option><option value="VOID">Void</option><option value="PUSH">Push</option><option value="CANCELLED">Cancelled</option></select></label>
      </div>
      <label className="text-sm font-bold text-ink-2">Analysis<textarea name="analysis" required minLength={20} rows={7} defaultValue={prediction?.analysis} placeholder="Explain the reasoning behind this selection..." className="mt-2 w-full rounded-sharp border border-line bg-white p-3 text-sm leading-6 text-ink outline-none focus:border-blue focus:ring-4 focus:ring-blue/10" /></label>
      <button type="submit" className="min-h-12 rounded-sharp bg-[var(--color-blue)] px-6 text-sm font-semibold text-white hover:bg-blue">{prediction ? "Save prediction" : "Create prediction"}</button>
    </form>
  );
}
