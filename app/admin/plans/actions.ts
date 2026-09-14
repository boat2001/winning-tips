"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAudit } from "@/lib/auth/audit";
import { requireManagementAdmin } from "@/lib/auth/authorization";
import { getDatabase } from "@/lib/db/client";
import { invalidateVipData } from "@/lib/cache/invalidate";

/** A tier in the VIP catalogue. The price here is the default for the next card;
 *  the card a member buys carries the price and sales state checkout reads. */
const planSchema = z.object({ name: z.string().trim().min(3).max(80), description: z.string().trim().min(10).max(300), price: z.coerce.number().positive().max(100000), deckId: z.string().min(1, "Choose the deck this tier publishes to."), sortOrder: z.coerce.number().int().min(0).max(999), isActive: z.string().optional().transform((value) => value === "on"), isSoldOut: z.string().optional().transform((value) => value === "on") });

function readPlan(formData: FormData) { return planSchema.parse(Object.fromEntries(formData)); }
function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

export async function createPlan(formData: FormData) {
  const actor = await requireManagementAdmin();
  const input = readPlan(formData);
  const plan = await getDatabase().plan.create({ data: { name: input.name, slug: `${slugify(input.name)}-${Date.now().toString(36)}`, description: input.description, priceMinor: Math.round(input.price * 100), currency: "GHS", deckId: input.deckId, sortOrder: input.sortOrder, isActive: input.isActive, isSoldOut: input.isSoldOut } });
  await recordAudit({ actorId: actor.id, action: "PLAN_CREATED", entityType: "Plan", entityId: plan.id });
  invalidateVipData();
  revalidatePath("/vip"); revalidatePath("/admin/plans");
}

export async function updatePlan(formData: FormData) {
  const actor = await requireManagementAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const input = readPlan(formData);
  await getDatabase().plan.update({ where: { id }, data: { name: input.name, description: input.description, priceMinor: Math.round(input.price * 100), deckId: input.deckId, sortOrder: input.sortOrder, isActive: input.isActive, isSoldOut: input.isSoldOut } });
  await recordAudit({ actorId: actor.id, action: "PLAN_UPDATED", entityType: "Plan", entityId: id, metadata: { priceMinor: Math.round(input.price * 100), isActive: input.isActive, isSoldOut: input.isSoldOut } });
  invalidateVipData();
  revalidatePath("/vip"); revalidatePath("/admin/plans");
}
