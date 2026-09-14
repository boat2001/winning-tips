import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Result } from "@/components/predictions/result-chip";
import { Shell } from "@/components/ui/layout";
import { getPublicPredictionBySlug } from "@/lib/predictions/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { getPremiumAccessContext } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const prediction = await getPublicPredictionBySlug(slug);
  const title = prediction ? `${prediction.homeTeam} vs ${prediction.awayTeam} Prediction` : "Prediction";
  const description = prediction
    ? `Football tip and match analysis for ${prediction.homeTeam} vs ${prediction.awayTeam}.`
    : "Winning Tips football prediction.";
  return {
    title,
    description,
    alternates: { canonical: `/predictions/${slug}` },
    openGraph: { type: "article", url: `/predictions/${slug}`, title, description },
  };
}

export default async function PredictionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const prediction = await getPublicPredictionBySlug(slug, await getPremiumAccessContext(user));
  if (!prediction) notFound();

  const kickoff = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "UTC" }).format(
    new Date(prediction.kickoffAt),
  );

  return (
    <>
      <section className="border-b border-line-2 bg-surface">
        <Shell>
          <div className="flex items-center justify-between gap-4 border-b border-line py-3">
            <p className="eyebrow min-w-0 truncate">{prediction.league} · {prediction.leagueCountry}</p>
            <span className={`shrink-0 ${prediction.visibility === "FREE" ? "eyebrow eyebrow-blue" : "tag-vip"}`}>
              {prediction.visibility === "FREE" ? "Free pick" : "VIP pick"}
            </span>
          </div>

          <div className="py-10 sm:py-14">
            <Link href="/predictions" className="eyebrow transition-colors hover:text-blue">
              ← All predictions
            </Link>
            <h1 className="display-heading mt-5 max-w-3xl text-[clamp(2rem,7vw,4rem)] font-bold leading-[0.92]">
              {prediction.homeTeam} <span className="font-medium text-faint">v</span> {prediction.awayTeam}
            </h1>
            <p className="num mt-5 text-sm text-muted">{kickoff} UTC</p>
          </div>
        </Shell>
      </section>

      <Shell className="py-12 sm:py-16">
        {prediction.locked ? (
          <div className="max-w-xl">
            <span className="tag-vip">Premium</span>
            <h2 className="display-heading mt-5 text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-[0.98]">
              This one is on a VIP slip
            </h2>
            <p className="mt-4 text-base leading-7 text-ink-2">
              Buy the slip this fixture belongs to and the selection, odds, confidence and full analysis unlock —
              permanently, on your account.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/vip" className="btn btn-primary">
                See VIP slips
              </Link>
              <Link href="/predictions" className="btn btn-ghost">
                Free predictions
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
            <article>
              <h2 className="display-heading border-b-2 border-ink pb-3 text-2xl font-semibold">Match analysis</h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-ink-2">{prediction.analysis}</p>
            </article>

            <aside>
              <h2 className="eyebrow border-b border-line-2 pb-3">The pick</h2>
              <dl className="mt-2">
                <div className="border-b border-line py-4">
                  <dt className="eyebrow">Market</dt>
                  <dd className="mt-1.5 text-sm font-semibold">{prediction.market}</dd>
                </div>
                <div className="border-b border-line py-4">
                  <dt className="eyebrow">Selection</dt>
                  <dd className="mt-1.5 text-base font-semibold">{prediction.selection}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-b border-line py-4">
                  <dt className="eyebrow">Odds</dt>
                  <dd className="num text-2xl font-semibold leading-none">{prediction.odds}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-b border-line py-4">
                  <dt className="eyebrow">Confidence</dt>
                  <dd className="num text-2xl font-semibold leading-none text-blue">{prediction.confidence}%</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-b border-line py-4">
                  <dt className="eyebrow">Result</dt>
                  <dd>
                    <Result result={prediction.result} />
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        )}
      </Shell>
    </>
  );
}
