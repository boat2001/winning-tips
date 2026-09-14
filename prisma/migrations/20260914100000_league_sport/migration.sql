-- Sport belongs to the league, and every fixture inherits it from there.
--
-- Everything already in the database arrived through the football feed or the
-- SportyBet slip loader, so FOOTBALL is the correct backfill for existing rows.
CREATE TYPE "Sport" AS ENUM ('FOOTBALL', 'BASKETBALL', 'TENNIS');

ALTER TABLE "leagues" ADD COLUMN "sport" "Sport" NOT NULL DEFAULT 'FOOTBALL';

CREATE INDEX "leagues_sport_idx" ON "leagues"("sport");
