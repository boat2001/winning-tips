import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "ink" | "ghost" | "ghost-invert";
};

export function ButtonLink({ className, variant = "primary", ...props }: ButtonLinkProps) {
  return <Link className={cn("btn", `btn-${variant}`, className)} {...props} />;
}
