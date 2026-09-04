import { communityLinks } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[1.15em] shrink-0 fill-telegram" aria-hidden="true">
      <path d="M21.7 3.3a1.1 1.1 0 0 0-1.15-.17L2.92 10.25a1.05 1.05 0 0 0 .08 1.98l4.55 1.48 1.74 5.31c.14.44.55.74 1.01.74.3 0 .58-.12.78-.34l2.54-2.72 4.69 3.45c.27.2.62.26.94.16.33-.1.58-.36.67-.69L22 4.42c.1-.4-.01-.83-.3-1.12ZM9.2 13.03l8.75-5.55-7.1 7.34-.47 2.03-1.18-3.82Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[1.15em] shrink-0 fill-whatsapp" aria-hidden="true">
      <path d="M12 2a9.82 9.82 0 0 0-8.36 14.98L2.1 22l5.18-1.5A9.94 9.94 0 1 0 12 2Zm0 17.84a7.75 7.75 0 0 1-3.95-1.08l-.28-.17-3.07.89.91-2.99-.19-.3A7.75 7.75 0 1 1 12 19.84Zm4.25-5.8c-.23-.12-1.38-.68-1.6-.76-.21-.08-.37-.12-.52.12-.16.23-.6.76-.74.92-.14.15-.27.17-.5.06-1.37-.68-2.27-1.22-3.18-2.77-.24-.41.24-.38.68-1.27.08-.16.04-.3-.02-.42-.06-.11-.52-1.26-.72-1.73-.19-.45-.38-.39-.52-.4h-.45c-.16 0-.41.06-.62.29-.21.23-.82.8-.82 1.96 0 1.15.84 2.27.96 2.42.12.15 1.65 2.52 4 3.53.56.24 1 .39 1.34.5.56.18 1.07.15 1.47.09.45-.07 1.38-.57 1.58-1.11.19-.55.19-1.02.13-1.12-.06-.1-.22-.16-.45-.27Z" />
    </svg>
  );
}

const channels = [
  { label: "Telegram", href: communityLinks.telegram, Icon: TelegramIcon, hover: "hover:border-telegram" },
  { label: "WhatsApp", href: communityLinks.whatsapp, Icon: WhatsAppIcon, hover: "hover:border-whatsapp" },
] as const;

/**
 * The free-community buttons, shared by the homepage, the dashboard, the footer
 * and the mobile menu so the pair never drifts apart.
 *
 * The button itself stays inside the Smart Tips palette — white fill, hairline
 * border, ink label — and only the glyph carries the platform's own colour. That
 * keeps them instantly recognisable without dropping two foreign brand slabs
 * into a page built on one blue.
 */
export function ChannelLinks({
  className,
  compact = false,
  full = false,
}: {
  className?: string;
  /** Shorter buttons, for the footer and other secondary placements. */
  compact?: boolean;
  /** Stretch each button to fill its grid or flex track. */
  full?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {channels.map(({ label, href, Icon, hover }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "btn btn-ghost bg-surface",
            hover,
            compact && "h-10 min-h-10 px-4",
            full && "flex-1",
          )}
        >
          <Icon />
          {label}
        </a>
      ))}
    </div>
  );
}
