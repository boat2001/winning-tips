"use client";
import { useActionState, useState, useTransition } from "react";
import { Flag, MessageCircle, ThumbsUp } from "lucide-react";
import { createPost, reactToPost, reportPost } from "@/app/(app)/community/actions";
import { ShareButton } from "@/components/ui/share-button";

export function PostComposer({ parentId }: { parentId?: string }) {
  const [state, action, pending] = useActionState(createPost, {});
  return (
    <form action={action} className="space-y-3">
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <label className="block text-sm font-semibold">
        <span className={parentId ? "" : "sr-only"}>{parentId ? "Your reply" : "Your post"}</span>
        <textarea
          required
          name="body"
          minLength={10}
          maxLength={2000}
          rows={3}
          placeholder={parentId ? "Add to the discussion…" : "Share your analysis and the evidence behind it…"}
          className="mt-2 block w-full rounded-control border border-card-line bg-card-2 p-3 text-sm font-normal text-ink-900 placeholder:text-ink-400"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        {!parentId && (
          <label className="flex items-center gap-2 text-sm font-medium">
            Topic
            <select name="sport" className="min-h-11 rounded-control border border-card-line bg-card-2 px-3 text-ink-900">
              <option value="">General</option>
              <option value="football">Football</option>
              <option value="basketball">Basketball</option>
              <option value="tennis">Tennis</option>
            </select>
          </label>
        )}
        <button disabled={pending} className="ml-auto min-h-11 rounded-control bg-blue-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50">
          {pending ? "Submitting…" : parentId ? "Reply" : "Submit for review"}
        </button>
      </div>
      <p className="text-xs text-ink-500">
        Be respectful. No guaranteed-win claims, solicitation or private information. Posts are reviewed before they appear.
      </p>
      {state.error && <p role="alert" className="text-sm text-red-500">{state.error}</p>}
      {state.success && <p role="status" className="text-sm text-green-600">{state.success}</p>}
    </form>
  );
}

function ReactionButton({ postId, count, initialLiked }: { postId: string; count: number; initialLiked: boolean }) {
  const [liked, setLiked] = useState(initialLiked);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <span className="relative">
      <button
        type="button"
        aria-pressed={liked}
        disabled={pending}
        className="post-action"
        onClick={() =>
          start(async () => {
            const result = await reactToPost(postId, !liked);
            if (result.error) setError(result.error);
            else {
              setLiked(!liked);
              setError("");
            }
          })
        }
      >
        <ThumbsUp className={`size-[1.125rem] ${liked ? "fill-blue-500 text-blue-600" : ""}`} aria-hidden />
        <span className="tabular">{count + Number(liked) - Number(initialLiked)}</span>
        <span className="sr-only">likes</span>
      </button>
      {error && <span role="alert" className="absolute left-0 top-full z-10 w-56 rounded-lg bg-white p-2 text-xs text-red-500 shadow-raised">{error}</span>}
    </span>
  );
}

function ReportForm({ postId }: { postId: string }) {
  const [state, action, pending] = useActionState(reportPost, {});
  return (
    <form action={action} className="space-y-2 rounded-control bg-card-2 p-3">
      <input type="hidden" name="postId" value={postId} />
      <label className="block text-sm font-semibold">
        What&apos;s wrong with this post?
        <textarea required name="reason" minLength={5} maxLength={500} rows={2} className="mt-1 block w-full rounded-control border border-card-line bg-white p-2 text-sm font-normal" />
      </label>
      <button disabled={pending} className="min-h-11 rounded-control bg-navy-700 px-4 text-sm font-semibold text-white disabled:opacity-50">
        {pending ? "Sending…" : "Send report"}
      </button>
      {state.error && <p role="alert" className="text-sm text-red-500">{state.error}</p>}
      {state.success && <p role="status" className="text-sm text-green-600">{state.success}</p>}
    </form>
  );
}

export type ReplyView = { id: string; username: string; body: string };

/**
 * One action row under a post: like, replies, share, and report behind an
 * icon. These were four stacked rows — a like/share line, a replies
 * disclosure, then a separate "Report this post" disclosure — which made every
 * post read as a form. Replies and the report form open beneath the row, one
 * at a time.
 */
export function PostActions({
  postId,
  likes,
  liked,
  replies,
  replyCount,
}: {
  postId: string;
  likes: number;
  liked: boolean;
  replies: readonly ReplyView[];
  replyCount: number;
}) {
  const [open, setOpen] = useState<"replies" | "report" | null>(null);
  const toggle = (panel: "replies" | "report") => setOpen((current) => (current === panel ? null : panel));

  return (
    <>
      <div className="mt-3 flex items-center gap-1 border-t border-card-line pt-1">
        <ReactionButton postId={postId} count={likes} initialLiked={liked} />
        <button type="button" className="post-action" aria-expanded={open === "replies"} aria-controls={`${postId}-replies`} onClick={() => toggle("replies")}>
          <MessageCircle aria-hidden className="size-[1.125rem]" />
          <span className="tabular">{replyCount}</span>
          <span>{replyCount === 1 ? "reply" : "replies"}</span>
        </button>
        <ShareButton variant="inline" title="Winning Tips discussion" path={`/community#${postId}`} />
        <button
          type="button"
          className="post-action ml-auto text-ink-400"
          aria-expanded={open === "report"}
          aria-controls={`${postId}-report`}
          aria-label="Report this post"
          title="Report this post"
          onClick={() => toggle("report")}
        >
          <Flag aria-hidden className="size-4" />
        </button>
      </div>

      {open === "replies" && (
        <div id={`${postId}-replies`} className="mt-2 space-y-3">
          {replies.length > 0 ? (
            <ul className="space-y-2">
              {replies.map((reply) => (
                <li key={reply.id} className="rounded-control bg-card-2 p-3">
                  <strong className="text-sm">@{reply.username}</strong>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{reply.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">No replies yet. Start the conversation.</p>
          )}
          <PostComposer parentId={postId} />
        </div>
      )}

      {open === "report" && (
        <div id={`${postId}-report`} className="mt-2">
          <ReportForm postId={postId} />
        </div>
      )}
    </>
  );
}
