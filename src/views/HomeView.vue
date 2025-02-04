<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Leaderboard from '../components/Leaderboard.vue'
import { useGameStore } from '../stores/game'

const router = useRouter()
const gameStore = useGameStore()
const roomCode = ref('')
const showJoinInput = ref(false)

const createNewParty = () => {
  router.push('/create')
}

const joinParty = async () => {
  if (!roomCode.value) return
  await gameStore.joinGame(roomCode.value.toUpperCase())
  if (gameStore.currentGame) {
    router.push(`/party/${gameStore.currentGame.roomCode}`)
  }
}
</script>

<template>
  <div class="h-full bg-gradient-to-b from-[#0f172a] to-[#1e293b] px-6 py-8 sm:py-12">
    <div class="max-w-md mx-auto space-y-8 sm:space-y-12">
      <!-- Simple Logo and Title -->
      <div class="text-center space-y-4 sm:space-y-6">
        <div class="w-16 h-16 mx-auto bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
          <svg class="w-8 h-8 text-spotify-green/90" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </div>
        <div class="space-y-3">
          <h1 class="text-4xl font-bold text-white">
            Guessify
          </h1>
          <p class="text-lg text-gray-400">
            Guess songs with friends
          </p>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="gameStore.error" 
           class="px-4 py-3 bg-red-500/10 text-red-400 text-center rounded-xl text-sm animate-shake">
        {{ gameStore.error }}
      </div>

      <!-- Action Buttons -->
      <div v-if="!showJoinInput" 
           class="space-y-3 sm:space-y-4 animate-fadeIn">
        <button @click="createNewParty" 
                class="w-full px-6 py-3.5 bg-spotify-green/90 hover:bg-spotify-green text-white font-medium rounded-xl transition-colors">
          Create New Party
        </button>
        <button @click="showJoinInput = true" 
                class="w-full px-6 py-3.5 bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-xl transition-colors">
          Join Party
        </button>
      </div>

      <!-- Join Form -->
      <form v-else @submit.prevent="joinParty" 
            class="space-y-3 sm:space-y-4 animate-fadeIn">
        <input
          v-model="roomCode"
          type="text"
          placeholder="Enter room code"
          class="w-full px-6 py-3.5 bg-white/5 text-white rounded-xl text-center text-lg placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-spotify-green/50"
          maxlength="6"
          autocomplete="off"
        >
        <div class="flex gap-3">
          <button type="button" @click="showJoinInput = false" 
                  class="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-xl transition-colors">
            Back
          </button>
          <button type="submit" 
                  class="flex-1 px-6 py-3 bg-spotify-green/90 hover:bg-spotify-green text-white font-medium rounded-xl transition-colors">
            Join
          </button>
        </div>
      </form>

      <!-- Simple Feature Card -->
      <div class="pt-2 sm:pt-4">
        <div class="p-5 bg-white/5 backdrop-blur-sm border border-white/5 rounded-xl">
          <p class="text-gray-400 text-center text-sm">
            Create a room and invite friends to join your music guessing party 🎵
          </p>
        </div>
      </div>

      <!-- Leaderboard -->
      <Leaderboard />
    </div>
  </div>
</template>

<style scoped>
.animate-fadeIn {
  animation: fadeIn 0.4s ease-out;
}

.animate-shake {
  animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes fadeIn {
  from { 
    opacity: 0;
    transform: translateY(10px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(1px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-2px, 0, 0); }
  40%, 60% { transform: translate3d(2px, 0, 0); }
}
</style> 