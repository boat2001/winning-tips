import "server-only";

import { revalidateTag, updateTag } from "next/cache";
import { publicBookingTag, publicPerformanceTag, publicPredictionTag, publicVipTag } from "@/lib/cache/tags";

/**
 * Cache expiry for route handlers: the nightly automation and webhooks.
 *
 * `updateTag` is only allowed inside Server Actions, so these callers use
 * `revalidateTag` with `{ expire: 0 }`. A newly settled result must be gone from
 * the cache at once rather than served stale while it refreshes, because the
 * public record is the product's central claim.
 */
export function expireResultsFromRouteHandler() {
  for (const tag of [publicPredictionTag, publicPerformanceTag, publicBookingTag, publicVipTag]) {
    revalidateTag(tag, { expire: 0 });
  }
}

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
