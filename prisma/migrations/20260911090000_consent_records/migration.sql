-- Append-only record of what each member agreed to, when, and to which version
-- (development guide §8 Consent / AgeGateRecord, §14.2, §14.8 consent history).
CREATE TYPE "ConsentKind" AS ENUM ('AGE_CONFIRMATION', 'TERMS', 'PRIVACY', 'MARKETING');

CREATE TABLE "consent_records" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "kind" "ConsentKind" NOT NULL,
  "granted" BOOLEAN NOT NULL,
  "version" TEXT NOT NULL,
  "countryCode" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "consent_records_userId_kind_createdAt_idx" ON "consent_records"("userId", "kind", "createdAt");
