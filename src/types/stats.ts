export interface PlayerStats {
  totalGames: number;
  gamesWon: number;
  averageRank: number;
  averageScore: number;
  totalCorrectAnswers: number;
  accuracy: number;
}

export interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  gamesWon: number;
  totalGames: number;
  averageScore: number;
}

export interface GameResults {
  id: string;
  game: {
    id: string;
    roomCode: string;
    status: string;
  };
  winner: {
    id: string;
    displayName: string;
  };
  rankings: Array<{
    playerId: string;
    displayName: string;
    totalScore: number;
    rank: number;
    correctAnswers: number;
    totalAnswers: number;
  }>;
  totalRoundsPlayed: number;
  averageScore: number;
  totalPlayers: number;
  createdAt: string;
}
