ALTER TABLE "payments" ADD COLUMN "bookingId" TEXT;

CREATE INDEX "payments_bookingId_userId_status_idx" ON "payments"("bookingId", "userId", "status");

ALTER TABLE "payments"
ADD CONSTRAINT "payments_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "bookings"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE "payments" AS payment
SET "bookingId" = (
  SELECT booking."id"
  FROM "plans" AS plan
  JOIN "decks" AS deck ON deck."id" = plan."deckId"
  JOIN "bookings" AS booking ON booking."category" = CASE deck."slug"
    WHEN 'vip-deck' THEN 'VIP1'::"SlipCategory"
    WHEN 'vip-2-deck' THEN 'VIP2'::"SlipCategory"
    WHEN 'vip-3-deck' THEN 'VIP3'::"SlipCategory"
  END
  WHERE plan."id" = payment."planId"
    AND booking."bookingDate" = DATE(COALESCE(payment."paidAt", payment."createdAt"))
  ORDER BY booking."createdAt" ASC
  LIMIT 1
)
WHERE payment."status" = 'SUCCESS'
  AND payment."bookingId" IS NULL;
