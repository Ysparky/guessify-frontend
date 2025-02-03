import axios from "axios";
import { defineStore } from "pinia";
import { io, Socket } from "socket.io-client";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import type { AnswerResult, Game, PlayerInfo } from "../types/game";
import { GameStatus } from "../types/game";
import { useAuthStore } from "./auth";
import { useStatsStore } from "./stats";

const API_URL = "http://localhost:3000";

export interface RoundStartData {
  songId: string;
  songUri: string;
  options: string[];
  duration: number;
  startTime: Date;
  endTime: Date;
}

export const useGameStore = defineStore("game", () => {
  const router = useRouter();
  const authStore = useAuthStore();
  const currentGame = ref<Game | null>(null);
  const currentRound = ref<RoundStartData | null>(null);
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
    socket.value = io(API_URL);

    socket.value.on(
      "playerJoined",
      (data: {
        playerId: string;
        playerCount: number;
        playerIds: string[];
        players: PlayerInfo[];
      }) => {
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

        // Redirect to home after a short delay
        setTimeout(() => {
          router.push("/");
        }, 3000);
      }
    );

    socket.value.on("roundStarted", (data: RoundStartData) => {
      currentRound.value = data;
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

    socket.value.on("answerResult", (data: AnswerResult) => {
      // TODO: Handle answer results and scoring
      const player = getPlayerById(data.playerId);
      if (player) {
        console.log(`${player.displayName}'s answer:`, data);
      }
    });

    socket.value.on("error", (data: { message: string; code?: string }) => {
      error.value = data.message;

      // Handle device-related errors
      if (data.code === "NO_DEVICE") {
        authStore.getDevices(); // Request available devices
      } else if (data.code === "PREMIUM_REQUIRED") {
        // Handle premium requirement error
        router.push("/login");
      }
    });

    socket.value.on(
      "gameStarted",
      (data: {
        gameId: string;
        hostId: string;
        players: PlayerInfo[];
        totalRounds: number;
      }) => {
        if (currentGame.value) {
          currentGame.value.status = GameStatus.IN_PROGRESS;
          currentGame.value.players = data.players;
          currentGame.value.totalRounds = data.totalRounds;
        }
      }
    );
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
    error.value = null;
  };

  return {
    currentGame,
    currentRound,
    error,
    isHost,
    isInGame,
    canStartGame,
    getPlayerById,
    createGame,
    joinGame,
    startGame,
    submitAnswer,
    leaveGame,
    elapsedTime,
  };
});
