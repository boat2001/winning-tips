"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { loadBookingSlip, type SlipLoaderState } from "@/app/admin/bookings/actions";

const input = "mt-2 h-11 w-full rounded-sharp border border-line bg-white px-3 text-sm outline-none focus:border-blue focus:ring-4 focus:ring-blue/10";

export function SlipLoaderModal() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(loadBookingSlip, {} as SlipLoaderState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => { if (state.success) formRef.current?.reset(); }, [state.success]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && !pending) setOpen(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open, pending]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-sharp bg-[var(--color-blue)] px-4 text-xs font-semibold text-white transition hover:bg-blue">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
        Load Slip
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4 sm:p-6">
          <button type="button" aria-label="Close slip loader" onClick={() => !pending && setOpen(false)} className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]" />
          <div role="dialog" aria-modal="true" aria-labelledby="slip-loader-heading" className="relative w-full max-w-xl rounded-sharp border border-line bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
              <h2 id="slip-loader-heading" className="text-lg font-semibold tracking-[-0.025em] text-ink">Load SportyBet Slip</h2>
              <button type="button" aria-label="Close" disabled={pending} onClick={() => setOpen(false)} className="grid size-9 shrink-0 place-items-center rounded-sharp text-faint transition hover:bg-line hover:text-ink-2 disabled:opacity-40">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>

            <form ref={formRef} action={action} className="p-5 sm:p-6">
              <div className="grid gap-5">
                <label className="text-sm font-bold text-ink-2">SportyBet booking code<input name="code" required autoCapitalize="characters" autoComplete="off" placeholder="e.g. E81TN3" className={`${input} font-mono text-base font-bold uppercase tracking-[0.12em]`} /></label>
                <label className="text-sm font-bold text-ink-2">Publish and sell as<select name="category" required defaultValue="" className={input}><option value="" disabled>Choose a plan</option><option value="FREE">Free Predictions</option><option value="VIP1">VIP 1 Package</option><option value="VIP2">VIP 2 Package</option><option value="VIP3">VIP 3 Package</option></select></label>
              </div>
              <button disabled={pending} className="mt-5 min-h-11 w-full rounded-sharp bg-[var(--color-blue)] px-5 text-sm font-semibold text-white transition hover:bg-blue disabled:cursor-wait disabled:bg-line-2">{pending ? "Loading matches…" : "Load and publish slip"}</button>
              {state.error ? <p role="alert" className="mt-4 rounded-sharp bg-lost-bg p-3 text-sm font-bold text-lost">{state.error}</p> : null}
              {state.success ? <p role="status" className="mt-4 rounded-sharp bg-blue-wash p-3 text-sm font-bold text-blue">{state.success}</p> : null}
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
