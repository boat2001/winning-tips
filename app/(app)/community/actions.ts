"use server";
import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin } from "@/lib/auth/authorization";
import { getDatabase } from "@/lib/db/client";
import { z } from "zod";
import { isDesignPreview } from "@/lib/config/countries";
type State = {error?:string;success?:string};
const postSchema = z.object({body:z.string().trim().min(10,"Write at least 10 characters.").max(2000),sport:z.enum(["football","basketball","tennis",""]).optional(),parentId:z.string().max(100).optional()});
export async function createPost(_state:State, form:FormData):Promise<State> {
  if (isDesignPreview()) return {error:"Publishing is disabled in the design preview."};
  const user = await requireUser("/community");
  const parsed = postSchema.safeParse({body:form.get("body"),sport:form.get("sport") ?? "",parentId:form.get("parentId") ?? undefined});
  if (!parsed.success) return {error:parsed.error.issues[0]?.message ?? "Check your post."};
  try {
    const db = getDatabase();
    const recent = await db.communityPost.count({where:{authorId:user.id,createdAt:{gte:new Date(Date.now()-60000)}}});
    if (recent >= 3) return {error:"Please wait a minute before posting again."};
    if (parsed.data.parentId && !await db.communityPost.findFirst({where:{id:parsed.data.parentId,status:"PUBLISHED",parentId:null}})) return {error:"This discussion is unavailable."};
    await db.$transaction(async tx => {
      const post = await tx.communityPost.create({data:{authorId:user.id,body:parsed.data.body,sport:parsed.data.sport || null,parentId:parsed.data.parentId || null}});
      await tx.auditLog.create({data:{actorId:user.id,action:"COMMUNITY_POST_SUBMITTED",entityType:"CommunityPost",entityId:post.id}});
    });
    revalidatePath("/community"); revalidatePath("/admin/community");
    return {success:"Submitted for review. Your post will appear after moderation."};
  } catch {return {error:"Your post could not be submitted. Please try again."};}
}
export async function reactToPost(postId:string, liked:boolean):Promise<State> {
  if (isDesignPreview()) return {error:"Reactions are disabled in the design preview."};
  const user = await requireUser("/community");
  try {
    const db = getDatabase();
    if (!await db.communityPost.findFirst({where:{id:postId,status:"PUBLISHED"}})) return {error:"Post unavailable."};
    if(liked) await db.communityReaction.upsert({where:{userId_postId:{userId:user.id,postId}},create:{userId:user.id,postId},update:{}});
    else await db.communityReaction.deleteMany({where:{userId:user.id,postId}});
    revalidatePath("/community"); return {success:"Reaction updated."};
  } catch {return {error:"Could not update your reaction."};}
}
export async function reportPost(_state:State, form:FormData):Promise<State> {
  if (isDesignPreview()) return {error:"Reports are disabled in the design preview."};
  const user = await requireUser("/community");
  const parsed = z.object({postId:z.string().min(1).max(100),reason:z.string().trim().min(5).max(500)}).safeParse(Object.fromEntries(form));
  if(!parsed.success) return {error:"Please explain the issue in 5–500 characters."};
  try {
    const db = getDatabase();
    if (!await db.communityPost.findFirst({where:{id:parsed.data.postId,status:"PUBLISHED"}})) return {error:"Post unavailable."};
    await db.communityReport.upsert({where:{userId_postId:{userId:user.id,postId:parsed.data.postId}},create:{userId:user.id,...parsed.data},update:{reason:parsed.data.reason}});
    revalidatePath("/admin/community");return {success:"Report received. A moderator will review it."};
  } catch {return {error:"Could not send your report. Please try again."};}
}
export async function moderatePost(form:FormData) {
  const user = await requireAdmin();
  const parsed = z.object({postId:z.string().min(1).max(100),status:z.enum(["PUBLISHED","HIDDEN"]),reason:z.string().trim().min(5).max(500)}).parse(Object.fromEntries(form));
  await getDatabase().$transaction(async tx => {
    const previous = await tx.communityPost.findUniqueOrThrow({where:{id:parsed.postId}});
    await tx.communityPost.update({where:{id:parsed.postId},data:{status:parsed.status}});
    await tx.auditLog.create({data:{actorId:user.id,action:"COMMUNITY_POST_MODERATED",entityType:"CommunityPost",entityId:parsed.postId,metadata:{before:previous.status,after:parsed.status,reason:parsed.reason}}});
  });
  revalidatePath("/admin/community");revalidatePath("/community");
}
