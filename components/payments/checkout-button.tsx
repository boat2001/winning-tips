"use client";

import { useActionState } from "react";
import { initializeCheckoutAction, type CheckoutState } from "@/app/(public)/vip/actions";

export function CheckoutButton({
  planId,
  configured,
  label = "Buy slip",
  className = "",
}: {
  planId: string;
  configured: boolean;
  label?: string;
  className?: string;
}) {
  const [state, action, pending] = useActionState(initializeCheckoutAction, {} as CheckoutState);
  return (
    <form action={action} className={className} data-payments-configured={configured}>
      <input type="hidden" name="planId" value={planId} />
      <button disabled={pending} className="btn btn-primary w-full">
        {pending ? "Opening checkout…" : label}
      </button>
      {state.error && (
        <p role="alert" className="mt-3 text-sm font-medium text-lost">
          {state.error}
        </p>
      )}
    </form>
  );
}
