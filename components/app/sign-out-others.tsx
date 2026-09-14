"use client";

import { useActionState } from "react";
import { LogOut } from "lucide-react";
import { signOutOtherDevices } from "@/app/(app)/profile/actions";

/**
 * Ends every session on the account, as guide §14.8 requires under security.
 *
 * The action existed and nothing called it. It revokes all sessions including
 * this one, so the button says so rather than implying other devices are
 * signed out while this one carries on.
 */
export function SignOutOthers() {
  const [state, action, pending] = useActionState(signOutOtherDevices, {} as { error?: string; success?: string });

  return (
    <form action={action} className="settings-control">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-white">
        <LogOut aria-hidden className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block">Sign out everywhere</strong>
        <span className="text-xs text-ink-500">
          {state.success ? state.success : state.error ? state.error : "Ends every signed-in session, including this one"}
        </span>
      </span>
      <button
        disabled={pending}
        className="min-h-11 shrink-0 rounded-control border border-card-line px-4 text-sm font-semibold text-blue-600 transition-colors hover:bg-card-2 disabled:opacity-50"
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
    </form>
  );
}
