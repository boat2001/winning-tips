-- Cards can now arrive from a published source rather than only from an admin
-- typing a booking code. A collected card waits in review until a human sells
-- it, so existing cards default to APPROVED: they were all loaded by hand.
CREATE TYPE "ReviewState" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

ALTER TABLE "bookings"
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "reviewState" "ReviewState" NOT NULL DEFAULT 'APPROVED';

CREATE INDEX "bookings_reviewState_bookingDate_idx" ON "bookings"("reviewState", "bookingDate");
CREATE INDEX "bookings_source_bookingDate_idx" ON "bookings"("source", "bookingDate");
