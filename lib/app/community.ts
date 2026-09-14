import "server-only";
import { getDatabase } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
export async function getCommunityData(sport?: string, page = 1) {
  try {
    const user = await getCurrentUser();
    const db = getDatabase();
    const where = {status:"PUBLISHED",parentId:null,...(sport ? {sport} : {})};
    const [posts, total, memberCount] = await Promise.all([
      db.communityPost.findMany({where,orderBy:{createdAt:"desc"},take:10,skip:(page-1)*10,include:{
        author:{select:{username:true,displayName:true}}, _count:{select:{reactions:true,replies:{where:{status:"PUBLISHED"}}}},
        reactions:{where:{userId:user?.id ?? ""},select:{userId:true}},
        replies:{where:{status:"PUBLISHED"},orderBy:{createdAt:"asc"},take:20,include:{author:{select:{username:true}}}},
      }}),
      db.communityPost.count({where}), db.user.count({where:{isActive:true}}),
    ]);
    return {posts,total,memberCount,unavailable:false};
  } catch { return {posts:[],total:0,memberCount:0,unavailable:true}; }
}
