CREATE TYPE "SlipCategory" AS ENUM ('FREE', 'VIP1', 'VIP2', 'VIP3');

ALTER TABLE "bookings"
  ADD COLUMN "category" "SlipCategory" NOT NULL DEFAULT 'FREE',
  ADD COLUMN "shareUrl" TEXT,
  ADD COLUMN "totalOdds" DECIMAL(12,2),
  ADD COLUMN "deadline" TIMESTAMP(3);

CREATE UNIQUE INDEX "bookings_code_key" ON "bookings"("code");
CREATE INDEX "bookings_category_bookingDate_isActive_idx"
  ON "bookings"("category", "bookingDate", "isActive");

ALTER TABLE "predictions" ADD COLUMN "bookingId" TEXT;
CREATE INDEX "predictions_bookingId_idx" ON "predictions"("bookingId");
ALTER TABLE "predictions"
  ADD CONSTRAINT "predictions_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "bookings"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
