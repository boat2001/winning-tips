import type {
  FixtureInput,
  FixtureResultInput,
  MatchInput,
  StandingInput,
} from "@/lib/football/types";

export interface FootballProvider {
  getFixturesByDate(date: string): Promise<FixtureInput[]>;
  getFixtureById(id: string): Promise<FixtureInput | null>;
  getResultsByDate(date: string): Promise<FixtureResultInput[]>;
  getLeagueStandings?(leagueId: string): Promise<StandingInput[]>;
  getHeadToHead?(homeTeamId: string, awayTeamId: string): Promise<MatchInput[]>;
}
