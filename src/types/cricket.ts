export interface Ball {
  runs: number;
  isWicket: boolean;
  extras?: {
    type: "wide" | "noBall" | "byes" | "legByes";
    runs: number;
  };
}

export interface Score {
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  ballHistory: Ball[];
}

export interface Team {
  name: string;
  score: Score;
  timestamp: number;
}

export interface Match {
  teams: Team[];
  currentTeamIndex: number;
}
