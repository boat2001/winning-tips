import { Send } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { communityLinks } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";

/**
 * The Telegram join card, which the mocks place on home, tips and community.
 *
 * Two shapes: `panel` is the tall card that sits beside the top picks on
 * desktop home, `banner` is the wide strip that closes the tips and community
 * screens. Same content and same destination — only the arrangement differs.
 */
export function TelegramCard({
  variant = "banner",
  flourish,
  className,
}: {
  variant?: "panel" | "banner";
  flourish?: string;
  className?: string;
}) {
  const isPanel = variant === "panel";

  return (
    <section
      className={cn(
        "telegram-card relative isolate overflow-hidden rounded-card bg-[linear-gradient(115deg,#00bbef_0%,#0063fe_40%,#002760_100%)] px-5 py-5",
        isPanel ? "telegram-panel flex flex-col gap-4" : "flex flex-wrap items-center gap-x-5 gap-y-4",
        // Reserve the corner the flourish occupies, so the Join button cannot
        // land on top of it at the width where both are visible.
        flourish && !isPanel && "xl:pr-40",
        className,
      )}
    >
      <Send
        aria-hidden
        className={cn("shrink-0 -rotate-12 fill-white/95 text-white/95", isPanel ? "size-12" : "size-10")}
        strokeWidth={1.25}
      />

      <div className="min-w-0 flex-1">
        <h2 className="text-white">{isPanel ? "Join Our Telegram" : "More Winning Tips on Telegram"}</h2>
        <p className="mt-1 text-sm font-medium text-white/85">Get daily tips, results, odds updates &amp; more!</p>
      </div>

      <ButtonLink href={communityLinks.telegram} external variant="light" className={isPanel ? "self-start" : ""}>
        Join Now
        <span aria-hidden>›</span>
        <span className="sr-only"> on Telegram, opens in a new tab</span>
      </ButtonLink>

      {flourish ? (
        <p className="pointer-events-none absolute bottom-4 right-5 hidden max-w-[8rem] text-right font-script text-xl font-bold leading-tight text-white/90 xl:block">
          {flourish}
        </p>
      ) : null}
    </section>
  );
}
