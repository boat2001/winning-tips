import Image from "next/image";
import { initialsOf } from "@/lib/domain/viewer";
import { cn } from "@/lib/utils/cn";

const SIZE = {
  sm: "size-8 text-[0.6875rem]",
  md: "size-10 text-xs",
  lg: "size-14 text-base",
  xl: "size-24 text-2xl",
} as const;

/**
 * A member's picture, falling back to their initials.
 *
 * The fallback is a real rendering rather than a placeholder image, so a member
 * with no upload still gets something identifiable and the layout never shifts
 * when a picture fails to load.
 */
export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const dimension = { sm: 32, md: 40, lg: 56, xl: 96 }[size];

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-700 font-bold text-on-navy ring-2 ring-navy-600",
        SIZE[size],
        className,
      )}
    >
      {src ? (
        <Image src={src} alt="" width={dimension} height={dimension} className="size-full object-cover" />
      ) : (
        <span aria-hidden>{initialsOf(name)}</span>
      )}
    </span>
  );
}
