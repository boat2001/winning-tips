"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

/**
 * Copies a booking code to the clipboard.
 *
 * The code stays visible and selectable beside this button, so where the
 * clipboard API is unavailable (plain http, some in-app browsers) there is
 * still a way to take it — the failure state says so instead of pretending.
 */
export function CopyCodeButton({ code, platform }: { code: string; platform: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${platform} booking code ${code}`}
        className={buttonClass("success", "md", "min-w-[6.5rem] shrink-0")}
      >
        {state === "copied" ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
        {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy"}
      </button>
      <span role="status" className="sr-only">
        {state === "copied" ? "Booking code copied" : state === "failed" ? "Could not copy. Select the code to copy it manually." : ""}
      </span>
    </>
  );
}
