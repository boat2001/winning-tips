import type { Challenge, CommunityPost, CommunityRoom, LeaderboardMember } from "@/lib/domain/community";

/** DEVELOPMENT FIXTURE — see lib/fixtures/index.ts. Not production data. */

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export const communityMemberCount = 125_680;

export const featuredPost: CommunityPost = {
  id: "fx-post-1",
  author: { handle: "AlexProTips", avatarUrl: null, isPremium: true },
  publishedAt: hoursAgo(2),
  body: "Man City look unstoppable at home this season! Backing them again tonight. What are your thoughts? Any value in Arsenal or a draw?",
  topic: "football",
  reactions: 128,
  comments: 47,
  status: "PUBLISHED",
};

export const topMembers: readonly LeaderboardMember[] = [
  { rank: 1, handle: "KingPredictor", avatarUrl: null, points: 12_540 },
  { rank: 2, handle: "BetQueen", avatarUrl: null, points: 11_230 },
  { rank: 3, handle: "GoalHunter", avatarUrl: null, points: 10_880 },
  { rank: 4, handle: "TipMaster", avatarUrl: null, points: 9_420 },
  { rank: 5, handle: "FootballGuru", avatarUrl: null, points: 8_915 },
];

export const todaysChallenge: Challenge = {
  id: "fx-challenge-1",
  title: "Pick 3 correct matches today!",
  description: "Join the challenge and climb the leaderboard.",
  joinedCount: 8_432,
  endsAt: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(),
};

export const activeRooms: readonly CommunityRoom[] = [
  { sport: "football", onlineCount: 3_124 },
  { sport: "basketball", onlineCount: 892 },
  { sport: "tennis", onlineCount: 641 },
];
