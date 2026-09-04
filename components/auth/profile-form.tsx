"use client";

import { useActionState } from "react";
import { updateProfileAction, type AuthActionState } from "@/app/(public)/auth-actions";

export function ProfileForm({ displayName, phone }: { displayName: string | null; phone: string | null }) {
  const [state, action, pending] = useActionState(updateProfileAction, {} as AuthActionState);
  return (
    <form action={action} className="mt-6 grid gap-5">
      <label className="block">
        <span className="field-label">Display name</span>
        <input name="displayName" defaultValue={displayName ?? ""} maxLength={80} className="field" />
      </label>
      <label className="block">
        <span className="field-label">Phone number</span>
        <input name="phone" defaultValue={phone ?? ""} maxLength={30} autoComplete="tel" className="field" />
      </label>
      {state.error && <p className="text-sm font-medium text-lost">{state.error}</p>}
      {state.success && <p className="text-sm font-medium text-won">{state.success}</p>}
      <button disabled={pending} className="btn btn-primary w-fit">{pending ? "Saving…" : "Save changes"}</button>
    </form>
  );
}
