<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ArtistSearch from '../components/ArtistSearch.vue'
import PlaylistSelector from '../components/PlaylistSelector.vue'
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
const totalRounds = ref(10)
const settingsTab = ref<'mode' | 'settings'>('mode')

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
  <div class="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b] flex flex-col">
    <div class="flex-1 px-4 py-6 sm:px-6 sm:py-8 pb-24">
      <div class="max-w-2xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl sm:text-4xl font-bold text-white">
            Create New Party
          </h2>
          <button 
            type="button" 
            @click="router.push('/')" 
            class="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <form id="create-party-form" @submit.prevent="createParty" class="space-y-4 sm:space-y-6">
          <!-- Game Settings -->
          <div class="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden">
            <!-- Settings Tabs -->
            <div class="flex justify-center gap-8 sm:gap-12 border-b border-white/5">
              <button
                type="button"
                class="px-4 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium transition-colors relative"
                :class="settingsTab === 'mode' ? 'text-spotify-green' : 'text-gray-400 hover:text-white'"
                @click="settingsTab = 'mode'"
              >
                Game Mode
                <div
                  v-if="settingsTab === 'mode'"
                  class="absolute bottom-0 left-0 w-full h-0.5 bg-spotify-green"
                ></div>
              </button>
              <button
                type="button"
                class="px-4 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium transition-colors relative"
                :class="settingsTab === 'settings' ? 'text-spotify-green' : 'text-gray-400 hover:text-white'"
                @click="settingsTab = 'settings'"
              >
                Settings
                <div
                  v-if="settingsTab === 'settings'"
                  class="absolute bottom-0 left-0 w-full h-0.5 bg-spotify-green"
                ></div>
              </button>
            </div>

            <!-- Tab Content Container -->
            <div class="min-h-[160px] sm:min-h-[200px] p-4 sm:p-6">
              <!-- Game Mode Tab -->
              <div v-if="settingsTab === 'mode'" class="h-full flex items-center">
                <div class="grid grid-cols-1 gap-3 w-full">
                  <div 
                    class="p-3 sm:p-4 rounded-lg sm:rounded-xl text-left transition-colors"
                    :class="[
                      gameMode === GameMode.MULTIPLE_CHOICE
                        ? 'bg-spotify-green/10 ring-1 ring-spotify-green'
                        : 'bg-white/5 hover:bg-white/10'
                    ]"
                    role="button"
                    @click="gameMode = GameMode.MULTIPLE_CHOICE"
                  >
                    <div class="flex items-center justify-between mb-1">
                      <div class="font-medium text-gray-300">Multiple Choice</div>
                      <div v-if="gameMode === GameMode.MULTIPLE_CHOICE" class="text-xs text-spotify-green font-medium">Selected</div>
                    </div>
                    <p class="text-sm text-gray-500">
                      Players choose from 4 options. Great for casual play and larger groups.
                    </p>
                  </div>

                  <div 
                    class="p-3 sm:p-4 rounded-lg sm:rounded-xl text-left bg-white/5 opacity-50"
                  >
                    <div class="flex items-center justify-between mb-1">
                      <div class="font-medium text-gray-300">Letter Reveal</div>
                      <div class="text-xs text-gray-600 font-medium">Coming Soon</div>
                    </div>
                    <p class="text-sm text-gray-500">
                      Letters are revealed as the song plays. Perfect for music experts.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Game Settings Tab -->
              <div v-if="settingsTab === 'settings'" class="h-full flex items-center justify-center">
                <div class="flex flex-col items-center">
                  <!-- Number of Rounds -->
                  <label class="text-sm font-medium text-gray-400 mb-2 sm:mb-3">Number of Rounds</label>
                  <div class="flex items-center gap-3 sm:gap-4">
                    <button
                      type="button"
                      class="w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-white/5"
                      :disabled="totalRounds <= 5"
                      @click="totalRounds--"
                    >
                      <span class="text-lg sm:text-xl font-medium text-gray-400">-</span>
                    </button>
                    <div class="w-10 sm:w-12 text-center">
                      <span class="text-2xl sm:text-3xl font-semibold text-spotify-green">{{ totalRounds }}</span>
                    </div>
                    <button
                      type="button"
                      class="w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-white/5"
                      :disabled="totalRounds >= 15"
                      @click="totalRounds++"
                    >
                      <span class="text-lg sm:text-xl font-medium text-gray-400">+</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Music Source Selection -->
          <div class="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden">
            <!-- Source Type Tabs -->
            <div class="flex gap-6 sm:gap-12 justify-center border-b border-white/5">
              <button
                type="button"
                class="px-4 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium transition-colors relative"
                :class="songSource === 'playlist' ? 'text-spotify-green' : 'text-gray-400 hover:text-white'"
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
                class="px-4 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium transition-colors relative"
                :class="songSource === 'artist' ? 'text-spotify-green' : 'text-gray-400 hover:text-white'"
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
                class="px-4 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium transition-colors relative"
                :class="songSource === 'random' ? 'text-spotify-green' : 'text-gray-400 hover:text-white'"
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
            <div class="min-h-[280px] p-4 sm:p-8">
              <div v-if="songSource === 'playlist'" class="h-[280px] overflow-y-auto scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                <PlaylistSelector 
                  v-model="selectedPlaylistId" 
                />
              </div>

              <div v-else-if="songSource === 'artist'" class="h-[280px] overflow-y-auto scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                <div class="pr-4">
                  <ArtistSearch 
                    v-model="selectedArtistId"
                  />
                </div>
              </div>

              <div v-else class="h-[280px] flex items-center justify-center">
                <div class="text-center px-4 py-6 bg-white/5 rounded-lg sm:rounded-xl border border-white/5 w-full">
                  <p class="text-gray-400">
                    Songs will be randomly selected from Spotify's most popular tracks
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" 
               class="px-4 py-3 bg-red-500/10 text-red-400 text-center rounded-lg sm:rounded-xl text-sm animate-shake">
            {{ error }}
          </div>
        </form>
      </div>
    </div>

    <!-- Fixed Create Party Button -->
    <div class="sticky bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-[#0f172a] to-transparent">
      <div class="max-w-2xl mx-auto">
        <button
          type="submit"
          form="create-party-form"
          class="w-full px-6 sm:px-8 py-4 bg-spotify-green hover:bg-spotify-green/90 text-white font-medium rounded-xl shadow-lg transition-all hover:shadow-spotify-green/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          :disabled="loading || ((songSource === 'playlist' && !selectedPlaylistId) || 
                    (songSource === 'artist' && !selectedArtistId))"
        >
          <span v-if="loading" class="flex items-center justify-center gap-2">
            <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Creating...
          </span>
          <span v-else class="flex items-center justify-center gap-2">
            Create Party
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-shake {
  animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(1px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-2px, 0, 0); }
  40%, 60% { transform: translate3d(2px, 0, 0); }
}

/* Custom Scrollbar */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) rgba(255, 255, 255, 0.05);
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: var(--scrollbar-track, rgba(255, 255, 255, 0.05));
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb, rgba(255, 255, 255, 0.1));
  border-radius: 3px;
  transition: background-color 0.2s;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover, rgba(255, 255, 255, 0.2));
}

/* Hide scrollbar when not needed */
.scrollbar-thin::-webkit-scrollbar {
  display: none;
}

.scrollbar-thin:hover::-webkit-scrollbar {
  display: block;
}

@supports (scrollbar-width: thin) {
  .scrollbar-thin {
    scrollbar-width: none;
  }
  
  .scrollbar-thin:hover {
    scrollbar-width: thin;
  }
}
</style> 