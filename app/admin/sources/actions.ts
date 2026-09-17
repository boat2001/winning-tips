"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAudit } from "@/lib/auth/audit";
import { requireManagementAdmin } from "@/lib/auth/authorization";
import { recordRun } from "@/lib/automation/runs";
import { invalidateBookingData } from "@/lib/cache/invalidate";
import { getDatabase } from "@/lib/db/client";
import { ingestEnabledSources } from "@/lib/sources/ingest";

/**
 * The review queue's two decisions, and the collection run behind it.
 *
 * Approving is the moment a collected card becomes something a member can see:
 * until then its picks are drafts and the card is inactive. Rejecting keeps the
 * row — a refused card is part of the source's history, and deleting it would
 * quietly improve the record we judge that source by.
 */
function refreshCollected() {
  invalidateBookingData();
  revalidatePath("/admin/sources");
  revalidatePath("/admin/games");
  revalidatePath("/tips");
}

export async function approveCollectedCard(formData: FormData) {
  const actor = await requireManagementAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const database = getDatabase();

  const card = await database.booking.findFirst({ where: { id, reviewState: "PENDING_REVIEW", deletedAt: null }, select: { id: true, code: true, source: true, category: true } });
  if (!card) throw new Error("That collected card is no longer waiting for review.");

  await database.$transaction(async (transaction) => {
    await transaction.booking.update({
      where: { id },
      // A free card goes on the board; a VIP card still opens for sales in
      // Games Control, where its price is set.
      data: { reviewState: "APPROVED", isActive: true, isSoldOut: card.category !== "FREE" },
    });
    await transaction.prediction.updateMany({
      where: { bookingId: id, status: "DRAFT" },
      data: { status: "PUBLISHED", publishAt: new Date() },
    });
  });

  await recordAudit({ actorId: actor.id, action: "COLLECTED_CARD_APPROVED", entityType: "Booking", entityId: id, metadata: { code: card.code, source: card.source } });
  refreshCollected();
}

export async function rejectCollectedCard(formData: FormData) {
  const actor = await requireManagementAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const reason = z.string().trim().max(300).optional().parse(formData.get("reason") ?? undefined);

  const updated = await getDatabase().booking.updateMany({
    where: { id, reviewState: "PENDING_REVIEW", deletedAt: null },
    data: { reviewState: "REJECTED", isActive: false, isSoldOut: true },
  });
  if (updated.count !== 1) throw new Error("That collected card is no longer waiting for review.");

  await recordAudit({ actorId: actor.id, action: "COLLECTED_CARD_REJECTED", entityType: "Booking", entityId: id, metadata: { reason: reason ?? null } });
  refreshCollected();
}

export async function collectFromSources() {
  const actor = await requireManagementAdmin();

  const run = await recordRun("ingest-sources", async () => {
    const summary = await ingestEnabledSources();
    return { status: summary.failed > 0 && summary.created + summary.pendingReview === 0 ? "PARTIAL" : "SUCCEEDED", summary };
  });

  await recordAudit({ actorId: actor.id, action: "SOURCES_COLLECTED", entityType: "AutomationRun", entityId: run.id, metadata: { status: run.status } });
  refreshCollected();
}
