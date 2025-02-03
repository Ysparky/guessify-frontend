import axios from "axios";
import { defineStore } from "pinia";
import { io, Socket } from "socket.io-client";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import type { Game, PlayerInfo } from "../types/game";
import { GameStatus } from "../types/game";
import { useAuthStore } from "./auth";
import { useStatsStore } from "./stats";

const API_URL = import.meta.env.VITE_API_URL;

export interface RoundStartData {
  songId: string;
  songUri: string;
  options: string[];
  duration: number;
  startTime: Date;
  endTime: Date;
}

export interface RoundResultsResponse {
  results: Array<{
    playerId: string;
    displayName: string;
    answer: string;
    isCorrect: boolean;
    scoreEarned: number;
  }>;
  currentRound: number;
  totalRounds: number;
}

export interface RoundResults {
  roundNumber: number;
  correctAnswer: string;
  playerAnswers: Array<{
    playerId: string;
    answer: string;
    correct: boolean;
    score: number;
  }>;
}

export const useGameStore = defineStore("game", () => {
  const router = useRouter();
  const authStore = useAuthStore();
  const currentGame = ref<Game | null>(null);
  const currentRound = ref<RoundStartData | null>(null);
  const roundResults = ref<RoundResults | null>(null);
  const socket = ref<Socket | null>(null);
  const error = ref<string | null>(null);
  const roundTimer = ref<number | null>(null);
  const elapsedTime = ref(0);

  const isHost = computed(
    () => currentGame.value?.hostId === authStore.player?.id
  );
  const isInGame = computed(() => !!currentGame.value);
  const canStartGame = computed(
    () =>
      isHost.value &&
      currentGame.value?.status === GameStatus.WAITING &&
      (currentGame.value?.playerIds.length ?? 0) >= 2
  );

  // Get player info by ID
  const getPlayerById = (playerId: string): PlayerInfo | undefined => {
    return currentGame.value?.players.find((p) => p.id === playerId);
  };

  // Socket setup
  const setupSocket = () => {
    console.log("Setting up socket connection...");
    socket.value = io(API_URL);

    socket.value.on("connect", () => {
      console.log("Socket connected");
    });

    socket.value.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket.value.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.value.on(
      "playerJoined",
      (data: {
        playerId: string;
        playerCount: number;
        playerIds: string[];
        players: PlayerInfo[];
      }) => {
        console.log("playerJoined event received:", data);
        if (currentGame.value) {
          currentGame.value.playerIds = data.playerIds;
          currentGame.value.players = data.players;
          const newPlayer = getPlayerById(data.playerId);
          if (newPlayer) {
            error.value = `${newPlayer.displayName} joined the game`;
          }
        }
      }
    );

    socket.value.on(
      "playerLeft",
      (data: {
        playerId: string;
        newHostId: string;
        remainingPlayers: string[];
        players: PlayerInfo[];
        gameStatus: GameStatus;
      }) => {
        if (currentGame.value) {
          const leftPlayer = getPlayerById(data.playerId);

          // Update player lists
          currentGame.value.playerIds = data.remainingPlayers;
          currentGame.value.players = data.players;

          // Update host if changed
          if (data.newHostId) {
            currentGame.value.hostId = data.newHostId;
            if (data.newHostId === authStore.player?.id) {
              error.value = "You are now the host!";
            }
          }

          // Update game status
          currentGame.value.status = data.gameStatus;

          // Show who left
          if (leftPlayer) {
            error.value = `${leftPlayer.displayName} left the game`;
          }
        }
      }
    );

    socket.value.on(
      "gameStarted",
      (data: {
        gameId: string;
        hostId: string;
        players: PlayerInfo[];
        totalRounds: number;
      }) => {
        console.log("gameStarted event received:", data);
        if (currentGame.value) {
          currentGame.value.status = GameStatus.IN_PROGRESS;
          currentGame.value.players = data.players;
          currentGame.value.totalRounds = data.totalRounds;
          error.value = "Game is starting...";
        }
      }
    );

    socket.value.on("roundStarted", (data: RoundStartData) => {
      console.log("roundStarted event received:", data);
      currentRound.value = data;
      roundResults.value = null;
      elapsedTime.value = 0;

      // Clear any existing timer
      if (roundTimer.value) {
        clearInterval(roundTimer.value);
      }

      // Start the timer to update elapsed time every 100ms
      roundTimer.value = window.setInterval(() => {
        const now = new Date().getTime();
        const startTime = new Date(data.startTime).getTime();
        elapsedTime.value = Math.min(now - startTime, data.duration);

        // Stop the timer when we reach the duration
        if (elapsedTime.value >= data.duration) {
          if (roundTimer.value) {
            clearInterval(roundTimer.value);
            roundTimer.value = null;
          }
        }
      }, 100);
    });

    socket.value.on("roundResults", (data: RoundResultsResponse) => {
      console.log("roundResults event received:", data);
      // Clear any existing timer
      if (roundTimer.value) {
        clearInterval(roundTimer.value);
        roundTimer.value = null;
      }
      elapsedTime.value = 0;

      // Store round results
      roundResults.value = {
        roundNumber: data.currentRound,
        correctAnswer: data.results.find((r) => r.isCorrect)?.answer || "",
        playerAnswers: data.results.map((r) => ({
          playerId: r.playerId,
          answer: r.answer,
          correct: r.isCorrect,
          score: r.scoreEarned,
        })),
      };
      currentRound.value = null;

      // Update current round number in game state
      if (currentGame.value) {
        currentGame.value.currentRoundNumber = data.currentRound;
      }
    });

    socket.value.on(
      "gameEnded",
      (data: {
        gameId: string;
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
        reason?: string;
      }) => {
        console.log("gameEnded event received:", data);
        const statsStore = useStatsStore();

        // Clear any existing timer
        if (roundTimer.value) {
          clearInterval(roundTimer.value);
          roundTimer.value = null;
        }
        elapsedTime.value = 0;

        // Show game end reason if provided
        if (data.reason) {
          error.value = data.reason;
        } else {
          // Show winner announcement
          error.value = `Game Over! ${data.winner.displayName} wins!`;
        }

        // Store game results
        if (data.gameId) {
          statsStore.getGameResults(data.gameId, authStore.player?.id);
        }

        // Reset game state
        currentGame.value = null;
        currentRound.value = null;
        roundResults.value = null;

        // Clear frontend player reference (backend handles actual player state)
        authStore.cleanupPlayer();

        // Redirect to home after a short delay
        setTimeout(() => {
          router.push("/");
        }, 3000);
      }
    );

    socket.value.on("error", (data: { message: string; code?: string }) => {
      console.error("Socket error event received:", data);
      error.value = data.message;

      // Handle device-related errors
      if (data.code === "NO_DEVICE") {
        authStore.getDevices(); // Request available devices
      } else if (data.code === "PREMIUM_REQUIRED") {
        // Handle premium requirement error
        router.push("/login");
      }
    });
  };

  // API calls
  const createGame = async () => {
    if (!authStore.player?.id) {
      error.value = "You must be logged in to create a game";
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/games`, {
        hostId: authStore.player.id,
      });
      currentGame.value = response.data;
      setupSocket();

      if (!currentGame.value) {
        throw new Error("Failed to create game: No game data received");
      }

      socket.value?.emit("joinRoom", {
        roomCode: currentGame.value.roomCode,
        playerId: authStore.player.id,
      });
    } catch (err) {
      error.value = "Failed to create game";
      console.error(err);
    }
  };

  const joinGame = async (roomCode: string) => {
    if (!authStore.player?.id) {
      error.value = "You must be logged in to join a game";
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/games/${roomCode}/join`, {
        playerId: authStore.player.id,
      });
      currentGame.value = response.data;
      setupSocket();
      socket.value?.emit("joinRoom", {
        roomCode,
        playerId: authStore.player.id,
      });
    } catch (err) {
      error.value = "Failed to join game";
      console.error(err);
    }
  };

  const startGame = async () => {
    if (!currentGame.value || !isHost.value || !authStore.player?.id) return;

    try {
      socket.value?.emit("startGame", {
        roomCode: currentGame.value.roomCode,
        hostId: authStore.player.id,
      });
    } catch (err) {
      console.error("Failed to start game:", err);
      error.value = "Failed to start game";
    }
  };

  const startRound = () => {
    if (!currentGame.value || !isHost.value || !authStore.player?.id) return;

    try {
      socket.value?.emit("startRound", {
        roomCode: currentGame.value.roomCode,
        hostId: authStore.player.id,
      });
    } catch (err) {
      console.error("Failed to start round:", err);
      error.value = "Failed to start round";
    }
  };

  const submitAnswer = (answer: string) => {
    if (!currentGame.value || !socket.value || !authStore.player?.id) return;

    socket.value.emit("submitAnswer", {
      roomCode: currentGame.value.roomCode,
      playerId: authStore.player.id,
      answer,
    });
  };

  const leaveGame = () => {
    if (roundTimer.value) {
      clearInterval(roundTimer.value);
      roundTimer.value = null;
    }
    elapsedTime.value = 0;
    socket.value?.disconnect();
    socket.value = null;
    currentGame.value = null;
    currentRound.value = null;
    roundResults.value = null;
    error.value = null;
  };

  return {
    currentGame,
    currentRound,
    roundResults,
    error,
    isHost,
    isInGame,
    canStartGame,
    getPlayerById,
    createGame,
    joinGame,
    startGame,
    startRound,
    submitAnswer,
    leaveGame,
    elapsedTime,
  };
});
