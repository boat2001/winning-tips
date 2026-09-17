import { permanentRedirect } from "next/navigation";

/** Superseded by /tips/[slug]; both read the same prediction slug. */
export default async function PredictionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  permanentRedirect(`/tips/${encodeURIComponent(slug)}`);
}
