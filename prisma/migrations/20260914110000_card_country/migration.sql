-- A card is sold in one country edition.
--
-- Every card loaded so far came from SportyBet Ghana and was priced in cedis,
-- so GH is the correct backfill for existing rows.
ALTER TABLE "bookings" ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'GH';

CREATE INDEX "bookings_countryCode_category_bookingDate_isActive_idx"
  ON "bookings"("countryCode", "category", "bookingDate", "isActive");
