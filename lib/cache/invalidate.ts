import "server-only";

import { updateTag } from "next/cache";
import { publicBookingTag, publicPerformanceTag, publicPredictionTag, publicVipTag } from "@/lib/cache/tags";

export function invalidatePredictionData() {
  updateTag(publicPredictionTag);
  updateTag(publicPerformanceTag);
}

export function invalidateBookingData() {
  updateTag(publicBookingTag);
  updateTag(publicPredictionTag);
  updateTag(publicVipTag);
}

export function invalidateVipData() {
  updateTag(publicVipTag);
}
