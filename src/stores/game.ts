import axios from "axios";
import { defineStore } from "pinia";
import { io, Socket } from "socket.io-client";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import type { AnswerResult, Game, RoundData } from "../types/game";
import { GameStatus } from "../types/game";

const API_URL = "http://localhost:3000";

export const useGameStore = defineStore("game", () => {
  const router = useRouter();
  const currentGame = ref<Game | null>(null);
  const currentRound = ref<RoundData | null>(null);
  const socket = ref<Socket | null>(null);
  const playerId = ref<string>(
    localStorage.getItem("playerId") || crypto.randomUUID()
  );
  const error = ref<string | null>(null);

  // Save playerId to localStorage
  localStorage.setItem("playerId", playerId.value);

  const isHost = computed(() => currentGame.value?.hostId === playerId.value);
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
            if (data.newHostId === playerId.value) {
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

    socket.value.on("roundStarted", (data: RoundData) => {
      currentRound.value = data;
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
    try {
      const response = await axios.post(`${API_URL}/games`, {
        hostId: playerId.value,
      });
      currentGame.value = response.data;
      setupSocket();
      if (currentGame.value) {
        socket.value?.emit("joinRoom", {
          roomCode: currentGame.value.roomCode,
          playerId: playerId.value,
        });
      }
    } catch (err) {
      error.value = "Failed to create game";
      console.error(err);
    }
  };

  const joinGame = async (roomCode: string) => {
    try {
      const response = await axios.post(`${API_URL}/games/${roomCode}/join`, {
        playerId: playerId.value,
      });
      currentGame.value = response.data;
      setupSocket();
      socket.value?.emit("joinRoom", {
        roomCode,
        playerId: playerId.value,
      });
    } catch (err) {
      error.value = "Failed to join game";
      console.error(err);
    }
  };

  const startGame = async () => {
    if (!currentGame.value || !isHost.value) return;

    try {
      await axios.post(`${API_URL}/games/${currentGame.value.roomCode}/start`, {
        hostId: playerId.value,
      });
    } catch (err) {
      error.value = "Failed to start game";
      console.error(err);
    }
  };

  const submitAnswer = (answer: string) => {
    if (!currentGame.value || !socket.value) return;

    socket.value.emit("submitAnswer", {
      roomCode: currentGame.value.roomCode,
      playerId: playerId.value,
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
    playerId,
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
