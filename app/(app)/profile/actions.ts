"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/authorization";
import { recordAudit } from "@/lib/auth/audit";
import { getDatabase } from "@/lib/db/client";
import { countries, isCountryCode, isDesignPreview } from "@/lib/config/countries";
import { z } from "zod";
import { identitySchema } from "@/lib/auth/validation";
import { isProtectedSuperAdminUsername } from "@/lib/auth/protected-admins";
import { isUniqueConstraintError } from "@/lib/db/errors";

type ActionState = { error?: string; success?: string };

/**
 * The member changes their own display name and handle.
 *
 * Both are written in one transaction with the audit row, and the handle is
 * checked against the protected-admin list and the unique index — a handle is
 * a public identity, so taking someone else another member is using, or one
 * reserved for staff, has to fail rather than half-succeed.
 */
export async function updateIdentity(_state: ActionState, form: FormData): Promise<ActionState> {
  void _state;
  if (isDesignPreview()) return { error: "Profile details cannot be changed in the design preview." };
  const user = await requireUser("/profile");
  const parsed = identitySchema.safeParse({ displayName: form.get("displayName"), username: form.get("username") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your profile details." };
  const { displayName, username } = parsed.data;
  if (username !== user.username && isProtectedSuperAdminUsername(username)) return { error: "That handle is unavailable." };
  try {
    await getDatabase().$transaction(async tx => {
      await tx.user.update({ where: { id: user.id }, data: { displayName, username } });
      await tx.auditLog.create({ data: { actorId: user.id, action: "PROFILE_UPDATED", entityType: "User", entityId: user.id, metadata: { displayName, username } } });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: "That handle is already taken. Try another one." };
    return { error: "Your profile could not be saved. Please try again." };
  }
  revalidatePath("/profile"); revalidatePath("/home"); revalidatePath("/account"); revalidatePath("/community");
  return { success: "Profile updated." };
}
const preferenceSchema = z.object({ countryCode: z.string().refine((code) => isCountryCode(code) && countries[code].enabled, "Choose a country edition that is live."), sports: z.array(z.enum(["football","basketball","tennis"])).max(3), notifications: z.boolean() });
export async function savePreferences(_state: { error?: string; success?: string }, form: FormData): Promise<{error?: string; success?: string}> {
  void _state;
  if (isDesignPreview()) return { error: "Preferences cannot be changed in the design preview." };
  const user = await requireUser("/profile");
  const parsed = preferenceSchema.safeParse({countryCode:form.get("countryCode"),sports:form.getAll("sports"),notifications:form.get("notifications")==="on"});
  if (!parsed.success) return {error:"Choose a supported country and valid sports."};
  try {
    await getDatabase().$transaction(async tx => {
      await tx.userPreference.upsert({where:{userId:user.id},create:{userId:user.id,...parsed.data},update:parsed.data});
      await tx.auditLog.create({data:{actorId:user.id,action:"PREFERENCES_UPDATED",entityType:"UserPreference",entityId:user.id,metadata:parsed.data}});
    });
    // The edition changes which cards and currency the member sees.
    revalidatePath("/profile"); revalidatePath("/vip"); revalidatePath("/home"); return {success:"Preferences saved."};
  } catch { return {error:"Preferences could not be saved. Please try again."}; }
}
export async function signOutOtherDevices(_state: ActionState): Promise<ActionState> {
  void _state;
  if (isDesignPreview()) return { error: "Sessions cannot be revoked in the design preview." };
  const user = await requireUser("/profile");
  try {
    // Session revocation invalidates every device, this one included; the
    // member signs back in afterwards.
    const { revokeAllUserSessions } = await import("@/lib/auth/session");
    await revokeAllUserSessions(user.id);
    await recordAudit({ actorId: user.id, action: "SESSIONS_REVOKED", entityType: "User", entityId: user.id });
  } catch {
    return { error: "Sessions could not be revoked. Please try again." };
  }
  return { success: "All sessions revoked. Sign in again to continue." };
}
