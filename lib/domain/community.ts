import type { SportSlug } from "@/lib/domain/tips";

/**
 * Community domain, per development guide §14.7.
 *
 * Nothing here has a database table yet — these types exist so the community
 * screen renders from the same shapes its eventual queries will return.
 *
 * One product rule is encoded in the types rather than left to a convention:
 * challenges are scored on analytical accuracy and participation only. There is
 * deliberately no stake, deposit or wagering field anywhere in this file, and
 * none may be added — rewarding volume wagered is exactly what §14.7 forbids.
 */

export type PostStatus = "PUBLISHED" | "LOCKED" | "REPORTED" | "DELETED";

export interface CommunityAuthor {
  readonly handle: string;
  readonly avatarUrl: string | null;
  readonly isPremium: boolean;
}

export interface CommunityPost {
  readonly id: string;
  readonly author: CommunityAuthor;
  readonly publishedAt: string;
  readonly body: string;
  readonly topic: SportSlug | null;
  readonly reactions: number;
  readonly comments: number;
  readonly status: PostStatus;
}

/** Leaderboard entry. `points` reflect accuracy and participation, never stakes. */
export interface LeaderboardMember {
  readonly rank: number;
  readonly handle: string;
  readonly avatarUrl: string | null;
  readonly points: number;
}

export interface CommunityRoom {
  readonly sport: SportSlug;
  readonly onlineCount: number;
}

export interface Challenge {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly joinedCount: number;
  readonly endsAt: string;
}

/** "2 hours ago", "3 days ago". Coarse on purpose — posts are not a live feed. */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  const weeks = Math.round(days / 7);
  return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
}

/** Compact member counts: 125680 becomes "125,680", 3124 becomes "3,124". */
export function formatCount(value: number): string {
  return value.toLocaleString("en-GB");
}
