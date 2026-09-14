"use client";
import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { setTipSaved } from "@/app/(app)/tips/actions";
export function SaveTipButton({ slug, initialSaved, label, className = "" }: { slug: string; initialSaved: boolean; label: string; className?: string }) {
  const [saved, setSaved] = useState(initialSaved);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  return <div className={`relative shrink-0 ${className}`}>
    <button type="button" disabled={pending} aria-pressed={saved} aria-label={`${saved ? "Unsave" : "Save"} ${label}`} onClick={() => startTransition(async () => {
      setError(""); const result = await setTipSaved(slug, !saved);
      if (result.error) setError(result.error); else if (result.saved !== undefined) setSaved(result.saved);
    })} className="inline-flex size-11 items-center justify-center rounded-full text-ink-500 hover:bg-green-100 disabled:opacity-50">
      <Bookmark aria-hidden className={`size-5 ${saved ? "fill-green-500 text-green-600" : ""}`} />
    </button>
    {error && <p role="alert" className="absolute right-0 top-full z-20 w-56 rounded-lg bg-white p-3 text-xs text-red-500 shadow-raised">{error}</p>}
  </div>;
}
