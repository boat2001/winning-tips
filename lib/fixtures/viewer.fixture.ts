import type { Viewer } from "@/lib/domain/viewer";

/** DEVELOPMENT FIXTURE — see lib/fixtures/index.ts. Not production data. */
export const fixtureViewer: Viewer = {
  id: "fixture-viewer",
  displayName: "Sport Guru",
  handle: "betterdaysahead",
  avatarUrl: "/assets/athletes/football-player.webp",
  plan: "PREMIUM",
  countryCode: "GH",
  countryName: "Ghana",
  timezone: "Africa/Accra",
  location: "Accra, Ghana",
  tagline: "Predict smarter. Win together.",
  unreadNotifications: 3,
};
