-- A record of every scheduled job run, so failures surface in admin.
CREATE TYPE "AutomationStatus" AS ENUM ('SUCCEEDED', 'PARTIAL', 'FAILED', 'SKIPPED');

CREATE TABLE "automation_runs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "job" TEXT NOT NULL,
  "status" "AutomationStatus" NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "summary" JSONB,
  "error" TEXT
);

CREATE INDEX "automation_runs_job_startedAt_idx" ON "automation_runs"("job", "startedAt");
