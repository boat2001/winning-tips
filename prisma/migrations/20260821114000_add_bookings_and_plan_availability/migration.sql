ALTER TABLE "plans" ADD COLUMN "isSoldOut" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "bookings" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL DEFAULT 'Booking Code',
  "platform" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "bookingDate" DATE NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bookings_bookingDate_isActive_sortOrder_idx"
  ON "bookings"("bookingDate", "isActive", "sortOrder");
