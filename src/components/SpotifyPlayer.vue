<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useGameStore } from '../stores/game';

const gameStore = useGameStore();
const authStore = useAuthStore();
const player = ref<Spotify.Player | null>(null);
const deviceId = ref<string | null>(null);
const error = ref<string | null>(null);
const isInitializing = ref(true);

const initializePlayer = async () => {
  try {
    isInitializing.value = true;
    error.value = null;
    
    // Load Spotify Web Playback SDK script
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    // Initialize player when SDK is loaded
    window.onSpotifyWebPlaybackSDKReady = () => {
      player.value = new window.Spotify.Player({
        name: 'Guessify Web Player',
        getOAuthToken: cb => {
          // Get token from auth store or backend
          if (authStore.player?.accessToken) {
            cb(authStore.player.accessToken);
          }
        },
        volume: 0.5
      });

      // Error handling
      player.value?.addListener('initialization_error', ({ message }) => {
        console.error('Failed to initialize player:', message);
        error.value = 'Failed to initialize player';
        isInitializing.value = false;
      });

      player.value?.addListener('authentication_error', ({ message }) => {
        console.error('Failed to authenticate:', message);
        error.value = 'Failed to authenticate';
        isInitializing.value = false;
      });

      player.value?.addListener('account_error', ({ message }) => {
        console.error('Failed to validate Spotify account:', message);
        error.value = 'Premium account required';
        isInitializing.value = false;
      });

      player.value?.addListener('playback_error', ({ message }) => {
        console.error('Failed to perform playback:', message);
        error.value = 'Playback error occurred';
      });

      // Ready
      player.value?.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        deviceId.value = device_id;
        isInitializing.value = false;
        // Set this as the active device
        gameStore.setActiveDevice(device_id);
      });

      // Not Ready
      player.value?.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        deviceId.value = null;
        error.value = 'Player went offline';
      });

      // Connect to the player
      player.value?.connect();
    };
  } catch (err) {
    console.error('Failed to initialize Spotify player:', err);
    error.value = 'Failed to initialize player';
    isInitializing.value = false;
  }
};

// Cleanup function
const cleanup = () => {
  if (player.value) {
    player.value.disconnect();
    player.value = null;
  }
  deviceId.value = null;
  isInitializing.value = false;
  error.value = null;
};

onMounted(() => {
  initializePlayer();
});

onUnmounted(() => {
  cleanup();
});
</script>

<template>
  <div class="mb-6 p-4 bg-gray-50 rounded-lg">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="text-spotify-green">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <div>
          <div class="font-medium">Guessify Web Player</div>
          <div class="text-sm text-gray-500">
            {{ isInitializing ? 'Initializing...' : deviceId ? 'Ready to play' : 'Not connected' }}
          </div>
        </div>
      </div>
      
      <!-- Status Indicator -->
      <div v-if="isInitializing" class="animate-spin rounded-full h-5 w-5 border-b-2 border-spotify-green"></div>
      <div v-else-if="deviceId" class="text-spotify-green">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mt-3 text-red-500 text-sm">
      {{ error }}
      <button 
        @click="initializePlayer"
        class="text-spotify-green hover:text-spotify-green-dark ml-2"
      >
        Try Again
      </button>
    </div>
  </div>
</template> 