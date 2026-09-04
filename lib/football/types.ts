export type ProviderFixtureStatus =
  | "SCHEDULED"
  | "LIVE"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED";

export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;
export type JsonObject = { [key: string]: JsonValue };

export interface LeagueInput {
  externalId: string;
  name: string;
  country: string;
  logoUrl?: string | null;
}

export interface TeamInput {
  externalId: string;
  name: string;
  shortName?: string | null;
  country?: string | null;
  logoUrl?: string | null;
}

export interface FixtureInput {
  externalId: string;
  league: LeagueInput;
  homeTeam: TeamInput;
  awayTeam: TeamInput;
  kickoffAt: string;
  status: ProviderFixtureStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  venue?: string | null;
  provider: string;
  providerData?: JsonObject | null;
}

export interface FixtureResultInput {
  externalId: string;
  status: ProviderFixtureStatus;
  homeScore: number | null;
  awayScore: number | null;
}

export interface StandingInput {
  teamExternalId: string;
  position: number;
  played: number;
  points: number;
}

export interface MatchInput {
  fixtureExternalId: string;
  kickoffAt: string;
  homeTeamExternalId: string;
  awayTeamExternalId: string;
  homeScore: number | null;
  awayScore: number | null;
}

export interface FixtureDateWindow {
  key: "yesterday" | "today" | "tomorrow";
  label: string;
  date: string;
  start: Date;
  end: Date;
}
