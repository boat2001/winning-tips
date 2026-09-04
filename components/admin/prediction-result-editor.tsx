"use client";

import { useState, useTransition } from "react";
import { updatePredictionResult } from "@/app/admin/predictions/actions";

type EditableResult = "WON" | "LOST" | "PENDING" | "CANCELLED";

const resultOptions: Array<{ value: EditableResult; label: string; className: string }> = [
  { value: "WON", label: "Won", className: "bg-blue text-white" },
  { value: "LOST", label: "Lost", className: "bg-lost text-white" },
  { value: "PENDING", label: "Pending", className: "bg-hold text-white" },
  { value: "CANCELLED", label: "Cancel", className: "bg-muted text-white" },
];

const stateStyle: Record<string, { label: string; className: string }> = {
  WON: { label: "Won", className: "bg-blue-wash text-blue ring-blue-wash" },
  LOST: { label: "Lost", className: "bg-lost-bg text-lost ring-lost-bg" },
  PENDING: { label: "Pending", className: "bg-hold-bg text-hold ring-hold-bg" },
  CANCELLED: { label: "Cancelled", className: "bg-line text-ink-2 ring-line-2" },
  VOID: { label: "Void", className: "bg-line text-ink-2 ring-line-2" },
  PUSH: { label: "Push", className: "bg-line text-ink-2 ring-line-2" },
};

function ResultIcon({ result, className = "size-3.5" }: { result: string; className?: string }) {
  let path: React.ReactNode;
  if (result === "WON") path = <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16.5 8.5" /></>;
  else if (result === "LOST") path = <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></>;
  else if (result === "PENDING") path = <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>;
  else if (result === "PUSH") path = <><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></>;
  else path = <><circle cx="12" cy="12" r="9" /><path d="m6.5 6.5 11 11" /></>;

  return <svg aria-hidden="true" viewBox="0 0 24 24" className={`${className} fill-none stroke-current`} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{path}</svg>;
}

function formatKickoff(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Accra",
  }).format(new Date(value));
}

export function PredictionResultEditor({
  id,
  homeTeam,
  awayTeam,
  market,
  selection,
  odds,
  kickoffAt,
  result,
}: {
  id: string;
  homeTeam: string;
  awayTeam: string;
  market: string;
  selection: string;
  odds: string;
  kickoffAt: string;
  result: string;
}) {
  const [editing, setEditing] = useState(false);
  const [displayResult, setDisplayResult] = useState(result);
  const [savingResult, setSavingResult] = useState<EditableResult | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const currentState = stateStyle[displayResult] ?? stateStyle.PENDING;

  function update(formData: FormData) {
    const nextResult = formData.get("result") as EditableResult;
    const previousResult = displayResult;
    setSavingResult(nextResult);
    setDisplayResult(nextResult);
    setSaveError(null);
    startTransition(async () => {
      try {
        await updatePredictionResult(formData);
        setEditing(false);
      } catch {
        setDisplayResult(previousResult);
        setSaveError("The result could not be saved. Please try again.");
      } finally {
        setSavingResult(null);
      }
    });
  }

  return (
    <article className={`rounded-sharp border bg-white transition ${editing ? "border-blue-400 ring-1 ring-blue-wash" : "border-line"}`}>
      <div className="flex items-start gap-3 p-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-sm font-semibold text-ink">{homeTeam} vs {awayTeam}</h4>
            <span title={currentState.label} aria-label={`Current result: ${currentState.label}`} className={`grid size-5 shrink-0 place-items-center rounded-full ring-1 ${currentState.className}`}><ResultIcon result={displayResult} className="size-4" /></span>
          </div>
          <p className="mt-1 text-xs font-bold text-ink-2">{selection}</p>
          <p className="mt-0.5 text-[0.68rem] text-faint">{formatKickoff(kickoffAt)} · {market}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-semibold text-ink-2">{odds}</span>
          <button type="button" onClick={() => setEditing((value) => !value)} aria-expanded={editing} className={`rounded-sharp px-3 py-2 text-xs font-semibold text-white transition ${editing ? "bg-blue hover:bg-blue" : "bg-blue hover:bg-blue"}`}>{editing ? "Editing…" : "Edit"}</button>
        </div>
      </div>

      {editing ? (
        <form action={update} className="border-t border-line px-3 py-3">
          <input type="hidden" name="id" value={id} />
          <p className="mb-2 text-[0.68rem] font-bold text-muted">Update result for <span className="text-ink-2">{homeTeam} vs {awayTeam}</span></p>
          <div className="flex flex-nowrap gap-1 overflow-x-auto pb-1">
            {resultOptions.map((option) => (
              <button key={option.value} name="result" value={option.value} disabled={pending || savingResult !== null || displayResult === option.value} className={`inline-flex shrink-0 items-center gap-1 rounded-sharp px-2 py-1.5 text-[0.62rem] font-semibold transition disabled:ring-2 disabled:ring-offset-1 ${option.className}`}><ResultIcon result={option.value} className="size-3" />{savingResult === option.value ? "Saving…" : option.label}</button>
            ))}
          </div>
          {saveError ? <p role="alert" className="mt-2 text-xs font-bold text-lost">{saveError}</p> : null}
        </form>
      ) : null}
    </article>
  );
}
