/**
 * DEVELOPMENT FIXTURES — NOT PRODUCTION DATA.
 *
 * Guide §13.4 builds screens from typed fixtures; §21.8 requires seeded demo
 * content to be visibly and structurally isolated from production. This module
 * is that isolation boundary:
 *
 *   - nothing under lib/fixtures/ may be imported by a query, an action, a
 *     route handler or anything under lib/domain — only by a screen that has
 *     not yet been wired to its real source;
 *   - every fixture satisfies the same exported type as the eventual query, so
 *     swapping the source is a one-line change per screen;
 *   - `isFixtureBacked` drives the visible development marker, so no screen can
 *     quietly ship fabricated figures.
 *
 * Delete a fixture file the moment its screen has a real source.
 */

export {
  fixtureViewer,
} from "@/lib/fixtures/viewer.fixture";

export {
  featuredTip,
  todaysTips,
  highConfidenceTips,
  topPicks,
  allFixtureTips,
  findFixtureTipBySlug,
} from "@/lib/fixtures/tips.fixture";

export {
  performanceSummaries,
  weeklyTrend,
  recentGradedTips,
  sportBreakdowns,
  recentFormBars,
  homeHighlights,
} from "@/lib/fixtures/performance.fixture";

export {
  activeRooms,
  communityMemberCount,
  featuredPost,
  todaysChallenge,
  topMembers,
} from "@/lib/fixtures/community.fixture";

/**
 * True whenever a screen is still rendering fixture data.
 *
 * Kept as a constant rather than an environment check so that removing the last
 * fixture import is what turns the marker off — an env var would let fabricated
 * figures reach production simply by setting NODE_ENV.
 */
export const isFixtureBacked = true;
