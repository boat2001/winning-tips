CREATE TABLE "saved_tips" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "predictionId" TEXT NOT NULL REFERENCES "predictions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "selection" TEXT,
  "market" TEXT,
  "revisionAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "saved_tips_userId_predictionId_key" ON "saved_tips"("userId", "predictionId");
CREATE INDEX "saved_tips_userId_createdAt_idx" ON "saved_tips"("userId", "createdAt");
CREATE TABLE "user_preferences" (
  "userId" TEXT NOT NULL PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "countryCode" TEXT NOT NULL DEFAULT 'GH',
  "sports" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "notifications" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
