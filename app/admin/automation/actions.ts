"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAudit } from "@/lib/auth/audit";
import { requireManagementAdmin } from "@/lib/auth/authorization";
import { setAutomationPaused } from "@/lib/automation/controls";
import { sendDailyDigest } from "@/lib/automation/daily-digest";
import { runDailyAutomation } from "@/lib/automation/daily";
import { publishScheduledPredictions } from "@/lib/automation/publish-scheduled";
import { recordRun } from "@/lib/automation/runs";
import { settleFinishedPredictions } from "@/lib/automation/settle-results";
import { ingestEnabledSources } from "@/lib/sources/ingest";
import { runFixtureSync } from "@/lib/automation/sync-run";
import { invalidateBookingData, invalidatePredictionData } from "@/lib/cache/invalidate";

/**
 * On-demand runs of the scheduled jobs.
 *
 * Every button here calls the same function the cron calls, and every run is
 * recorded in the same history, so a run started by hand is indistinguishable
 * from a scheduled one afterwards — except for the audit row naming who did it.
 *
 * Deliberately not gated on the pause switch: pausing holds the schedule, and an
 * admin standing at the panel is the one exception the switch exists to allow.
 */
const jobSchema = z.enum(["publish-scheduled", "settle-results", "telegram-digest", "sync-fixtures", "ingest-sources", "nightly"]);

export async function runAutomationJob(formData: FormData) {
  const actor = await requireManagementAdmin();
  const job = jobSchema.parse(formData.get("job"));

  let status = "SUCCEEDED";
  let resultsChanged = false;

  if (job === "nightly") {
    const result = await runDailyAutomation();
    status = result.failed === 0 ? "SUCCEEDED" : result.failed === result.runs.length ? "FAILED" : "PARTIAL";
    resultsChanged = result.resultsChanged;
  } else if (job === "publish-scheduled") {
    const run = await recordRun("publish-scheduled", async () => ({ status: "SUCCEEDED", summary: await publishScheduledPredictions() }));
    status = run.status;
    resultsChanged = (run.summary?.published ?? 0) > 0;
  } else if (job === "settle-results") {
    const run = await recordRun("settle-results", async () => ({ status: "SUCCEEDED", summary: await settleFinishedPredictions() }));
    status = run.status;
    resultsChanged = run.summary ? run.summary.won + run.summary.lost + run.summary.void > 0 : false;
  } else if (job === "telegram-digest") {
    const run = await recordRun("telegram-digest", async () => {
      const summary = await sendDailyDigest();
      return { status: summary.status === "skipped" ? "SKIPPED" : "SUCCEEDED", summary };
    });
    status = run.status;
  } else if (job === "ingest-sources") {
    const run = await recordRun("ingest-sources", async () => {
      const summary = await ingestEnabledSources();
      return { status: summary.failed > 0 && summary.created + summary.pendingReview === 0 ? "PARTIAL" : "SUCCEEDED", summary };
    });
    status = run.status;
    resultsChanged = (run.summary?.created ?? 0) > 0;
  } else {
    const run = await recordRun("sync-fixtures", async () => {
      const summary = await runFixtureSync();
      return { status: summary.failed > 0 && summary.synced === 0 ? "SKIPPED" : "SUCCEEDED", summary };
    });
    status = run.status;
    resultsChanged = true;
  }

  if (resultsChanged) {
    invalidatePredictionData();
    invalidateBookingData();
  }

  await recordAudit({ actorId: actor.id, action: "AUTOMATION_JOB_RUN", entityType: "AutomationRun", metadata: { job, status } });
  revalidatePath("/admin/automation");
}

export async function setAutomationPause(formData: FormData) {
  const actor = await requireManagementAdmin();
  const paused = z.enum(["true", "false"]).parse(formData.get("paused")) === "true";
  await setAutomationPaused(paused);
  await recordAudit({ actorId: actor.id, action: paused ? "AUTOMATION_PAUSED" : "AUTOMATION_RESUMED", entityType: "Setting", metadata: { paused } });
  revalidatePath("/admin/automation");
}
