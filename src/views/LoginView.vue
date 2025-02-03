<script setup lang="ts">
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore()

const loginWithSpotify = () => {
  authStore.login()
}
</script>

<template>
  <div class="min-h-[80vh] flex flex-col items-center justify-center">
    <div class="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
      <h2 class="text-3xl font-bold mb-6">Welcome to Guessify</h2>
      
      <div v-if="authStore.isLoading" class="mb-6">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-spotify-green border-t-transparent mx-auto"></div>
        <p class="mt-4 text-gray-600">Connecting to Spotify...</p>
      </div>

      <div v-else-if="authStore.error" class="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
        {{ authStore.error }}
      </div>

      <div v-else>
        <p class="text-gray-600 mb-8">
          To play Guessify, you'll need to connect your Spotify Premium account.
          This allows us to play song previews during the game.
        </p>

        <button
          @click="loginWithSpotify"
          class="btn btn-primary w-full flex items-center justify-center gap-2"
        >
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          Connect with Spotify
        </button>

        <p class="mt-4 text-sm text-gray-500">
          Spotify Premium required for playback
        </p>
      </div>
    </div>
  </div>
</template> 