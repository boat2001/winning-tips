import { getDatabase } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

type DashboardIconName = "users" | "free" | "games" | "vip" | "revenue" | "activity" | "predictions" | "won" | "lost" | "pending" | "cancelled";

function DashboardIcon({ name }: { name: DashboardIconName }) {
  const paths: Record<DashboardIconName, React.ReactNode> = {
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    free: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0M18 5l3 3M21 5l-3 3" /></>,
    games: <><path d="M8.5 7h7a5.5 5.5 0 0 1 5.32 6.9l-1.08 4.12a2.6 2.6 0 0 1-4.37 1.16L13.9 17.7a2.7 2.7 0 0 0-3.8 0l-1.47 1.48a2.6 2.6 0 0 1-4.37-1.16L3.18 13.9A5.5 5.5 0 0 1 8.5 7Z" /><path d="M8 11v4M6 13h4M16 12h.01M18 14h.01" /></>,
    vip: <><path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 11H5L3 7Z" /><path d="M5 18h14" /></>,
    revenue: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M16 10h5v4h-5a2 2 0 0 1 0-4ZM7 9h4" /></>,
    activity: <path d="M3 12h4l2.5-6 5 12 2.5-6h4" />,
    predictions: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
    won: <><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v1a4 4 0 0 0 4 4M17 6h3v1a4 4 0 0 1-4 4" /></>,
    lost: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></>,
    pending: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    cancelled: <><circle cx="12" cy="12" r="9" /><path d="M8 8l8 8M16 8l-8 8" /></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function humanize(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function relativeTime(date: Date, now: Date) {
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (elapsedSeconds < 60) return "Just now";
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} hr ago`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) return `${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default async function AdminDashboardPage() {
  const actor = await requireAdmin();
  const canViewRevenue = ["boatenberg", "lord"].includes(actor.username.toLowerCase());
  const now = new Date();
  const database = getDatabase();
  const [totalUsers, freeUsers] = await Promise.all([
    database.user.count({ where: { isActive: true } }),
    database.user.count({
      where: {
        isActive: true,
        payments: { none: { status: "SUCCESS" } },
      },
    }),
  ]);
  const [activeGames, vipPurchases] = await Promise.all([
    database.fixture.count({ where: { status: { in: ["SCHEDULED", "LIVE"] }, kickoffAt: { gte: new Date(now.getTime() - 3 * 60 * 60 * 1000) } } }),
    database.payment.count({ where: { status: "SUCCESS" } }),
  ]);
  const [predictionResults, activity] = await Promise.all([
    database.prediction.groupBy({ by: ["result"], where: { booking: { is: { deletedAt: null } } }, _count: { _all: true } }),
    database.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);
  const revenue = canViewRevenue ? await database.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amountMinor: true } }) : null;

  const predictionCount = (results: string[]) => predictionResults
    .filter((item) => results.includes(item.result))
    .reduce((total, item) => total + item._count._all, 0);
  const totalPredictions = predictionResults.reduce((total, item) => total + item._count._all, 0);

  const metrics = [
    { label: "Total Users", value: totalUsers, icon: "users" as const, color: "bg-blue-wash text-blue", valueColor: "text-blue" },
    { label: "Active Games", value: activeGames, icon: "games" as const, color: "bg-blue-wash text-blue", valueColor: "text-blue" },
    { label: "VIP Purchases", value: vipPurchases, icon: "vip" as const, color: "bg-orange-100 text-orange-700", valueColor: "text-orange-700" },
    { label: "Free Users", value: freeUsers, icon: "free" as const, color: "bg-cyan-100 text-cyan-700", valueColor: "text-cyan-700" },
    ...(canViewRevenue ? [{ label: "Revenue Received", value: `GHS ${new Intl.NumberFormat("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((revenue?._sum.amountMinor ?? 0) / 100)}`, icon: "revenue" as const, color: "bg-won-bg text-won", valueColor: "text-won" }] : []),
  ];
  const predictionMetrics = [
    { label: "Total Predictions", value: totalPredictions, icon: "predictions" as const, color: "bg-violet-100 text-violet-700", valueColor: "text-violet-700" },
    { label: "Won", value: predictionCount(["WON"]), icon: "won" as const, color: "bg-blue-wash text-blue", valueColor: "text-blue" },
    { label: "Lost", value: predictionCount(["LOST"]), icon: "lost" as const, color: "bg-lost-bg text-lost", valueColor: "text-lost" },
    { label: "Pending", value: predictionCount(["PENDING"]), icon: "pending" as const, color: "bg-hold-bg text-hold", valueColor: "text-hold" },
    { label: "Cancelled", value: predictionCount(["CANCELLED"]), icon: "cancelled" as const, color: "bg-line text-ink-2", valueColor: "text-ink-2" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-7 sm:py-10">
      <h1 className="text-3xl font-semibold tracking-[-0.045em] text-ink sm:text-4xl">Dashboard Overview</h1>

      <section className={`mt-5 grid grid-cols-2 gap-2 ${canViewRevenue ? "lg:grid-cols-5" : "lg:grid-cols-4"}`} aria-label="Dashboard metrics">
        {metrics.map((metric) => {
          const isRevenue = metric.label === "Revenue Received";
          return (
            <article key={metric.label} className={`flex min-h-16 items-center gap-2.5 rounded-sharp border border-line bg-white px-3 py-2.5 ${isRevenue ? "col-span-2" : ""}`}>
              <span className={`grid size-8 shrink-0 place-items-center rounded-full ${metric.color}`}><DashboardIcon name={metric.icon} /></span>
              <div>
                <p className={`text-lg font-semibold leading-none tracking-[-0.03em] ${metric.valueColor}`}>{metric.value.toLocaleString()}</p>
                <h2 className="mt-1 text-[0.68rem] font-bold leading-tight text-muted">{metric.label}</h2>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-7" aria-labelledby="prediction-performance-heading">
        <h2 id="prediction-performance-heading" className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Prediction Performance</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {predictionMetrics.map((metric) => (
            <article key={metric.label} className="flex min-h-16 items-center gap-2.5 rounded-sharp border border-line bg-white px-3 py-2.5">
              <span className={`grid size-8 shrink-0 place-items-center rounded-full ${metric.color}`}><DashboardIcon name={metric.icon} /></span>
              <div>
                <p className={`text-lg font-semibold leading-none tracking-[-0.03em] ${metric.valueColor}`}>{metric.value.toLocaleString()}</p>
                <h3 className="mt-1 text-[0.68rem] font-bold leading-tight text-muted">{metric.label}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-7 overflow-hidden rounded-sharp border border-line bg-white" aria-labelledby="recent-activity-heading">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3.5">
          <span className="grid size-7 place-items-center rounded-sharp bg-violet-100 text-violet-700"><DashboardIcon name="activity" /></span>
          <h2 id="recent-activity-heading" className="text-sm font-semibold text-ink">Recent Activity</h2>
        </div>
        <div className="divide-y divide-line">
          {activity.map((entry) => (
            <div key={entry.id} className="px-4 py-3">
              <p className="text-sm font-bold text-ink-2">{humanize(entry.action)}</p>
              <time dateTime={entry.createdAt.toISOString()} className="mt-0.5 block text-xs text-faint">{relativeTime(entry.createdAt, now)}</time>
            </div>
          ))}
          {activity.length === 0 && <p className="px-4 py-8 text-center text-sm text-faint">No recent activity</p>}
        </div>
      </section>
    </main>
  );
}
