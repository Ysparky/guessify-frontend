import axios from "axios";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { PlayerInfo } from "../types/game";
import { useStatsStore } from "./stats";

const API_URL = import.meta.env.VITE_API_URL;

interface AuthPlayer extends PlayerInfo {
  accessToken: string;
  spotifyId: string;
}

interface AuthError {
  code:
    | "TOKEN_EXPIRED"
    | "TOKEN_INVALID"
    | "NO_TOKEN_FOUND"
    | "TOKEN_REFRESH_FAILED";
  message: string;
  details?: {
    playerId?: string;
    timestamp?: string;
    retryable?: boolean;
  };
}

export const useAuthStore = defineStore("auth", () => {
  const player = ref<AuthPlayer | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const isInitialized = ref(false);

  const isAuthenticated = computed(() => !!player.value);

  // Login with Spotify
  const login = () => {
    const redirectUri = `${window.location.origin}/auth/callback`;
    window.location.href = `${API_URL}/auth/login?redirect_uri=${encodeURIComponent(
      redirectUri
    )}`;
  };

  // Get the Spotify auth URL
  const getAuthUrl = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/url`);
      return response.data.url;
    } catch (err) {
      console.error("Failed to get auth URL:", err);
      error.value = "Failed to get authentication URL";
      return null;
    }
  };

  // Handle the auth callback
  const handleCallback = async (code: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${API_URL}/auth/callback`, {
        params: { code },
      });

      // Store player data including access token
      player.value = {
        id: response.data.id,
        displayName: response.data.displayName,
        avatarUrl: response.data.avatarUrl,
        spotifyId: response.data.spotifyId,
        accessToken: response.data.accessToken,
      };

      // Store in localStorage for persistence
      localStorage.setItem("player", JSON.stringify(player.value));

      return true;
    } catch (err) {
      console.error("Auth callback failed:", err);
      error.value = "Authentication failed";
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Handle auth errors and token refresh
  const handleAuthError = async (err: any): Promise<boolean> => {
    if (!err.response?.data) return false;

    const authError = err.response.data as AuthError;
    console.error("Auth error:", authError);

    switch (authError.code) {
      case "TOKEN_EXPIRED":
        if (authError.details?.retryable) {
          try {
            // Attempt token refresh
            const response = await axios.post(
              `${API_URL}/auth/refresh`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${player.value?.accessToken}`,
                },
              }
            );

            if (player.value) {
              player.value.accessToken = response.data.accessToken;
              localStorage.setItem("player", JSON.stringify(player.value));
              return true;
            }
          } catch (refreshErr) {
            console.error("Token refresh failed:", refreshErr);
          }
        }
        break;

      case "TOKEN_INVALID":
      case "NO_TOKEN_FOUND":
      case "TOKEN_REFRESH_FAILED":
        // Clear invalid session
        player.value = null;
        localStorage.removeItem("player");
        error.value = authError.message;
        // Redirect to login
        window.location.href = "/auth/login";
        break;
    }

    return false;
  };

  // Check if the user is authenticated
  const checkAuth = async () => {
    if (!player.value) return false;

    try {
      const response = await axios.get(`${API_URL}/auth/check`, {
        headers: {
          Authorization: `Bearer ${player.value.accessToken}`,
        },
      });

      if (response.data.isValid) {
        // Update player data if needed
        const { id, displayName, avatarUrl, spotifyId } = response.data.player;
        if (player.value) {
          Object.assign(player.value, {
            id,
            displayName,
            avatarUrl,
            spotifyId,
          });
          localStorage.setItem("player", JSON.stringify(player.value));
        }
        return true;
      }

      return false;
    } catch (err) {
      return handleAuthError(err);
    }
  };

  // Alias for checkAuth to maintain backward compatibility
  const validateSession = checkAuth;

  // Logout the user
  const logout = async () => {
    const statsStore = useStatsStore();
    try {
      if (player.value) {
        await axios.post(`${API_URL}/auth/logout`, {
          playerId: player.value.id,
        });
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      // Clear local state regardless of API call result
      player.value = null;
      error.value = null;
      localStorage.removeItem("player");
      statsStore.clearStats();
    }
  };

  // Clean up player reference (used when leaving games)
  const cleanupPlayer = () => {
    if (player.value) {
      // Keep auth data but remove any game-specific state
      const { id, displayName, avatarUrl, spotifyId, accessToken } =
        player.value;
      player.value = { id, displayName, avatarUrl, spotifyId, accessToken };
      // Update localStorage
      localStorage.setItem("player", JSON.stringify(player.value));
    }
  };

  // Initialize auth state
  const initialize = async () => {
    if (isInitialized.value) return;

    isLoading.value = true;
    try {
      // Try to restore session from localStorage
      const persistedPlayer = localStorage.getItem("player");
      if (persistedPlayer) {
        player.value = JSON.parse(persistedPlayer);
        // Validate the session
        const authenticated = await checkAuth();
        if (!authenticated) {
          player.value = null;
          localStorage.removeItem("player");
        }
      }
    } catch (err) {
      console.error("Failed to initialize auth:", err);
      player.value = null;
      localStorage.removeItem("player");
    } finally {
      isLoading.value = false;
      isInitialized.value = true;
    }
  };

  return {
    player,
    isLoading,
    error,
    isAuthenticated,
    isInitialized,
    login,
    handleCallback,
    checkAuth,
    validateSession,
    logout,
    cleanupPlayer,
    initialize,
    getAuthUrl,
  };
});
