"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import markImage from "@/public/brand/winning-tips-mark.png";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Tips", href: "/tips" },
  { label: "Results", href: "/results" },
  { label: "Community", href: "/community" },
  { label: "About", href: "/about" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The guest header from the landing mock: a light bar above the navy hero,
 * which is the only place in the product where the brand sits on white.
 *
 * On desktop the bar is a three-column grid with equal outer tracks, so the nav
 * sits on the true centre line whatever the width of the logo or the actions.
 *
 * The mobile menu is a disclosure rather than an overlay drawer — the mock shows
 * a plain hamburger, and a full drawer would need focus trapping and scroll
 * locking for a five-item list that fits on screen.
 */
export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="relative z-30 border-b border-navy-950/10 bg-white">
      <div className="mx-auto flex h-18 max-w-[84rem] items-center gap-3 px-4 sm:px-6 lg:grid lg:h-20 lg:grid-cols-[1fr_auto_1fr] lg:gap-8 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3 justify-self-start">
          <Image src={markImage} alt="" priority className="h-10 w-auto lg:h-12" />
          <span className="flex flex-col">
            <span className="whitespace-nowrap font-brand text-lg font-extrabold uppercase leading-none tracking-tight text-navy-950 lg:text-[1.375rem]">
              Winning Tips
            </span>
            <span className="mt-1.5 hidden whitespace-nowrap text-[0.625rem] font-bold uppercase leading-none tracking-[0.14em] text-navy-800 min-[430px]:block">
              Predict · Win · Together
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  {/* The underline is absolutely positioned so the active link keeps
                      the same box as the others and every label shares one baseline. */}
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex h-10 items-center rounded-lg px-3.5 text-[0.9375rem] font-medium transition-colors",
                      "after:absolute after:inset-x-3.5 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-blue-500 after:transition-opacity",
                      active
                        ? "text-blue-600 after:opacity-100"
                        : "text-navy-900 after:opacity-0 hover:text-blue-600",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 justify-self-end sm:gap-3 lg:ml-0">
          <Link
            href="/tips"
            aria-label="Search tips"
            className="hidden size-11 items-center justify-center rounded-full text-navy-900 transition-colors hover:bg-navy-950/5 lg:inline-flex"
          >
            <Search aria-hidden className="size-5" />
          </Link>

          <span aria-hidden className="hidden h-6 w-px bg-navy-950/10 lg:block" />

          {/* Wrapped rather than given `hidden` directly: ButtonLink's base class
              sets `inline-flex`, and cn() only concatenates — Tailwind's own
              utility order then decides which display wins, not the order the
              classes were written in. Hiding the wrapper is unambiguous. */}
          <span className="hidden sm:block">
            {/* An inset ring draws inside the box, so Login matches Get Started's
                height exactly instead of growing by the ring's width. */}
            <ButtonLink
              href="/login"
              variant="light"
              className="h-11 !text-navy-900 ring-1 ring-inset ring-navy-950/15 hover:!bg-navy-950/5"
            >
              Login
            </ButtonLink>
          </span>

          <ButtonLink
            href="/register"
            variant="success"
            className="h-11 whitespace-nowrap !px-4 !text-[0.8125rem] sm:!px-5 sm:!text-sm"
          >
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
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block border-b border-navy-950/5 py-3 font-medium last:border-b-0",
                      active ? "text-blue-600" : "text-navy-900",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
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
