import axios, { AxiosError } from "axios";
import { defineStore } from "pinia";
import { ref } from "vue";
import type {
  GameResults,
  LeaderboardEntry,
  PlayerStats,
  RecentGame,
} from "../types/stats";

const API_URL = import.meta.env.VITE_API_URL;

export const useStatsStore = defineStore("stats", () => {
  const playerStats = ref<PlayerStats | null>(null);
  const leaderboard = ref<LeaderboardEntry[]>([]);
  const gameResults = ref<GameResults | null>(null);
  const recentGames = ref<RecentGame[]>([]);
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

  // Get recent games
  const getRecentGames = async (playerId: string, limit: number = 10) => {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await axios.get<RecentGame[]>(
        `${API_URL}/stats/player/${playerId}/recent?limit=${limit}`
      );
      recentGames.value = response.data;
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      console.error("Failed to fetch recent games:", err);
      error.value =
        axiosError.response?.data?.message || "Failed to fetch recent games";
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
    recentGames.value = [];
    error.value = null;
  };

  return {
    playerStats,
    leaderboard,
    gameResults,
    recentGames,
    isLoading,
    error,
    getPlayerStats,
    getLeaderboard,
    getGameResults,
    getRecentGames,
    clearStats,
  };
});
