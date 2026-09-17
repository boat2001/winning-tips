"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button for the automation panel.
 *
 * A job can take a while — settlement walks every pending pick, the sync calls
 * the feed — so the button reports that it is working and refuses a second
 * click, which would start a duplicate run.
 */
export function RunJobButton({ label, busyLabel = "Running…", tone = "primary" }: { label: string; busyLabel?: string; tone?: "primary" | "ghost" }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`min-h-10 rounded-sharp px-4 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
        tone === "primary" ? "bg-blue-500 text-white hover:bg-blue-600" : "border border-line text-ink-2 hover:border-blue hover:text-blue"
      }`}
    >
      {pending ? busyLabel : label}
    </button>
  );
}
