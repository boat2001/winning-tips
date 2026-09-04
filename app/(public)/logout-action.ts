"use server";

import { redirect } from "next/navigation";
import { recordAudit } from "@/lib/auth/audit";
import { requireUser } from "@/lib/auth/authorization";
import { revokeCurrentSession } from "@/lib/auth/session";

export async function logoutAction() {
  const user = await requireUser();
  await revokeCurrentSession();
  await recordAudit({ actorId: user.id, action: "USER_LOGGED_OUT", entityType: "Session" });
  redirect("/");
}
