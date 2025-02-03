import axios, { AxiosError } from "axios";
import { defineStore } from "pinia";
import { ref } from "vue";

const API_URL = "http://localhost:3000";

interface PlayerStats {
  totalGames: number;
  gamesWon: number;
  averageRank: number;
  averageScore: number;
  totalCorrectAnswers: number;
  accuracy: number;
}

interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  gamesWon: number;
  totalGames: number;
  averageScore: number;
}

interface GameResults {
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

export const useStatsStore = defineStore("stats", () => {
  const playerStats = ref<PlayerStats | null>(null);
  const leaderboard = ref<LeaderboardEntry[]>([]);
  const gameResults = ref<GameResults | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Get player statistics
  const getPlayerStats = async (playerId: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await axios.get<PlayerStats>(
        `${API_URL}/stats/player/${playerId}`
      );
      playerStats.value = response.data;
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      console.error("Failed to fetch player stats:", err);
      error.value =
        axiosError.response?.data?.message ||
        "Failed to fetch player statistics";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Get leaderboard
  const getLeaderboard = async (limit: number = 10) => {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await axios.get<LeaderboardEntry[]>(
        `${API_URL}/stats/leaderboard?limit=${limit}`
      );
      leaderboard.value = response.data;
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      console.error("Failed to fetch leaderboard:", err);
      error.value =
        axiosError.response?.data?.message || "Failed to fetch leaderboard";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Get game results
  const getGameResults = async (gameId: string, playerId?: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      const url = new URL(`${API_URL}/stats/game/${gameId}`);
      if (playerId) {
        url.searchParams.append("playerId", playerId);
      }
      const response = await axios.get<GameResults>(url.toString());
      gameResults.value = response.data;
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      console.error("Failed to fetch game results:", err);
      if (axiosError.response?.status === 403) {
        error.value = "You don't have permission to view these game results";
      } else {
        error.value =
          axiosError.response?.data?.message || "Failed to fetch game results";
      }
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Clear all stats data (useful when logging out)
  const clearStats = () => {
    playerStats.value = null;
    leaderboard.value = [];
    gameResults.value = null;
    error.value = null;
  };

  return {
    playerStats,
    leaderboard,
    gameResults,
    isLoading,
    error,
    getPlayerStats,
    getLeaderboard,
    getGameResults,
    clearStats,
  };
});
