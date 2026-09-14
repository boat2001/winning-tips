-- The daily card is the product.
--
-- Each day's booking now carries its own price, currency and sales state, so a
-- purchase is one payment for one day's card. The subscription table is
-- dropped: nothing ever wrote a row to it, and the duration and access-scope
-- columns on plans were never read by checkout.

-- 1. The card carries the commercial terms.
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'GHS';
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "isSoldOut" BOOLEAN NOT NULL DEFAULT false;

-- Carry each card's currency over from the plan that priced it, where one exists.
UPDATE "bookings" b
SET "currency" = p."currency"
FROM "plans" p
WHERE p."currency" IS NOT NULL
  AND b."priceMinor" IS NOT NULL
  AND p."id" = (
    SELECT pay."planId" FROM "payments" pay
    WHERE pay."bookingId" = b."id" AND pay."planId" IS NOT NULL
    LIMIT 1
  );

-- 2. A card can be sold without a catalogue plan. Historic payments keep theirs.
ALTER TABLE "payments" ALTER COLUMN "planId" DROP NOT NULL;

-- 3. Retire the subscription model. No row has ever been created.
DROP TABLE IF EXISTS "subscriptions";
DROP TYPE IF EXISTS "SubscriptionStatus";

-- 4. Retire plan duration and access scope, which checkout never read.
ALTER TABLE "plans" DROP COLUMN IF EXISTS "durationDays";
ALTER TABLE "plans" DROP COLUMN IF EXISTS "scope";
DROP TYPE IF EXISTS "PlanScope";

-- 5. Premium is derived from the cards a member owns today, not a stored date
--    that nothing ever set.
DROP INDEX IF EXISTS "users_premiumAccessUntil_idx";
ALTER TABLE "users" DROP COLUMN IF EXISTS "premiumAccessUntil";
