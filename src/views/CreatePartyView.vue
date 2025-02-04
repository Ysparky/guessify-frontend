<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ArtistSearch from '../components/ArtistSearch.vue'
import PlaylistSelector from '../components/PlaylistSelector.vue'
import SpotifyPlayer from '../components/SpotifyPlayer.vue'
import { useAuthStore } from '../stores/auth'
import { useGameStore } from '../stores/game'
import type { GameSettings } from '../types/game'
import { GameMode } from '../types/game'

const router = useRouter()
const gameStore = useGameStore()
const authStore = useAuthStore()

const gameMode = ref<GameMode>(GameMode.MULTIPLE_CHOICE)
const songSource = ref<'playlist' | 'artist' | 'random'>('playlist')
const selectedPlaylistId = ref<string | null>(null)
const selectedArtistId = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const totalRounds = ref(5)

const createParty = async () => {
  if (songSource.value !== 'random' && !selectedPlaylistId.value && !selectedArtistId.value) {
    error.value = "Please select a playlist or artist"
    return
  }

  loading.value = true
  error.value = null

  try {
    const settings: GameSettings = {
      totalRounds: totalRounds.value,
      gameMode: GameMode.MULTIPLE_CHOICE,
      songSource: {
        type: songSource.value,
        id: songSource.value === 'random' ? null : (selectedPlaylistId.value || selectedArtistId.value),
        ownerId: authStore.player?.id || "",
      },
    }

    await gameStore.createGame(settings)
    if (gameStore.currentGame) {
      router.push(`/party/${gameStore.currentGame.roomCode}`)
    }
  } catch (err) {
    console.error(err)
    error.value = "Failed to create party"
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <SpotifyPlayer />
    
    <h2 class="text-3xl font-bold mb-8">Create New Party</h2>
    
    <form @submit.prevent="createParty" class="space-y-8">
      <!-- Round Selection -->
      <div>
        <h3 class="text-xl font-semibold mb-4">Number of Rounds</h3>
        <div class="flex items-center gap-4">
          <input
            v-model="totalRounds"
            type="range"
            min="3"
            max="10"
            step="1"
            class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-spotify-green"
          >
          <div class="w-16 text-center">
            <span class="text-2xl font-semibold">{{ totalRounds }}</span>
            <div class="text-sm text-gray-600">rounds</div>
          </div>
        </div>
      </div>

      <!-- Game Mode Selection -->
      <div>
        <h3 class="text-xl font-semibold mb-4">Game Mode</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            class="p-6 rounded-lg text-left transition-colors border-2"
            :class="[
              gameMode === GameMode.MULTIPLE_CHOICE
                ? 'bg-spotify-green bg-opacity-10 border-spotify-green'
                : 'bg-gray-50 hover:bg-gray-100 border-transparent'
            ]"
            @click="gameMode = GameMode.MULTIPLE_CHOICE"
          >
            <div class="font-semibold mb-2">Multiple Choice</div>
            <p class="text-sm text-gray-600">
              Players choose from 4 options. Great for casual play and larger groups.
            </p>
          </button>

          <button
            type="button"
            class="p-6 rounded-lg text-left transition-colors border-2 opacity-50 cursor-not-allowed"
            disabled
          >
            <div class="font-semibold mb-2">Letter Reveal (Coming Soon)</div>
            <p class="text-sm text-gray-600">
              Letters are revealed as the song plays. Perfect for music experts.
            </p>
          </button>
        </div>
      </div>

      <!-- Music Source Selection -->
      <div>
        <h3 class="text-xl font-semibold mb-4">Music Source</h3>
        <div class="space-y-6">
          <!-- Source Type Tabs -->
          <div class="flex gap-4 border-b border-gray-200">
            <button
              type="button"
              class="px-4 py-2 font-medium transition-colors relative"
              :class="songSource === 'playlist' ? 'text-spotify-green' : 'text-gray-600 hover:text-gray-900'"
              @click="songSource = 'playlist'"
            >
              Your Playlists
              <div
                v-if="songSource === 'playlist'"
                class="absolute bottom-0 left-0 w-full h-0.5 bg-spotify-green"
              ></div>
            </button>
            <button
              type="button"
              class="px-4 py-2 font-medium transition-colors relative"
              :class="songSource === 'artist' ? 'text-spotify-green' : 'text-gray-600 hover:text-gray-900'"
              @click="songSource = 'artist'"
            >
              Search Artist
              <div
                v-if="songSource === 'artist'"
                class="absolute bottom-0 left-0 w-full h-0.5 bg-spotify-green"
              ></div>
            </button>
            <button
              type="button"
              class="px-4 py-2 font-medium transition-colors relative"
              :class="songSource === 'random' ? 'text-spotify-green' : 'text-gray-600 hover:text-gray-900'"
              @click="songSource = 'random'"
            >
              Random
              <div
                v-if="songSource === 'random'"
                class="absolute bottom-0 left-0 w-full h-0.5 bg-spotify-green"
              ></div>
            </button>
          </div>

          <!-- Source Selection -->
          <div v-if="songSource === 'playlist'">
            <PlaylistSelector v-model="selectedPlaylistId" />
          </div>

          <div v-else-if="songSource === 'artist'">
            <ArtistSearch v-model="selectedArtistId" />
          </div>

          <div v-else class="text-center py-8 bg-gray-50 rounded-lg">
            <p class="text-gray-600">
              Songs will be randomly selected from Spotify's most popular tracks
            </p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end gap-4">
        <button type="button" @click="router.push('/')" class="btn btn-secondary">
          Cancel
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="(songSource === 'playlist' && !selectedPlaylistId) || 
                    (songSource === 'artist' && !selectedArtistId)"
        >
          Create Party
        </button>
      </div>
    </form>
  </div>
</template> 