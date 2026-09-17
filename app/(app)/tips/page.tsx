import type { Metadata } from "next";
import { TipsBoard } from "@/components/predictions/tips-board";
import { VipSlipCards } from "@/components/predictions/vip-slip-cards";
import { PageHeader } from "@/components/app/page-header";
import { SectionHead } from "@/components/ui/surface";
import { getCurrentViewer } from "@/lib/app/current-viewer";
import { adminRoles } from "@/lib/auth/constants";
import { getCurrentUser } from "@/lib/auth/session";
import { parseTipFilters } from "@/lib/domain/tip-filters";
import { getFreeTipsBoard } from "@/lib/predictions/board";
import { getTodaysVipSlips } from "@/lib/vip/queries";

export const metadata: Metadata = {
  title: "Tips",
  description: "Today's VIP slips and the free tips board with booking codes.",
  alternates: { canonical: "/tips" },
};

export const dynamic = "force-dynamic";

/**
 * Today's VIP slips, then the free board with its booking codes.
 *
 * A sport tile links here with `?sport=`, which picks the sport both boards
 * open on; without one they open on football.
 */
export default async function TipsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [viewer, params, user] = await Promise.all([getCurrentViewer(), searchParams, getCurrentUser()]);
  const sport = parseTipFilters(params).sport ?? "football";

  const [board, vip] = await Promise.all([getFreeTipsBoard(), getTodaysVipSlips(user?.id ?? null)]);
  const freeToday = board.days.find((day) => day.key === "today")?.predictions.length ?? 0;

  return (
    <div className="page-stack">
      <PageHeader title="Tips" meta={freeToday === 1 ? "1 free tip today" : `${freeToday} free tips today`} />
      <VipSlipCards
        plans={vip.plans}
        bookings={vip.bookings}
        purchasedBookingIds={vip.purchasedBookingIds}
        signedIn={Boolean(user)}
        paymentsConfigured={Boolean(process.env.PAYSTACK_SECRET_KEY)}
        previewPurchaseCtas={Boolean(user && adminRoles.includes(user.role as (typeof adminRoles)[number]))}
        loginNext="/tips#vip-slips"
        unavailable={vip.unavailable}
        initialSport={sport}
      />
      <section id="free-tips" className="section-stack scroll-mt-24" aria-label="Free tips and predictions">
        <SectionHead title="Free Tips & Predictions" description="Yesterday and today, with the booking codes underneath." />
        <TipsBoard
          days={board.days}
          bookingsByDate={board.bookingsByDate}
          unavailable={board.unavailable}
          timezone={viewer.timezone}
          initialSport={sport}
        />
      </section>
    </div>
  );
}
