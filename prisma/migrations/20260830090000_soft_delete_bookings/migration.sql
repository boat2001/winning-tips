ALTER TABLE "bookings" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "bookings_deletedAt_idx" ON "bookings"("deletedAt");
