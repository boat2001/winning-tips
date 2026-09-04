import Link from "next/link";
import { deleteBooking, deleteBookings, toggleBooking } from "./actions";
import { PredictionResultEditor } from "@/components/admin/prediction-result-editor";
import { SlipSelectionControls } from "@/components/admin/slip-selection-controls";
import { SlipLoaderModal } from "@/components/admin/slip-loader-form";
import { getDatabase } from "@/lib/db/client";
import { toDateKey } from "@/lib/football/dates";

export const dynamic = "force-dynamic";

const categories = ["ALL", "FREE", "VIP1", "VIP2", "VIP3"] as const;
const categoryLabel = { ALL: "Slips", FREE: "Free", VIP1: "VIP1", VIP2: "VIP2", VIP3: "VIP3" } as const;
function formatTime(date: Date) {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Accra" });
}

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const requested = (await searchParams).category?.toUpperCase();
  const category = categories.includes(requested as typeof categories[number]) ? requested as typeof categories[number] : "ALL";
  const database = getDatabase();
  const [bookings, grouped] = await Promise.all([
    database.booking.findMany({
      where: category === "ALL" ? { deletedAt: null } : { category, deletedAt: null },
      include: {
        predictions: { include: { fixture: { include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } } } }, orderBy: { createdAt: "asc" } },
      },
      orderBy: [{ bookingDate: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    database.booking.groupBy({ by: ["category"], where: { deletedAt: null }, _count: { _all: true } }),
  ]);
  const counts = Object.fromEntries(grouped.map((item) => [item.category, item._count._all]));
  const total = grouped.reduce((sum, item) => sum + item._count._all, 0);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-4xl font-semibold tracking-[-0.05em] text-ink">Games Management</h1>
        <SlipLoaderModal />
      </div>

      <section className="mt-7 rounded-sharp border border-line bg-white p-5 sm:p-6">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue">filter games</p>
            <Link href="/admin/games" className={`shrink-0 rounded-sharp px-3 py-2 text-xs font-semibold ${category === "ALL" ? "bg-[var(--color-blue)] text-white" : "bg-line text-ink-2 hover:bg-line"}`}>Total Slips ({total})</Link>
          </div>
          <div className="mt-3 flex flex-nowrap gap-2 overflow-x-auto pb-1">{categories.filter((item) => item !== "ALL").map((item) => <Link key={item} href={`/admin/games?category=${item}`} className={`shrink-0 whitespace-nowrap rounded-sharp px-3 py-2 text-xs font-semibold ${category === item ? "bg-[var(--color-blue)] text-white" : "bg-line text-ink-2 hover:bg-line"}`}>{categoryLabel[item]} ({counts[item] ?? 0})</Link>)}</div>
        </div>
      </section>

      <section className="mt-7" aria-labelledby="uploaded-slips-heading">
        <div>
          <h2 id="uploaded-slips-heading" className="text-lg font-semibold text-ink">Uploaded Slips ({bookings.length})</h2>
          <form id="bulk-delete-form" action={deleteBookings} className="mt-3"><SlipSelectionControls /></form>
        </div>
        <div className="mt-4 space-y-3">
          {bookings.map((booking, bookingIndex) => (
            <article key={booking.id} className="rounded-sharp border border-line bg-white p-3.5 sm:p-4">
              <div className="flex items-start gap-2.5">
                <input form="bulk-delete-form" name="bookingIds" value={booking.id} type="checkbox" aria-label={`Select ${booking.title} ${booking.code}`} className="mt-1 size-4 accent-blue" />
                <details className="group min-w-0 flex-1" open={bookingIndex === 0}>
                  <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="flex items-center gap-1.5 text-base font-semibold text-ink">Slip {bookingIndex + 1} · {booking.title}<svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 shrink-0 fill-none stroke-blue stroke-2 transition-transform duration-200 group-open:rotate-180" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg></h3><p className="mt-1 text-xs text-muted">{booking.predictions.length} games · Total odds: <strong className="text-ink-2">{booking.totalOdds?.toString() ?? "—"}</strong> · {toDateKey(booking.bookingDate)} {formatTime(booking.createdAt)}{booking.priceMinor ? <> · Price: <strong className="text-ink-2">GH₵{(booking.priceMinor / 100).toFixed(2)}</strong></> : null}</p><p className="mt-0.5 text-[0.7rem] font-bold text-blue">{booking.platform}: {booking.code}</p></div><span className={`rounded-full px-2.5 py-1 text-[0.6rem] font-semibold ${booking.isActive ? "bg-blue-wash text-blue" : "bg-line text-muted"}`}>{booking.isActive ? "PUBLISHED" : "HIDDEN"}</span></div></summary>
                  <div className="mt-3 space-y-2">
                    {booking.predictions.map((prediction) => <PredictionResultEditor key={prediction.id} id={prediction.id} homeTeam={prediction.fixture.homeTeam.name} awayTeam={prediction.fixture.awayTeam.name} market={prediction.market} selection={prediction.selection} odds={prediction.odds.toString()} kickoffAt={prediction.fixture.kickoffAt.toISOString()} result={prediction.result} />)}
                  </div>
                </details>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3"><form action={toggleBooking}><input type="hidden" name="id" value={booking.id} /><input type="hidden" name="isActive" value={String(!booking.isActive)} /><button className="rounded-sharp bg-ink px-3 py-2 text-xs font-semibold text-white">{booking.isActive ? "Hide slip" : "Publish slip"}</button></form><form action={deleteBooking}><input type="hidden" name="id" value={booking.id} /><button className="rounded-sharp border border-lost-bg px-3 py-2 text-xs font-semibold text-lost">Delete slip</button></form></div>
            </article>
          ))}
          {bookings.length === 0 ? <p className="rounded-sharp border border-line bg-white p-10 text-center text-sm text-muted">No slips in this category yet. Load a SportyBet booking code above.</p> : null}
        </div>
      </section>
    </main>
  );
}
