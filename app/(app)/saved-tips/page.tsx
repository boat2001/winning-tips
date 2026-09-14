import { requireMember, getCurrentViewer } from "@/lib/app/current-viewer";
import { getTipsData } from "@/lib/app/tips";
import { PageHeader } from "@/components/app/page-header";
import { TipListRow } from "@/components/predictions/tip-row";
import { Panel } from "@/components/ui/surface";
import { ButtonLink } from "@/components/ui/button";
import { DataNotice } from "@/components/app/data-notice";
export const dynamic = "force-dynamic";
export default async function SavedTipsPage() {
  await requireMember("/saved-tips");
  const [viewer, data] = await Promise.all([getCurrentViewer(), getTipsData()]);
  const saved = data.tips.filter(t => t.savedByViewer);
  return <div className="page-stack"><PageHeader title="Saved tips" meta="Your shortlist, with each pick's published outcome" />
    <DataNotice unavailable={data.unavailable} />
    {saved.length ? <ul className="space-y-3">{saved.map(t => <TipListRow key={t.id} tip={t} timezone={viewer.timezone} />)}</ul> :
      <Panel className="p-8 text-center"><h2>No saved tips yet</h2><p className="my-3 text-on-navy-2">Tap the bookmark on a prediction to keep it here.</p><ButtonLink href="/tips">Explore tips</ButtonLink></Panel>}
  </div>;
}
