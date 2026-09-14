"use client";
import { useState } from "react";
import { Share2 } from "lucide-react";

/**
 * Native share sheet where the browser has one, copy-to-clipboard otherwise.
 *
 * `pill` is the white call-to-action used on promo banners; `inline` is the
 * quiet icon-and-word control that sits in a post's action row.
 */
export function ShareButton({
  title = "Winning Tips",
  path = "/",
  variant = "pill",
}: {
  title?: string;
  path?: string;
  variant?: "pill" | "inline";
}) {
  const [message, setMessage] = useState("");

  async function share() {
    const url = new URL(path, window.location.origin).href;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        setMessage("Link copied");
      }
    } catch {
      // Dismissing the share sheet rejects too; that is not an error worth reporting.
      setMessage("");
    }
  }

  return (
    <span className="relative inline-flex items-center">
      {variant === "inline" ? (
        <button type="button" className="post-action" onClick={share}>
          <Share2 aria-hidden className="size-[1.125rem]" />
          Share
        </button>
      ) : (
        <button type="button" className="inline-flex min-h-11 items-center rounded-pill bg-white px-5 font-semibold text-blue-600 transition-colors hover:bg-blue-50" onClick={share}>
          Share with friends →
        </button>
      )}
      <span role="status" className="ml-2 text-xs">{message}</span>
    </span>
  );
}
