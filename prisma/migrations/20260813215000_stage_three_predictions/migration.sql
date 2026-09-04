CREATE TYPE "PredictionVisibility" AS ENUM ('FREE', 'PREMIUM');
CREATE TYPE "PredictionPublishStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "PredictionResult" AS ENUM ('PENDING', 'WON', 'LOST', 'VOID', 'PUSH', 'CANCELLED');

CREATE TABLE "decks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "visualIdentifier" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "priceMinor" INTEGER,
    "durationDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "decks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "predictions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "deckId" TEXT,
    "market" TEXT NOT NULL,
    "selection" TEXT NOT NULL,
    "odds" DECIMAL(6,2) NOT NULL,
    "confidence" INTEGER NOT NULL,
    "analysis" TEXT NOT NULL,
    "visibility" "PredictionVisibility" NOT NULL DEFAULT 'FREE',
    "status" "PredictionPublishStatus" NOT NULL DEFAULT 'DRAFT',
    "result" "PredictionResult" NOT NULL DEFAULT 'PENDING',
    "publishAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "decks_slug_key" ON "decks"("slug");
CREATE INDEX "decks_isActive_sortOrder_idx" ON "decks"("isActive", "sortOrder");
CREATE UNIQUE INDEX "predictions_slug_key" ON "predictions"("slug");
CREATE INDEX "predictions_fixtureId_status_idx" ON "predictions"("fixtureId", "status");
CREATE INDEX "predictions_deckId_status_idx" ON "predictions"("deckId", "status");
CREATE INDEX "predictions_status_publishAt_idx" ON "predictions"("status", "publishAt");
CREATE INDEX "predictions_visibility_status_idx" ON "predictions"("visibility", "status");

ALTER TABLE "predictions" ADD CONSTRAINT "predictions_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "fixtures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "decks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
