import Link from "next/link";
export function SiteLinksFooter() {
  return <footer className="border-t border-navy-600 px-4 py-7 text-xs text-on-navy-2"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4"><p>Winning Tips · Predictions for information only. 18+. No outcome is guaranteed.</p><nav aria-label="Legal and support" className="flex flex-wrap gap-4"><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/responsible-betting">Responsible participation</Link><Link href="/contact">Contact</Link></nav></div></footer>;
}
