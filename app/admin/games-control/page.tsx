import { updateVipControl } from "@/app/admin/bookings/actions";
import { getDatabase } from "@/lib/db/client";
import { fromDateKey, getFixtureDateWindows, getUtcDayRange } from "@/lib/football/dates";
import { requireManagementAdmin } from "@/lib/auth/authorization";
import Link from "next/link";
import { enabledCountries, resolveMemberCountry } from "@/lib/config/countries";
import { vipPriceRanges } from "@/lib/vip/pricing";

export const dynamic = "force-dynamic";

const categoryByDeckSlug = { "vip-deck": "VIP1", "vip-2-deck": "VIP2", "vip-3-deck": "VIP3" } as const;

export default async function GamesControlPage({ searchParams }: { searchParams?: Promise<{ applied?: string; country?: string; date?: string }> }) {
  await requireManagementAdmin();
  const params = await searchParams;
  const appliedPlanId = params?.applied;
  const country = resolveMemberCountry(params?.country);
  const database = getDatabase();
  const today = fromDateKey(params?.date) ? params!.date! : getFixtureDateWindows()[1].date;
  const { start, end } = getUtcDayRange(today);
  const [plans, bookings] = await Promise.all([
    database.plan.findMany({ where: { isActive: true, deckId: { not: null } }, include: { deck: { select: { slug: true } } }, orderBy: { sortOrder: "asc" }, take: 3 }),
    database.booking.findMany({ where: { countryCode: country.countryCode, bookingDate: { gte: start, lt: end }, isActive: true, deletedAt: null, category: { in: ["VIP1", "VIP2", "VIP3"] } }, select: { category: true, priceMinor: true, isSoldOut: true, deadline: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-7 sm:py-10">
      <h1 className="text-3xl font-semibold tracking-[-0.05em] text-ink sm:text-4xl">VIP Games Control</h1>
      <form className="mt-4 flex items-end gap-3" method="get"><input type="hidden" name="country" value={country.countryCode} /><label className="text-sm font-semibold">Card date<input className="mt-2 block rounded-sharp border border-line p-2" type="date" name="date" defaultValue={today} required /></label><button className="btn btn-ghost" type="submit">View cards</button></form>
      <p className="mt-3 text-sm text-muted">New cards are priced automatically from recorded whole-slip results. Launch prices apply until there are at least 30 eligible settled cards. Review the card before opening sales.</p>
      <nav aria-label="Country edition" className="mt-4 flex flex-wrap gap-2">{enabledCountries().map((edition) => <Link key={edition.countryCode} href={`/admin/games-control?country=${edition.countryCode}`} aria-current={edition.countryCode === country.countryCode ? "page" : undefined} className={`rounded-full px-4 py-2 text-xs font-semibold ${edition.countryCode === country.countryCode ? "bg-blue-500 text-white" : "bg-navy-700 text-on-navy-2 hover:bg-navy-600 hover:text-on-navy"}`}>{edition.name} · {edition.currency}</Link>)}</nav>
      <section className="mt-6 grid gap-5 md:grid-cols-3">
        {plans.map((plan) => {
          const category = plan.deck?.slug ? categoryByDeckSlug[plan.deck.slug as keyof typeof categoryByDeckSlug] : undefined;
          const slip = bookings.find((booking) => booking.category === category);
          const slipLoaded = Boolean(slip);
          const isSoldOut = slip?.isSoldOut ?? true;
          const range = category ? vipPriceRanges[category] : null;
          const priceMinor = slip?.priceMinor ?? range?.min ?? plan.priceMinor;
          return (
            <article key={plan.id} className="rounded-sharp border border-line bg-white p-5 text-center">
              <h2 className="text-xl font-semibold text-ink">{plan.name}</h2>
              <div className="mt-3 flex flex-wrap justify-center gap-2"><span className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold ${isSoldOut ? "bg-lost-bg text-lost" : "bg-blue-wash text-blue"}`}>{isSoldOut ? "SALES CLOSED" : "SALES OPEN"}</span><span className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold ${slipLoaded ? "bg-blue-wash text-blue" : "bg-line text-muted"}`}>{slipLoaded ? "SLIP READY" : "NO SLIP FOR THIS DATE"}</span></div>
              <form action={updateVipControl} className="mt-5">
                <input type="hidden" name="id" value={plan.id} />
                <input type="hidden" name="countryCode" value={country.countryCode} /><input type="hidden" name="date" value={today} />
                <input type="hidden" name="availability" value={isSoldOut ? "SOLD_OUT" : "AVAILABLE"} />
                <input type="hidden" name="appliedPlanId" value={plan.id} />
                <label className="block text-left text-xs font-bold text-ink-2">Price ({country.currency})</label>
                <div className="mt-2 flex gap-2">
                  <input name="price" type="number" min={range ? range.min / 100 : 0.01} max={range ? range.max / 100 : undefined} step="1" required defaultValue={String(priceMinor / 100)} aria-label={`${plan.name} price in ${country.currency}`} className="h-11 min-w-0 flex-1 rounded-sharp border border-line px-3 text-center text-sm font-bold outline-none focus:border-blue" />
                  <button type="submit" className={`h-11 shrink-0 rounded-sharp px-4 text-xs font-semibold text-white transition ${appliedPlanId === plan.id ? "bg-blue" : "bg-ink hover:bg-blue"}`}>{appliedPlanId === plan.id ? "Applied" : "Apply"}</button>
                </div>
              </form>
              <form action={updateVipControl}>
                <input type="hidden" name="id" value={plan.id} />
                <input type="hidden" name="countryCode" value={country.countryCode} /><input type="hidden" name="date" value={today} />
                <input type="hidden" name="price" value={String(priceMinor / 100)} />
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-sharp bg-line p-1.5" aria-label={`${plan.name} sales status`}>
                  <button name="availability" value="AVAILABLE" aria-pressed={!isSoldOut} disabled={!slipLoaded} className={`min-h-11 rounded-sharp px-2 text-xs font-semibold transition ${!isSoldOut ? "bg-blue text-white" : slipLoaded ? "bg-transparent text-ink-2 hover:bg-white hover:text-blue" : "cursor-not-allowed bg-transparent text-faint"}`}>Open sales</button>
                  <button name="availability" value="SOLD_OUT" aria-pressed={isSoldOut} className={`min-h-11 rounded-sharp px-2 text-xs font-semibold transition ${isSoldOut ? "bg-lost text-white" : "bg-transparent text-ink-2 hover:bg-white hover:text-lost"}`}>Close sales</button>
                </div>
                {!slipLoaded ? <p className="mt-2 text-left text-xs text-hold">Load this date&apos;s VIP slip before opening sales.</p> : null}
              </form>
            </article>
          );
        })}
        {plans.length === 0 && <p className="rounded-sharp border border-line bg-white p-8 text-sm text-muted md:col-span-3">No active VIP packages are configured.</p>}
      </section>
    </main>
  );
}
