"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAudit } from "@/lib/auth/audit";
import { requireSuperAdmin } from "@/lib/auth/authorization";
import { getDatabase } from "@/lib/db/client";
import { isProtectedSuperAdminUsername } from "@/lib/auth/protected-admins";

const roleSchema = z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR", "TIPSTER", "USER"]);

export async function updateUserAccess(formData: FormData) {
  const actor = await requireSuperAdmin();
  const userId = z.string().min(1).parse(formData.get("userId"));
  const role = roleSchema.parse(formData.get("role"));
  const isActive = formData.get("isActive") === "true";
  if (userId === actor.id && (!isActive || role !== "SUPER_ADMIN")) throw new Error("You cannot remove your own super-admin access.");
  const database = getDatabase();
  const target = await database.user.findUnique({ where: { id: userId }, select: { username: true } });
  if (!target) throw new Error("User not found.");
  if (isProtectedSuperAdminUsername(target.username) && (!isActive || role !== "SUPER_ADMIN")) throw new Error("This protected super-admin account cannot be deactivated or demoted from the admin panel.");
  await database.user.update({ where: { id: userId }, data: { role, isActive } });
  await recordAudit({ actorId: actor.id, action: "USER_ACCESS_UPDATED", entityType: "User", entityId: userId, metadata: { role, isActive } });
  revalidatePath("/admin/users");
}
