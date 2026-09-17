import type { AutomationRun } from "@prisma/client";
import { runAutomationJob, setAutomationPause } from "@/app/admin/automation/actions";
import { RunJobButton } from "@/components/admin/run-job-button";
import { requireAdmin } from "@/lib/auth/authorization";
import { isAutomationPaused } from "@/lib/automation/controls";
import { adminRoles } from "@/lib/auth/constants";
import { getDatabase } from "@/lib/db/client";

export const dynamic = "force-dynamic";

const JOBS = [
  { job: "sync-fixtures", label: "Fixture sync", note: "No runs recorded yet. Runs at 02:00 UTC." },
  { job: "ingest-sources", label: "Collect published slips", note: "No runs recorded yet. Decide collected cards in Sources." },
  { job: "publish-scheduled", label: "Publish scheduled picks" },
  { job: "settle-results", label: "Settle results" },
  { job: "telegram-digest", label: "Telegram digest" },
] as const;

const STATUS_STYLE: Record<string, string> = {
  SUCCEEDED: "bg-blue-wash text-blue",
  PARTIAL: "bg-hold-bg text-hold",
  SKIPPED: "bg-line text-muted",
  FAILED: "bg-lost-bg text-lost",
};

const timeFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" });

function duration(run: AutomationRun) {
  if (!run.finishedAt) return "Did not finish";
  const seconds = Math.max(0, Math.round((run.finishedAt.getTime() - run.startedAt.getTime()) / 1000));
  return seconds < 60 ? `${seconds}s` : `${Math.round(seconds / 60)}m`;
}

function describe(run: AutomationRun) {
  if (run.error) return run.error;
  if (!run.summary || typeof run.summary !== "object" || Array.isArray(run.summary)) return "—";
  return Object.entries(run.summary)
    .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
    .join(" · ");
}

/**
 * What the nightly automation did, and whether it worked.
 *
 * A failed night used to be invisible until a member noticed missing results.
 * The latest run of each job sits at the top, then the full recent history.
 */
export default async function AutomationPage() {
  const actor = await requireAdmin();
  // Editors and tipsters read the history; starting a job is a management act.
  const canRun = actor.role === adminRoles[0] || actor.role === adminRoles[1];
  const paused = await isAutomationPaused();

  let runs: AutomationRun[] = [];
  let unavailable = false;
  try {
    runs = await getDatabase().automationRun.findMany({ orderBy: { startedAt: "desc" }, take: 80 });
  } catch {
    unavailable = true;
  }

  const pendingReview = runs.find((run) => run.job === "settle-results" && !run.error);
  const leftForReview =
    pendingReview?.summary && typeof pendingReview.summary === "object" && !Array.isArray(pendingReview.summary)
      ? Number((pendingReview.summary as Record<string, unknown>).leftForReview ?? 0)
      : 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-7 sm:py-10">
      <h1 className="text-3xl font-semibold tracking-[-0.045em] text-ink sm:text-4xl">Automation</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Fixture sync runs at 02:00 UTC. Publishing, settlement and the Telegram digest run at 02:30 UTC, after scores arrive.
        Running a job here does exactly what the schedule does, and is recorded in the same history.
      </p>

      {canRun ? (
        <section className="mt-6 rounded-sharp border border-line bg-white p-5" aria-labelledby="automation-controls-heading">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 id="automation-controls-heading" className="text-base font-semibold text-ink">Controls</h2>
              <p className="mt-1 max-w-xl text-xs text-muted">
                {paused
                  ? "The nightly publish, settle and digest are on hold. Fixture sync still runs, so scores stay current."
                  : "The nightly jobs run on schedule. Hold them if you need to stop tonight's publishing and digest."}
              </p>
            </div>
            <form action={setAutomationPause}>
              <input type="hidden" name="paused" value={paused ? "false" : "true"} />
              <RunJobButton
                label={paused ? "Resume automation" : "Hold automation"}
                busyLabel={paused ? "Resuming…" : "Holding…"}
                tone="ghost"
              />
            </form>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
            <form action={runAutomationJob}>
              <input type="hidden" name="job" value="nightly" />
              <RunJobButton label="Run tonight's automation" busyLabel="Running publish, settle and digest…" />
            </form>
            <form action={runAutomationJob}>
              <input type="hidden" name="job" value="sync-fixtures" />
              <RunJobButton label="Sync fixtures now" busyLabel="Syncing fixtures…" tone="ghost" />
            </form>
          </div>
          <p className="mt-3 text-xs text-muted">Fixture sync calls the data provider and uses your API quota.</p>
        </section>
      ) : null}

      {unavailable ? (
        <p role="status" className="mt-6 rounded-sharp border-l-[3px] border-hold bg-hold-bg px-4 py-3 text-sm font-medium text-hold">
          Run history is unavailable. Apply the automation_runs migration with npm run db:deploy.
        </p>
      ) : null}

      {leftForReview > 0 ? (
        <p role="status" className="mt-6 rounded-sharp border-l-[3px] border-hold bg-hold-bg px-4 py-3 text-sm font-medium text-hold">
          {leftForReview} finished {leftForReview === 1 ? "pick needs" : "picks need"} a manual result. The engine only grades markets it can settle with certainty. Settle them in Results.
        </p>
      ) : null}

      <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {JOBS.map(({ job, label, ...rest }) => {
          const latest = runs.find((run) => run.job === job);
          return (
            <article key={job} className="rounded-sharp border border-line bg-white p-5">
              <h2 className="text-sm font-semibold text-ink">{label}</h2>
              {latest ? (
                <>
                  <span className={`mt-3 inline-block rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${STATUS_STYLE[latest.status]}`}>{latest.status}</span>
                  <p className="mt-2 text-xs text-muted">{timeFormat.format(latest.startedAt)}</p>
                </>
              ) : (
                <p className="mt-3 text-xs text-muted">{"note" in rest ? rest.note : "No runs recorded yet."}</p>
              )}
              {canRun ? (
                <form action={runAutomationJob} className="mt-4">
                  <input type="hidden" name="job" value={job} />
                  <RunJobButton label="Run now" tone="ghost" />
                </form>
              ) : null}
            </article>
          );
        })}
      </section>

      <div className="mt-7 overflow-x-auto rounded-sharp border border-line bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-paper text-xs uppercase tracking-wide text-faint">
            <tr>
              <th className="p-4">Job</th>
              <th className="p-4">Status</th>
              <th className="p-4">Started</th>
              <th className="p-4">Duration</th>
              <th className="p-4">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {runs.map((run) => (
              <tr key={run.id}>
                <td className="p-4 font-semibold text-ink-2">{run.job}</td>
                <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${STATUS_STYLE[run.status]}`}>{run.status}</span></td>
                <td className="p-4 text-muted">{timeFormat.format(run.startedAt)}</td>
                <td className="p-4 text-muted">{duration(run)}</td>
                {/* A job summary is long JSON; wrapped and capped so it stays
                    inside the table instead of running past the card. */}
                <td className={`max-w-[46ch] break-words p-4 ${run.error ? "text-lost" : "text-ink-2"}`}>{describe(run)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {runs.length === 0 && !unavailable ? <p className="p-8 text-center text-sm text-muted">No automation has run yet.</p> : null}
      </div>
    </main>
  );
}
