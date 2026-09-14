import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MessageCircle, PenLine, Target, Trophy } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { TelegramCard } from "@/components/community/telegram-card";
import { PostActions, PostComposer, type ReplyView } from "@/components/community/discussion-controls";
import { Card, Panel, SectionHead } from "@/components/ui/surface";
import { Avatar } from "@/components/ui/avatar";
import { SportIcon, sportLabel } from "@/components/ui/sport-icon";
import { getCommunityData } from "@/lib/app/community";
import { isDesignPreview } from "@/lib/config/countries";
import { getCurrentViewer } from "@/lib/app/current-viewer";
import type { SportSlug } from "@/lib/domain/tips";
import { formatPostedAt } from "@/lib/utils/datetime";

export const metadata: Metadata = { title: "Community", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const SPORTS = ["football", "basketball", "tennis"] as const;

/** What a post card renders, whichever source it came from. */
type PostView = {
  id: string;
  body: string;
  sport: string | null;
  createdAt: Date;
  authorName: string;
  likes: number;
  liked: boolean;
  replyCount: number;
  replies: ReplyView[];
};

type FeedView = { posts: PostView[]; total: number; memberCount: number; unavailable: boolean };

function previewFeed(): FeedView {
  return {
    posts: [
      {
        id: "preview-discussion",
        body: "Man City look unstoppable at home this season! Backing them again tonight. What are your thoughts? Any value in Arsenal or a draw?",
        sport: "football",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        authorName: "AlexProTips",
        likes: 128,
        liked: false,
        replyCount: 47,
        replies: [],
      },
    ],
    total: 1,
    memberCount: 125680,
    unavailable: false,
  };
}

async function liveFeed(sport: SportSlug | undefined, page: number): Promise<FeedView> {
  const data = await getCommunityData(sport, page);
  return {
    ...data,
    posts: data.posts.map((post) => ({
      id: post.id,
      body: post.body,
      sport: post.sport,
      createdAt: post.createdAt,
      authorName: post.author.displayName ?? post.author.username,
      likes: post._count.reactions,
      liked: post.reactions.length > 0,
      replyCount: post._count.replies,
      replies: post.replies.map((reply) => ({ id: reply.id, username: reply.author.username, body: reply.body })),
    })),
  };
}

function asSport(value: string | null): SportSlug | null {
  return SPORTS.find((sport) => sport === value) ?? null;
}

export default async function CommunityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const sport = SPORTS.find((s) => s === params.sport);
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 1000) : 1;
  const preview = isDesignPreview();
  const [viewer, data] = await Promise.all([
    getCurrentViewer(),
    preview ? Promise.resolve(previewFeed()) : liveFeed(sport, page),
  ]);
  const pageHref = (target: number) => `/community?${new URLSearchParams({ ...(sport ? { sport } : {}), page: String(target) })}`;

  return (
    <div className="community-page page-stack">
      <PageHeader
        title="Community"
        meta={data.unavailable ? "Discussions are temporarily unavailable" : `${data.memberCount.toLocaleString("en-GB")} ${preview ? "sample members" : "members"} · tips, talk and analysis`}
      />

      {data.unavailable && (
        <Panel className="p-4">
          <p role="status" className="text-sm text-on-navy-2">Discussions are temporarily unavailable. You can still visit our official Telegram community.</p>
        </Panel>
      )}

      <div className="community-grid">
        <section id="discussions" className="community-feed section-stack min-w-0 scroll-mt-24">
          <SectionHead title={sport ? `${sportLabel(sport)} discussions` : "Discussions"} action={sport ? { label: "All topics", href: "/community" } : undefined} />

          {/* Looks like the field it opens into, so it reads as "write here"
              rather than as one more collapsed section. */}
          <details className="composer rounded-card bg-card text-ink-900 shadow-card">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 p-3">
              <Avatar name={viewer.displayName} size="md" />
              <span className="flex min-h-11 flex-1 items-center rounded-pill border border-card-line bg-card-2 px-4 text-sm text-ink-500">Share your analysis…</span>
              <span className="hidden items-center gap-1.5 rounded-pill bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white sm:inline-flex">
                <PenLine aria-hidden className="size-4" />
                Post
              </span>
            </summary>
            <div className="border-t border-card-line p-4">
              <PostComposer />
            </div>
          </details>

          {data.posts.length ? (
            <ul className="space-y-3">
              {data.posts.map((post) => (
                <li key={post.id}>
                  <PostCard post={post} timezone={viewer.timezone} />
                </li>
              ))}
            </ul>
          ) : (
            <Card className="p-6 text-center">
              <MessageCircle aria-hidden className="mx-auto size-9 text-blue-500" />
              <h3 className="mt-3">Make room for good analysis</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
                Nothing has been posted{sport ? ` about ${sportLabel(sport).toLowerCase()}` : ""} yet. Share a considered prediction, ask a question, or explain what the data tells you.
              </p>
            </Card>
          )}

          {(data.total > page * 10 || page > 1) && (
            <nav aria-label="Discussion pages" className="flex justify-between text-sm font-semibold text-blue-300">
              {page > 1 ? <Link href={pageHref(page - 1)} className="min-h-11 py-3">← Newer</Link> : <span />}
              {data.total > page * 10 && <Link href={pageHref(page + 1)} className="min-h-11 py-3">Older →</Link>}
            </nav>
          )}
        </section>

        <aside className="community-rail section-stack" aria-label="Community highlights">
          <Panel as="section" id="leaderboard" className="scroll-mt-24 p-4 sm:p-5">
            <div className="flex items-center gap-2.5">
              <Trophy aria-hidden className="size-5 shrink-0 text-gold-500" />
              <h2 className="text-lg">Top Members</h2>
            </div>
            <p className="mt-3 text-sm text-on-navy-2">Rankings will reward helpful analysis and steady participation, never stake size.</p>
            <p className="mt-3 rounded-control border border-dashed border-navy-600 px-3 py-2.5 text-xs text-on-navy-muted">No rankings have been published yet.</p>
          </Panel>

          <Panel as="section" id="challenge" className="scroll-mt-24 p-4 sm:p-5">
            <div className="flex items-center gap-2.5">
              <Target aria-hidden className="size-5 shrink-0 text-green-400" />
              <h2 className="text-lg">Today&apos;s Challenge</h2>
            </div>
            <p className="mt-3 text-sm text-on-navy-2">There&apos;s no challenge running today. Read today&apos;s predictions and bring your view of the evidence here.</p>
            <Link href="/tips" className="mt-4 inline-flex min-h-11 items-center gap-1 rounded-control bg-green-400 px-4 text-sm font-bold text-navy-950 transition-colors hover:bg-green-500">
              Today&apos;s tips <ChevronRight aria-hidden className="size-4" />
            </Link>
          </Panel>
        </aside>
      </div>

      <section className="section-stack">
        <SectionHead title="Browse by sport" action={sport ? { label: "Show all", href: "/community" } : undefined} />
        <ul className="grid grid-cols-3 gap-2">
          {SPORTS.map((s) => (
            <li key={s}>
              <Link href={`/community?sport=${s}`} aria-current={sport === s ? "true" : undefined} className={`sport-tile${sport === s ? " sport-tile-active" : ""}`}>
                <SportIcon sport={s} size="sm" />
                <span>
                  <strong>{sportLabel(s)}</strong>
                  <small>Discussions</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <TelegramCard flourish="Different Games. Same Wins." />
    </div>
  );
}

function PostCard({ post, timezone }: { post: PostView; timezone: string }) {
  const name = post.authorName;
  const postSport = asSport(post.sport);
  const createdAt = post.createdAt.toISOString();

  return (
    <Card as="article" id={post.id} className="scroll-mt-24 px-4 pb-1 pt-4">
      <header className="flex items-start gap-3">
        <Avatar name={name} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base">{name}</h3>
          <time
            className="text-xs text-ink-500"
            dateTime={createdAt}
            title={new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: timezone }).format(post.createdAt)}
          >
            {formatPostedAt(createdAt, timezone)}
          </time>
        </div>
        {postSport ? (
          <Link
            href={`/community?sport=${postSport}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-green-100 py-1 pl-1 pr-3 text-xs font-semibold text-green-600 hover:bg-green-100/70"
          >
            <SportIcon sport={postSport} size="sm" className="!size-6 !p-1" />
            {sportLabel(postSport)}
          </Link>
        ) : null}
      </header>

      <p className="mt-3 whitespace-pre-wrap break-words text-[0.9375rem] leading-relaxed">{post.body}</p>

      <PostActions
        postId={post.id}
        likes={post.likes}
        liked={post.liked}
        replyCount={post.replyCount}
        replies={post.replies}
      />
    </Card>
  );
}
