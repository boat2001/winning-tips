import { requireAdmin } from "@/lib/auth/authorization";
import { getDatabase } from "@/lib/db/client";
import { moderatePost } from "@/app/(app)/community/actions";
export const dynamic="force-dynamic";
export default async function CommunityModerationPage(){
  await requireAdmin();
  const posts=await getDatabase().communityPost.findMany({where:{OR:[{status:"PENDING"},{reports:{some:{}}}]},orderBy:{createdAt:"asc"},take:50,include:{author:{select:{username:true}},reports:{select:{reason:true,createdAt:true}}}});
  return <div className="space-y-5 p-5"><h1>Community moderation</h1><p>Review pending and reported posts. Every decision requires a reason and is audited.</p>{posts.length?posts.map(post=><article key={post.id} className="rounded-xl border border-line p-5"><p className="text-sm">@{post.author.username} · {post.status}</p><p className="my-4 whitespace-pre-wrap break-words">{post.body}</p>{post.reports.map((report,i)=><p key={i} className="my-2 text-sm">Report: {report.reason}</p>)}<form action={moderatePost} className="flex flex-wrap items-end gap-3"><input type="hidden" name="postId" value={post.id}/><label className="flex-1">Reason<input name="reason" required minLength={5} maxLength={500} className="block w-full rounded border border-line p-2"/></label><button name="status" value="PUBLISHED" className="btn btn-primary">Approve</button><button name="status" value="HIDDEN" className="btn btn-ghost">Hide</button></form></article>):<p>No posts need review.</p>}</div>;
}
