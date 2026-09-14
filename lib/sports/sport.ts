import type { ProviderSport } from "@/lib/football/types";

/**
 * A bookmaker's or feed's sport name → the sports Winning Tips publishes for.
 *
 * The match is exact after trimming and lower-casing, and anything else returns
 * null. That is deliberate: "eFootball", "Virtual Football" and "Table Tennis"
 * must not be filed under a real sport, because the guide (§2) forbids
 * publishing predictions on generated or casino outcomes. A slip containing one
 * is refused rather than quietly misclassified.
 */
const SPORT_BY_NAME: Readonly<Record<string, ProviderSport>> = {
  football: "FOOTBALL",
  soccer: "FOOTBALL",
  basketball: "BASKETBALL",
  tennis: "TENNIS",
};

export function sportFromName(name: string): ProviderSport | null {
  return SPORT_BY_NAME[name.trim().toLowerCase()] ?? null;
}

export const PUBLISHED_SPORTS: readonly ProviderSport[] = ["FOOTBALL", "BASKETBALL", "TENNIS"];
