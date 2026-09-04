"use client";

import { useState } from "react";

export function CopyBookingCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copyCode}
      aria-label={`Copy booking code ${code}`}
      className="eyebrow eyebrow-blue inline-flex items-center gap-1.5 transition-colors hover:text-ink"
    >
      <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        {copied ? <path d="m4 10 3.5 3.5L16 5.5" /> : <><rect x="7" y="7" width="9" height="9" rx="1" /><path d="M13 7V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1" /></>}
      </svg>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
