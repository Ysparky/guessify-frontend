import axios from "axios";
import { defineStore } from "pinia";
import { io, Socket } from "socket.io-client";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import type { AnswerResult, Game } from "../types/game";
import { GameStatus } from "../types/game";
import { useAuthStore } from "./auth";

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

  // Socket setup
  const setupSocket = () => {
    socket.value = io(API_URL);

    socket.value.on(
      "playerJoined",
      (data: {
        playerId: string;
        playerCount: number;
        playerIds: string[];
        playerNames: string[];
      }) => {
        if (currentGame.value) {
          currentGame.value.playerIds = data.playerIds;
        }
      }
    );

    socket.value.on(
      "playerLeft",
      (data: {
        playerId: string;
        newHostId: string;
        remainingPlayers: string[];
        gameStatus: GameStatus;
      }) => {
        if (currentGame.value) {
          // Update player list
          currentGame.value.playerIds = data.remainingPlayers;

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
          error.value = `Player ${data.playerId.slice(0, 6)} left the game`;
        }
      }
    );

    socket.value.on("gameEnded", (data: { reason: string }) => {
      error.value = data.reason;
      // Reset game state
      currentGame.value = null;
      currentRound.value = null;
      // Redirect to home after a short delay
      setTimeout(() => {
        router.push("/");
      }, 3000);
    });

    socket.value.on("roundStarted", (data: RoundStartData) => {
      currentRound.value = data;
      // Play the track using Spotify Web Playback SDK
      if (authStore.spotifyPlayer) {
        // TODO: Implement playback using the SDK
        console.log("Playing track:", data.songUri);
      }
    });

    socket.value.on("answerResult", (data: AnswerResult) => {
      // TODO: Handle answer results and scoring
      console.log("Answer result:", data);
    });

    socket.value.on("error", (data: { message: string }) => {
      error.value = data.message;
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
      if (currentGame.value) {
        socket.value?.emit("joinRoom", {
          roomCode: currentGame.value.roomCode,
          playerId: authStore.player.id,
        });
      }
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
      await axios.post(`${API_URL}/games/${currentGame.value.roomCode}/start`, {
        hostId: authStore.player.id,
      });
    } catch (err) {
      error.value = "Failed to start game";
      console.error(err);
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
    createGame,
    joinGame,
    startGame,
    submitAnswer,
    leaveGame,
  };
});
