"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, resetPasswordAction, type AuthActionState } from "@/app/(public)/auth-actions";
import { AuthField } from "@/components/auth/auth-field";
import { AuthLayout } from "@/components/auth/auth-layout";

const backToLogin = (
  <p className="text-sm text-muted">
    Remembered it?{" "}
    <Link href="/login" className="font-semibold text-blue hover:text-ink">
      Back to sign in
    </Link>
  </p>
);

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, {} as AuthActionState);
  return (
    <AuthLayout
      kicker="Account recovery"
      title="Reset your password"
      lede="Enter the email address attached to your account and we'll send the next step."
      footer={backToLogin}
    >
      <form action={action} className="mt-8 grid gap-5">
        <AuthField label="Email address" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
        {state.success && (
          <p className="rounded-sharp border-l-[3px] border-won bg-won-bg px-3 py-2.5 text-sm font-medium text-won">{state.success}</p>
        )}
        <button disabled={pending} className="btn btn-primary w-full">
          {pending ? "Submitting…" : "Send reset instructions"}
        </button>
      </form>
    </AuthLayout>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, {} as AuthActionState);
  return (
    <AuthLayout
      kicker="Account recovery"
      title="Choose a new password"
      lede="At least eight characters, with an uppercase letter, a lowercase letter and a number."
      footer={backToLogin}
    >
      <form action={action} className="mt-8 grid gap-5">
        <input type="hidden" name="token" value={token} />
        <AuthField label="New password" name="password" type="password" required autoComplete="new-password" placeholder="Create a new password" />
        <AuthField label="Confirm password" name="confirmPassword" type="password" required autoComplete="new-password" placeholder="Repeat the new password" />
        {state.error && (
          <p role="alert" className="rounded-sharp border-l-[3px] border-lost bg-lost-bg px-3 py-2.5 text-sm font-medium text-lost">{state.error}</p>
        )}
        {state.success && (
          <p className="rounded-sharp border-l-[3px] border-won bg-won-bg px-3 py-2.5 text-sm font-medium text-won">
            {state.success} <Link href="/login" className="underline">Sign in</Link>
          </p>
        )}
        <button disabled={pending || !token} className="btn btn-primary w-full">
          {pending ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthLayout>
  );
}
