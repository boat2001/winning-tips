"use client";

import Link from "next/link";

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="mx-auto flex min-h-[55vh] w-full max-w-[76rem] flex-col justify-center px-4 py-16 sm:px-5">
      <div className="max-w-xl">
        <div className="rule-double" />
        <p className="eyebrow eyebrow-blue pt-5">Something went wrong</p>
        <h1 className="display-heading mt-3 text-[clamp(1.875rem,6vw,3rem)] font-bold leading-[0.95]">
          We couldn&apos;t load this page
        </h1>
        <p className="mt-4 text-base leading-7 text-ink-2">
          The service may be briefly unavailable. Try again in a moment — nothing on your account has changed.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">
            Try again
          </button>
          <Link href="/" className="btn btn-ghost">
            Go home
          </Link>
        </div>
      </div>
    </section>
  );
}
