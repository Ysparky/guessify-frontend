import axios, { AxiosError } from "axios";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Player, SpotifyPlayer } from "../types/auth";

const API_URL = "http://localhost:3000";

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (config: {
        name: string;
        getOAuthToken: (callback: (token: string) => void) => void;
      }) => any;
    };
  }
}

interface PlayerState {
  device_id: string;
  volume: number;
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: {
      id: string;
      uri: string;
      name: string;
      artists: Array<{ name: string }>;
    };
  };
}

export const useAuthStore = defineStore("auth", () => {
  const player = ref<Player | null>(null);
  const spotifyPlayer = ref<SpotifyPlayer | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Load persisted player data on store initialization
  try {
    const persistedPlayer = localStorage.getItem("player");
    if (persistedPlayer) {
      player.value = JSON.parse(persistedPlayer);
    }
  } catch (err) {
    console.error("Failed to load persisted player data:", err);
    localStorage.removeItem("player");
  }

  const isAuthenticated = computed(() => !!player.value);
  const hasValidToken = computed(() => {
    if (!player.value) return false;
    const expiresAt = new Date(player.value.tokenExpiresAt).getTime();
    return Date.now() < expiresAt;
  });

  // Initialize Spotify Web Playback SDK
  const initializeSpotifyPlayer = async () => {
    if (!player.value?.accessToken) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;

      document.body.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = () => {
        const spotifyPlayerInstance = new window.Spotify.Player({
          name: "Guessify Web Player",
          getOAuthToken: (callback: (token: string) => void) => {
            callback(player.value?.accessToken ?? "");
          },
        });

        // Error handling
        spotifyPlayerInstance.addListener(
          "initialization_error",
          ({ message }: { message: string }) => {
            error.value = `Failed to initialize Spotify player: ${message}`;
            reject(new Error(message));
          }
        );

        spotifyPlayerInstance.addListener(
          "authentication_error",
          ({ message }: { message: string }) => {
            error.value = `Spotify authentication error: ${message}`;
            reject(new Error(message));
          }
        );

        spotifyPlayerInstance.addListener(
          "account_error",
          ({ message }: { message: string }) => {
            error.value = `Spotify account error: ${message}`;
            reject(new Error(message));
          }
        );

        spotifyPlayerInstance.addListener(
          "playback_error",
          ({ message }: { message: string }) => {
            error.value = `Spotify playback error: ${message}`;
          }
        );

        // Playback status updates
        spotifyPlayerInstance.addListener(
          "player_state_changed",
          (state: PlayerState | null) => {
            if (state) {
              spotifyPlayer.value = {
                device_id: state.device_id,
                volume: state.volume,
                paused: state.paused,
                position: state.position,
                duration: state.duration,
                track_window: state.track_window,
              };
            }
          }
        );

        // Ready
        spotifyPlayerInstance.addListener(
          "ready",
          ({ device_id }: { device_id: string }) => {
            console.log("Spotify player ready with device ID:", device_id);
            resolve(device_id);
          }
        );

        // Not Ready
        spotifyPlayerInstance.addListener(
          "not_ready",
          ({ device_id }: { device_id: string }) => {
            console.log("Device ID is not ready for playback:", device_id);
          }
        );

        // Connect to the player
        spotifyPlayerInstance.connect();
      };
    });
  };

  // Login with Spotify
  const login = () => {
    const redirectUri = `${window.location.origin}/auth/callback`;
    window.location.href = `${API_URL}/auth/login?redirect_uri=${encodeURIComponent(
      redirectUri
    )}`;
  };

  // Handle the callback from Spotify
  const handleCallback = async (code: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      const redirectUri = `${window.location.origin}/auth/callback`;
      const response = await axios.get<Player>(
        `${API_URL}/auth/callback?code=${code}&redirect_uri=${encodeURIComponent(
          redirectUri
        )}`
      );
      player.value = response.data;
      localStorage.setItem("player", JSON.stringify(response.data));
      await initializeSpotifyPlayer();
      return true;
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      console.error("Failed to handle Spotify callback:", err);
      if (axiosError.response?.status === 401) {
        error.value = "Authentication failed. Please try again.";
      } else if (axiosError.response?.data?.message) {
        error.value = axiosError.response.data.message;
      } else {
        error.value = "Failed to complete Spotify authentication";
      }
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Validate session and refresh token if needed
  const validateSession = async () => {
    if (!player.value?.id) return false;

    try {
      error.value = null;
      const response = await axios.get<Player>(
        `${API_URL}/auth/validate?playerId=${player.value.id}`
      );
      player.value = response.data;
      localStorage.setItem("player", JSON.stringify(response.data));
      return true;
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      console.error("Failed to validate session:", err);
      if (axiosError.response?.status === 401) {
        error.value = "Session expired. Please log in again.";
      } else if (axiosError.response?.data?.message) {
        error.value = axiosError.response.data.message;
      }
      player.value = null;
      localStorage.removeItem("player");
      return false;
    }
  };

  // Logout
  const logout = () => {
    player.value = null;
    spotifyPlayer.value = null;
    error.value = null;
    localStorage.removeItem("player");
  };

  return {
    player,
    spotifyPlayer,
    isLoading,
    error,
    isAuthenticated,
    hasValidToken,
    login,
    handleCallback,
    validateSession,
    logout,
    initializeSpotifyPlayer,
  };
});
