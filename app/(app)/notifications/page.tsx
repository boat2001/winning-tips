import { requireMember, getCurrentViewer } from "@/lib/app/current-viewer";
import { getPreferences } from "@/lib/app/preferences";
import { getMemberActivity } from "@/lib/member/queries";
import { PageHeader } from "@/components/app/page-header";
import { Panel } from "@/components/ui/surface";
import Link from "next/link";
export const dynamic = "force-dynamic";
export default async function NotificationsPage() {
  const user = await requireMember("/notifications");
  const viewer = await getCurrentViewer();
  const prefs = await getPreferences(viewer.id);
  const activity = user && prefs.notifications ? await getMemberActivity(user.id,30) : [];
  return <div className="page-stack"><PageHeader title="Notifications" meta={activity.length === 1 ? "1 recent update" : `${activity.length} recent updates`} /><Panel className="p-5">
    {activity.length ? <ul className="divide-y divide-navy-600">{activity.map(item => <li key={item.id} className="py-4"><h3>{item.title}</h3><p className="mt-1 text-sm text-on-navy-2">{item.description}</p><time className="text-xs text-on-navy-muted" dateTime={item.occurredAt.toISOString()}>{item.occurredAt.toLocaleString("en-GH",{timeZone:viewer.timezone})}</time></li>)}</ul> : <><h2>{prefs.notifications ? "You're all caught up" : "Account updates are off"}</h2><p className="mt-2 text-on-navy-2">Manage your account update preference in settings. Published tips and their current results remain available in your shortlist.</p></>}
    <Link href="/profile#settings" className="mt-4 inline-flex min-h-11 items-center text-blue-300">Manage preferences →</Link></Panel></div>;
}
