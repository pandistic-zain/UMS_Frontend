export type LeaderboardEntry = {
  rank: number;
  userId: number;
  name: string;
  avatarUrl?: string | null;
  role?: string | null;
  score: number;
  breakdown?: Record<string, number>;
  lastPlace?: boolean;
};

export type LeaderboardResponse = {
  scope: "TEAM" | "SYSTEM";
  month: string;
  generatedAt: string;
  configHash: string;
  entries: LeaderboardEntry[];
};

export type LeaderboardMeResponse = {
  month: string;
  userId: number;
  rank: number;
  score: number;
  breakdown?: Record<string, number>;
  neighbors: LeaderboardEntry[];
};
