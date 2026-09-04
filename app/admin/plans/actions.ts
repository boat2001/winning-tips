"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAudit } from "@/lib/auth/audit";
import { requireManagementAdmin } from "@/lib/auth/authorization";
import { getDatabase } from "@/lib/db/client";
import { invalidateVipData } from "@/lib/cache/invalidate";

const planSchema = z.object({ name: z.string().trim().min(3).max(80), description: z.string().trim().min(10).max(300), price: z.coerce.number().positive().max(100000), durationDays: z.coerce.number().int().min(1).max(365), scope: z.enum(["ALL_PREMIUM", "DECK"]), deckId: z.string().optional().transform((value) => value || null), sortOrder: z.coerce.number().int().min(0).max(999), isActive: z.string().optional().transform((value) => value === "on"), isSoldOut: z.string().optional().transform((value) => value === "on") }).refine((data) => data.scope !== "DECK" || data.deckId, { message: "Choose a Deck for Deck-specific access." });

function readPlan(formData: FormData) { return planSchema.parse(Object.fromEntries(formData)); }
function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

export async function createPlan(formData: FormData) {
  const actor = await requireManagementAdmin();
  const input = readPlan(formData);
  const plan = await getDatabase().plan.create({ data: { name: input.name, slug: `${slugify(input.name)}-${Date.now().toString(36)}`, description: input.description, priceMinor: Math.round(input.price * 100), currency: "GHS", durationDays: input.durationDays, scope: input.scope, deckId: input.scope === "DECK" ? input.deckId : null, sortOrder: input.sortOrder, isActive: input.isActive, isSoldOut: input.isSoldOut } });
  await recordAudit({ actorId: actor.id, action: "PLAN_CREATED", entityType: "Plan", entityId: plan.id });
  invalidateVipData();
  revalidatePath("/vip"); revalidatePath("/admin/plans");
}

export async function updatePlan(formData: FormData) {
  const actor = await requireManagementAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const input = readPlan(formData);
  await getDatabase().plan.update({ where: { id }, data: { name: input.name, description: input.description, priceMinor: Math.round(input.price * 100), durationDays: input.durationDays, scope: input.scope, deckId: input.scope === "DECK" ? input.deckId : null, sortOrder: input.sortOrder, isActive: input.isActive, isSoldOut: input.isSoldOut } });
  await recordAudit({ actorId: actor.id, action: "PLAN_UPDATED", entityType: "Plan", entityId: id, metadata: { priceMinor: Math.round(input.price * 100), durationDays: input.durationDays, isActive: input.isActive, isSoldOut: input.isSoldOut } });
  invalidateVipData();
  revalidatePath("/vip"); revalidatePath("/admin/plans");
}
