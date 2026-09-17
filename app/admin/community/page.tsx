import { requireAdmin } from "@/lib/auth/authorization";
import { getDatabase } from "@/lib/db/client";
import { moderatePost } from "@/app/(app)/community/actions";
export const dynamic="force-dynamic";
export default async function CommunityModerationPage(){
  await requireAdmin();
  const posts=await getDatabase().communityPost.findMany({where:{OR:[{status:"PENDING"},{reports:{some:{}}}]},orderBy:{createdAt:"asc"},take:50,include:{author:{select:{username:true}},reports:{select:{reason:true,createdAt:true}}}});
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-7 sm:py-10">
      <h1 className="text-3xl font-semibold tracking-[-0.045em] text-ink sm:text-4xl">Community moderation</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">Review pending and reported posts. Every decision requires a reason and is audited.</p>
      <div className="mt-7 space-y-3">
        {posts.length ? posts.map((post) => (
          <article key={post.id} className="rounded-sharp border border-line bg-white p-5">
            <p className="text-xs font-semibold text-muted">@{post.author.username} · {post.status}</p>
            <p className="my-3 whitespace-pre-wrap break-words text-sm text-ink">{post.body}</p>
            {post.reports.map((report, i) => <p key={i} className="my-2 rounded-sharp bg-lost-bg px-3 py-2 text-xs font-semibold text-lost">Report: {report.reason}</p>)}
            <form action={moderatePost} className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="postId" value={post.id} />
              <label className="min-w-56 flex-1 text-xs font-bold text-ink-2">Reason<input name="reason" required minLength={5} maxLength={500} className="mt-1.5 block h-10 w-full rounded-sharp border border-line px-3 text-sm" /></label>
              <button name="status" value="PUBLISHED" className="h-10 rounded-sharp bg-blue-500 px-4 text-xs font-semibold text-white hover:bg-blue-600">Approve</button>
              <button name="status" value="HIDDEN" className="h-10 rounded-sharp border border-line px-4 text-xs font-semibold text-ink-2 hover:border-lost hover:text-lost">Hide</button>
            </form>
          </article>
        )) : <p className="rounded-sharp border border-line bg-white p-8 text-center text-sm text-muted">No posts need review.</p>}
      </div>
    </main>
  );
}
