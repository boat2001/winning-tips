"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction, type AuthActionState } from "@/app/(public)/auth-actions";
import { AuthField, PhoneField } from "@/components/auth/auth-field";
import { AuthLayout } from "@/components/auth/auth-layout";

const initialState: AuthActionState = {};

export function AccountPreview({ mode, next = "/dashboard" }: { mode: "login" | "register"; next?: string }) {
  const register = mode === "register";
  const [state, action, pending] = useActionState(register ? registerAction : loginAction, initialState);

  return (
    <AuthLayout
      kicker={register ? "New account" : "Members"}
      title={register ? "Join Smart Tips" : "Sign back in"}
      lede={
        register
          ? "Free to create. It keeps your VIP slips, booking codes and results in one place."
          : "Pick up the card, your purchased slips and your activity where you left them."
      }
      footer={
        <p className="text-sm text-muted">
          {register ? "Already have an account? " : "No account yet? "}
          <Link href={register ? "/login" : "/register"} className="font-semibold text-blue hover:text-ink">
            {register ? "Log in" : "Create one free"}
          </Link>
        </p>
      }
    >
      <form action={action} className="mt-8 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
        <input type="hidden" name="next" value={next} />
        {register && <AuthField label="Username" name="username" required autoComplete="username" placeholder="Pick a username" />}
        <AuthField
          label={register ? "Email address" : "Username or email"}
          name={register ? "email" : "identifier"}
          required
          type={register ? "email" : "text"}
          autoComplete={register ? "email" : "username"}
          placeholder={register ? "you@example.com" : "Username or email"}
        />
        {register && <PhoneField />}
        <AuthField
          label="Password"
          name="password"
          required
          type="password"
          autoComplete={register ? "new-password" : "current-password"}
          placeholder={register ? "At least 8 characters" : "Your password"}
        />
        {register && (
          <>
            <AuthField label="Confirm password" name="confirmPassword" required type="password" autoComplete="new-password" placeholder="Repeat your password" />
            <label className="flex min-w-0 items-start gap-3 text-sm leading-6 text-ink-2">
              <input name="termsAccepted" type="checkbox" required className="mt-1 size-4 shrink-0 accent-blue" />
              <span className="min-w-0">
                I am 18 or over and accept the{" "}
                <Link href="/terms" className="font-semibold text-blue hover:underline">Terms of Service</Link> and{" "}
                <Link href="/privacy" className="font-semibold text-blue hover:underline">Privacy Policy</Link>.
              </span>
            </label>
          </>
        )}

        {state.error && (
          <p role="alert" className="rounded-sharp border-l-[3px] border-lost bg-lost-bg px-3 py-2.5 text-sm font-medium text-lost">
            {state.error}
          </p>
        )}

        <button disabled={pending} className="btn btn-primary mt-1 w-full">
          {pending ? "Please wait…" : register ? "Create account" : "Sign in"}
        </button>
      </form>

      {!register && (
        <p className="mt-5">
          <Link href="/forgot-password" className="eyebrow eyebrow-blue transition-colors hover:text-ink">
            Forgot your password?
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}
