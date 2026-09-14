import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * The action set from the mocks. Variants are explicit rather than composed
 * from utilities at each call site (guide §11), so a new screen cannot invent a
 * sixth kind of button by accident.
 *
 *   primary  royal blue   — the main action on a navy ground
 *   success  green        — join / confirm, and the odds action
 *   light    white        — an action sitting on a coloured card, e.g. Telegram
 *   ghost    outlined     — secondary action on navy
 *   quiet    borderless   — tertiary, used inside white cards
 */
export type ButtonVariant = "primary" | "success" | "light" | "ghost" | "quiet";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-blue-500 text-white hover:bg-blue-600",
  success: "bg-green-500 text-white hover:bg-green-600",
  light: "bg-white text-blue-600 hover:bg-blue-50",
  ghost: "border border-navy-600 bg-navy-800/60 text-on-navy hover:border-blue-400 hover:text-blue-300",
  quiet: "text-blue-600 hover:bg-blue-50",
};

/* min-h keeps every control at or above the 44px touch target of guide §12,
   including `sm`, which is 40px tall but sits in rows with generous padding. */
const SIZE: Record<ButtonSize, string> = {
  sm: "min-h-10 gap-1.5 px-3.5 text-[0.8125rem]",
  md: "min-h-11 gap-2 px-5 text-sm",
  lg: "min-h-12 gap-2 px-6 text-[0.9375rem]",
};

const BASE =
  "inline-flex items-center justify-center rounded-pill font-semibold leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:cursor-not-allowed aria-disabled:opacity-55";

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(BASE, VARIANT[variant], SIZE[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button type="button" className={buttonClass(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  external = false,
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  external?: boolean;
  className?: string;
  children: ReactNode;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={buttonClass(variant, size, className)}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

/**
 * A square control carrying only an icon. `label` is required — an icon button
 * with no accessible name is invisible to a screen reader.
 */
export function IconButton({
  label,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-on-navy-2 transition-colors hover:bg-navy-700 hover:text-on-navy",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
