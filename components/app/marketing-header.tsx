"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Search, X } from "lucide-react";
import markImage from "@/public/brand/winning-tips-mark.png";
import { ButtonLink } from "@/components/ui/button";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Tips", href: "/tips" },
  { label: "Results", href: "/results" },
  { label: "Community", href: "/community" },
  { label: "About", href: "/about" },
] as const;

/**
 * The guest header from the landing mock: a light bar above the navy hero,
 * which is the only place in the product where the brand sits on white.
 *
 * The mobile menu is a disclosure rather than an overlay drawer — the mock shows
 * a plain hamburger, and a full drawer would need focus trapping and scroll
 * locking for a five-item list that fits on screen.
 */
export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-30 bg-white">
      <div className="mx-auto flex h-20 max-w-[84rem] items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image src={markImage} alt="" priority className="h-9 w-auto sm:h-11" />
          <span className="leading-none">
            <span className="block font-brand text-base font-extrabold uppercase leading-[1.05] tracking-tight text-navy-950 sm:text-xl">
              Winning
              <br />
              Tips
            </span>
            <span className="mt-1 hidden text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-navy-800 min-[430px]:block">
              Predict · Win · Together
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="ml-8 hidden lg:block">
          <ul className="flex items-center gap-7">
            {NAV.map((item, index) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={index === 0 ? "page" : undefined}
                  className={
                    index === 0
                      ? "border-b-2 border-blue-500 pb-1 font-semibold text-blue-600"
                      : "font-medium text-navy-900 transition-colors hover:text-blue-600"
                  }
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            href="/tips"
            aria-label="Search tips"
            className="hidden size-11 items-center justify-center rounded-full text-navy-900 transition-colors hover:bg-navy-950/5 lg:inline-flex"
          >
            <Search aria-hidden className="size-5" />
          </Link>

          {/* Wrapped rather than given `hidden` directly: ButtonLink's base class
              sets `inline-flex`, and cn() only concatenates — Tailwind's own
              utility order then decides which display wins, not the order the
              classes were written in. Hiding the wrapper is unambiguous. */}
          <span className="hidden sm:block">
            <ButtonLink
              href="/login"
              variant="light"
              className="!text-navy-900 ring-1 ring-navy-950/15 hover:!bg-navy-950/5"
            >
              Login
            </ButtonLink>
          </span>

          <ButtonLink href="/register" variant="success" className="whitespace-nowrap !px-3.5 !text-[0.8125rem] sm:!px-5 sm:!text-sm">
            Get Started
          </ButtonLink>

          <button
            type="button"
            aria-expanded={open}
            aria-controls="marketing-menu"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex size-11 items-center justify-center rounded-lg text-navy-950 lg:hidden"
          >
            {open ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>

      {open ? (
        <nav id="marketing-menu" aria-label="Main" className="border-t border-navy-950/10 lg:hidden">
          <ul className="mx-auto max-w-[84rem] px-4 py-2 sm:px-6">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-navy-950/5 py-3 font-medium text-navy-900 last:border-b-0"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="py-3 sm:hidden">
              <Link href="/login" className="font-semibold text-blue-600">
                Login
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
