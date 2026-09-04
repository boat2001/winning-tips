import { updateVipControl } from "@/app/admin/bookings/actions";
import { getDatabase } from "@/lib/db/client";
import { getFixtureDateWindows, getUtcDayRange } from "@/lib/football/dates";
import { requireManagementAdmin } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

const categoryByDeckSlug = { "vip-deck": "VIP1", "vip-2-deck": "VIP2", "vip-3-deck": "VIP3" } as const;

export default async function GamesControlPage({ searchParams }: { searchParams?: Promise<{ applied?: string }> }) {
  await requireManagementAdmin();
  const appliedPlanId = (await searchParams)?.applied;
  const database = getDatabase();
  const today = getFixtureDateWindows()[1].date;
  const { start, end } = getUtcDayRange(today);
  const [plans, bookings] = await Promise.all([
    database.plan.findMany({ where: { isActive: true, deckId: { not: null } }, include: { deck: { select: { slug: true } } }, orderBy: { sortOrder: "asc" }, take: 3 }),
    database.booking.findMany({ where: { bookingDate: { gte: start, lt: end }, isActive: true, category: { in: ["VIP1", "VIP2", "VIP3"] } }, select: { category: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const loadedCategories = new Set(bookings.map((booking) => booking.category));

  return (
    <main className="mx-auto max-w-7xl px-5 pb-10 sm:px-8 sm:pb-14">
      <h1 className="text-3xl font-semibold tracking-[-0.05em] text-ink sm:text-4xl">VIP Games Control</h1>
      <section className="mt-6 grid gap-5 md:grid-cols-3">
        {plans.map((plan) => {
          const category = plan.deck?.slug ? categoryByDeckSlug[plan.deck.slug as keyof typeof categoryByDeckSlug] : undefined;
          const slipLoaded = Boolean(category && loadedCategories.has(category));
          return (
            <article key={plan.id} className="rounded-sharp border border-line bg-white p-5 text-center">
              <h2 className="text-xl font-semibold text-ink">{plan.name}</h2>
              <div className="mt-3 flex flex-wrap justify-center gap-2"><span className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold ${plan.isSoldOut ? "bg-lost-bg text-lost" : "bg-blue-wash text-blue"}`}>{plan.isSoldOut ? "SALES CLOSED" : "SALES OPEN"}</span><span className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold ${slipLoaded ? "bg-blue-wash text-blue" : "bg-line text-muted"}`}>{slipLoaded ? "TODAY'S SLIP READY" : "NO SLIP TODAY"}</span></div>
              <form action={updateVipControl} className="mt-5">
                <input type="hidden" name="id" value={plan.id} />
                <input type="hidden" name="availability" value={plan.isSoldOut ? "SOLD_OUT" : "AVAILABLE"} />
                <input type="hidden" name="appliedPlanId" value={plan.id} />
                <label className="block text-left text-xs font-bold text-ink-2">Price (GHS)</label>
                <div className="mt-2 flex gap-2">
                  <input name="price" type="number" min="0.01" step="0.01" required defaultValue={plan.priceMinor > 0 ? String(plan.priceMinor / 100) : "0"} aria-label={`${plan.name} price in GHS`} className="h-11 min-w-0 flex-1 rounded-sharp border border-line px-3 text-center text-sm font-bold outline-none focus:border-blue" />
                  <button type="submit" className={`h-11 shrink-0 rounded-sharp px-4 text-xs font-semibold text-white transition ${appliedPlanId === plan.id ? "bg-blue" : "bg-ink hover:bg-blue"}`}>{appliedPlanId === plan.id ? "Applied" : "Apply"}</button>
                </div>
              </form>
              <form action={updateVipControl}>
                <input type="hidden" name="id" value={plan.id} />
                <input type="hidden" name="price" value={plan.priceMinor > 0 ? String(plan.priceMinor / 100) : "0"} />
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-sharp bg-line p-1.5" aria-label={`${plan.name} sales status`}>
                  <button name="availability" value="AVAILABLE" aria-pressed={!plan.isSoldOut} disabled={!slipLoaded} className={`min-h-11 rounded-sharp px-2 text-xs font-semibold transition ${!plan.isSoldOut ? "bg-blue text-white" : slipLoaded ? "bg-transparent text-ink-2 hover:bg-white hover:text-blue" : "cursor-not-allowed bg-transparent text-faint"}`}>Open sales</button>
                  <button name="availability" value="SOLD_OUT" aria-pressed={plan.isSoldOut} className={`min-h-11 rounded-sharp px-2 text-xs font-semibold transition ${plan.isSoldOut ? "bg-lost text-white" : "bg-transparent text-ink-2 hover:bg-white hover:text-lost"}`}>Close sales</button>
                </div>
                {!slipLoaded ? <p className="mt-2 text-left text-xs text-hold">Load today&apos;s VIP slip before opening sales.</p> : null}
              </form>
            </article>
          );
        })}
        {plans.length === 0 && <p className="rounded-sharp border border-line bg-white p-8 text-sm text-muted md:col-span-3">No active VIP packages are configured.</p>}
      </section>
    </main>
  );
}
