"use client";

import { useFormStatus } from "react-dom";

export function UserSaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return <button disabled={disabled || pending} className="h-9 rounded-sharp bg-[var(--color-blue)] px-3 text-xs font-semibold text-white transition hover:bg-blue disabled:cursor-not-allowed disabled:bg-line disabled:text-muted">{pending ? "Saving…" : "Save"}</button>;
}
