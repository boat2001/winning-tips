"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/db/client";
import { deckInputSchema, predictionInputSchema } from "@/lib/predictions/validation";
import { requireAdmin, requireManagementAdmin } from "@/lib/auth/authorization";
import { recordAudit } from "@/lib/auth/audit";
import { invalidatePredictionData, invalidateVipData } from "@/lib/cache/invalidate";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function readPrediction(formData: FormData) {
  return predictionInputSchema.parse({
    fixtureId: formData.get("fixtureId"),
    deckId: formData.get("deckId"),
    market: formData.get("market"),
    selection: formData.get("selection"),
    odds: formData.get("odds"),
    confidence: formData.get("confidence"),
    analysis: formData.get("analysis"),
    visibility: formData.get("visibility"),
    status: formData.get("status"),
    result: formData.get("result"),
  });
}

export async function createPrediction(formData: FormData) {
  const user = await requireAdmin();
  const input = readPrediction(formData);
  const fixture = await getDatabase().fixture.findUniqueOrThrow({ where: { id: input.fixtureId }, select: { externalId: true } });
  const slug = `${slugify(fixture.externalId)}-${slugify(input.selection)}-${Date.now().toString(36)}`;
  await getDatabase().prediction.create({
    data: {
      ...input,
      odds: input.odds.toFixed(2),
      slug,
      publishAt: input.status === "PUBLISHED" ? new Date() : null,
      createdById: user.id,
    },
  });
  await recordAudit({ actorId: user.id, action: "PREDICTION_CREATED", entityType: "Prediction", entityId: slug });
  invalidatePredictionData();
  revalidatePath("/");
  revalidatePath("/predictions");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/games");
  redirect("/admin/predictions");
}

export async function updatePrediction(formData: FormData) {
  const user = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const input = readPrediction(formData);
  await getDatabase().prediction.update({
    where: { id },
    data: {
      ...input,
      odds: input.odds.toFixed(2),
      publishAt: input.status === "PUBLISHED" ? new Date() : null,
    },
  });
  await recordAudit({ actorId: user.id, action: "PREDICTION_UPDATED", entityType: "Prediction", entityId: id });
  invalidatePredictionData();
  revalidatePath("/");
  revalidatePath("/predictions");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/games");
  redirect("/admin/games");
}

export async function togglePredictionPublication(formData: FormData) {
  const user = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const nextStatus = formData.get("nextStatus") === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  await getDatabase().prediction.update({ where: { id }, data: { status: nextStatus, publishAt: nextStatus === "PUBLISHED" ? new Date() : null } });
  await recordAudit({ actorId: user.id, action: `PREDICTION_${nextStatus}`, entityType: "Prediction", entityId: id });
  invalidatePredictionData();
  revalidatePath("/");
  revalidatePath("/predictions");
  revalidatePath("/admin/predictions");
}

export async function createDeck(formData: FormData) {
  const user = await requireManagementAdmin();
  const input = deckInputSchema.parse({
    name: formData.get("name"),
    description: formData.get("description"),
    icon: formData.get("icon"),
    visualIdentifier: formData.get("visualIdentifier"),
    isPremium: formData.get("isPremium") === "on",
    sortOrder: formData.get("sortOrder") || 0,
  });
  const baseSlug = slugify(input.name);
  const deck = await getDatabase().deck.create({ data: { ...input, slug: `${baseSlug}-${Date.now().toString(36)}` } });
  await recordAudit({ actorId: user.id, action: "DECK_CREATED", entityType: "Deck", entityId: deck.id });
  invalidateVipData();
  revalidatePath("/admin/decks");
  revalidatePath("/vip");
}

export async function toggleDeck(formData: FormData) {
  const user = await requireManagementAdmin();
  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("isActive") === "true";
  await getDatabase().deck.update({ where: { id }, data: { isActive } });
  await recordAudit({ actorId: user.id, action: isActive ? "DECK_ACTIVATED" : "DECK_DEACTIVATED", entityType: "Deck", entityId: id });
  invalidateVipData();
  revalidatePath("/admin/decks");
  revalidatePath("/vip");
}

export async function updatePredictionResult(formData: FormData) {
  const user = await requireAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const result = z.enum(["PENDING", "WON", "LOST", "VOID", "PUSH", "CANCELLED"]).parse(formData.get("result"));
  const prediction = await getDatabase().prediction.update({ where: { id }, data: { result }, select: { id: true, slug: true } });
  after(recordAudit({ actorId: user.id, action: "PREDICTION_RESULT_UPDATED", entityType: "Prediction", entityId: prediction.id, metadata: { result, slug: prediction.slug } }));
  invalidatePredictionData();
  revalidatePath("/"); revalidatePath("/predictions"); revalidatePath("/admin/results"); revalidatePath("/admin/bookings"); revalidatePath("/admin/games"); revalidatePath(`/predictions/${prediction.slug}`);
}
