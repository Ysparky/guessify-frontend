import axios, { AxiosError } from "axios";
import { defineStore } from "pinia";
import type { Socket } from "socket.io-client";
import io from "socket.io-client";
import { computed, ref } from "vue";
import type { Player, SpotifyPlayer } from "../types/auth";
import { useStatsStore } from "./stats";

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

interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  volume_percent: number;
}

export const useAuthStore = defineStore("auth", () => {
  const player = ref<Player | null>(null);
  const spotifyPlayer = ref<SpotifyPlayer | null>(null);
  const availableDevices = ref<SpotifyDevice[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const socket = ref<Socket | null>(null);

  // Initialize socket connection
  const setupSocket = () => {
    socket.value = io("http://localhost:3000");

    socket.value.on("devices", (data: { devices: SpotifyDevice[] }) => {
      availableDevices.value = data.devices;
    });

    socket.value.on("deviceSet", (data: { deviceId: string }) => {
      console.log("Active device set:", data.deviceId);
    });

    socket.value.on("error", (data: { message: string }) => {
      error.value = data.message;
    });
  };

  // Request available devices
  const getDevices = () => {
    if (!socket.value || !player.value?.id) return;
    socket.value.emit("getDevices", {
      playerId: player.value.id,
    });
  };

  // Set active device
  const setActiveDevice = (deviceId: string) => {
    if (!socket.value || !player.value?.id) return;
    socket.value.emit("setActiveDevice", {
      playerId: player.value.id,
      deviceId,
    });
  };

  // Helper function to connect the Spotify player
  const connectPlayer = (
    resolve: (value: unknown) => void,
    reject: (reason?: any) => void
  ) => {
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
        // On playback error, refresh devices and try to recover
        getDevices();
        initializeSpotifyPlayer(true).catch(console.error);
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
        // Always set this device as active when it's ready
        setActiveDevice(device_id);
        resolve(device_id);
      }
    );

    // Not Ready
    spotifyPlayerInstance.addListener(
      "not_ready",
      ({ device_id }: { device_id: string }) => {
        console.log("Device ID is not ready for playback:", device_id);
        // When device becomes not ready, try to reinitialize
        initializeSpotifyPlayer(true).catch(console.error);
      }
    );

    // Connect to the player
    spotifyPlayerInstance.connect();
  };

  // Initialize or reinitialize Spotify Web Playback SDK
  const initializeSpotifyPlayer = async (forceReconnect: boolean = false) => {
    if (!player.value?.accessToken) return;

    // If we're forcing a reconnect, clear the existing player
    if (forceReconnect && spotifyPlayer.value) {
      spotifyPlayer.value = null;
    }

    return new Promise((resolve, reject) => {
      // Always create a new player instance to get a fresh device ID
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;

      document.body.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = () => {
        connectPlayer(resolve, reject);
      };
    });
  };

  // Load persisted player data and initialize if needed
  try {
    const persistedPlayer = localStorage.getItem("player");
    if (persistedPlayer) {
      player.value = JSON.parse(persistedPlayer);
      // If we have a valid player, initialize everything immediately
      if (player.value) {
        setupSocket();
        initializeSpotifyPlayer().catch(console.error);
        getDevices();
      }
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

      // Setup socket connection after successful login
      setupSocket();

      // Initialize Spotify player
      await initializeSpotifyPlayer();

      // Get available devices
      getDevices();

      return true;
    } catch (err) {
      console.log(err);
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

      // After validating session, check devices and reinitialize player if needed
      setupSocket();
      getDevices();
      await initializeSpotifyPlayer(true);

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
    const statsStore = useStatsStore();
    player.value = null;
    spotifyPlayer.value = null;
    error.value = null;
    localStorage.removeItem("player");
    statsStore.clearStats();
  };

  return {
    player,
    spotifyPlayer,
    availableDevices,
    isLoading,
    error,
    isAuthenticated,
    hasValidToken,
    login,
    handleCallback,
    validateSession,
    logout,
    initializeSpotifyPlayer,
    getDevices,
    setActiveDevice,
  };
});
