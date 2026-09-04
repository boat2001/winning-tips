import type { MemberActivityItem } from "@/lib/member/queries";

function formatActivityDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

/** A ledger, not a feed: one hairline-separated row per event, timestamps in mono. */
export function ActivityList({
  activities,
  emptyCopy = "No account activity has been recorded yet.",
}: {
  activities: MemberActivityItem[];
  emptyCopy?: string;
}) {
  if (activities.length === 0) {
    return <p className="border border-dashed border-line-2 px-5 py-10 text-center text-sm text-muted">{emptyCopy}</p>;
  }

  return (
    <div className="border-t-2 border-ink">
      {activities.map((activity) => (
        <article key={activity.id} className="grid gap-1 border-b border-line py-4 sm:grid-cols-[minmax(0,1fr)_11rem] sm:items-baseline sm:gap-4">
          <div className="min-w-0">
            <p className="eyebrow">{activity.category}</p>
            <h3 className="mt-1.5 text-sm font-semibold">{activity.title}</h3>
            <p className="mt-1 break-words text-sm leading-6 text-muted">{activity.description}</p>
          </div>
          <time className="num text-xs text-faint sm:text-right" dateTime={activity.occurredAt.toISOString()}>
            {formatActivityDate(activity.occurredAt)}
          </time>
        </article>
      ))}
    </div>
  );
}
