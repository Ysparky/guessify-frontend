<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import PlayerList from '../components/PlayerList.vue'
import { useGameStore } from '../stores/game'
import { GameStatus } from '../types/game'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const toast = useToast()
const userGuess = ref('')
const showCopied = ref(false)

// Join the game if not already in one
onMounted(async () => {
  if (!gameStore.isInGame) {
    await gameStore.joinGame(route.params.id as string)
  }
})

// Cleanup on component unmount
onUnmounted(() => {
  gameStore.leaveGame()
})

// Watch for error changes and show toast
watch(() => gameStore.error, (newError) => {
  if (newError) {
    if (newError.toLowerCase().includes('error')) {
      toast.error(newError)
    } else {
      toast.info(newError)
    }
    // Clear the error after showing toast
    gameStore.error = null
  }
})

const submitGuess = () => {
  if (!userGuess.value) return
  gameStore.submitAnswer(userGuess.value)
  userGuess.value = ''
}

const leaveParty = () => {
  gameStore.leaveGame()
  router.push('/')
}

const copyRoomCode = async () => {
  if (!gameStore.currentGame?.roomCode) return
  
  try {
    await navigator.clipboard.writeText(gameStore.currentGame.roomCode)
    showCopied.value = true
    toast.success('Room code copied to clipboard!')
    setTimeout(() => {
      showCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
    toast.error('Failed to copy room code')
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Main Game Area -->
      <div class="md:col-span-2">
        <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-3">
              <div>
                <h2 class="text-2xl font-bold mb-1">Room Code:</h2>
                <div class="flex items-center gap-2">
                  <code class="bg-gray-100 px-3 py-1 rounded text-lg font-mono">
                    {{ gameStore.currentGame?.roomCode }}
                  </code>
                  <button 
                    @click="copyRoomCode"
                    class="p-2 text-gray-500 hover:text-spotify-green transition-colors rounded-lg hover:bg-gray-100"
                    title="Copy room code"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div class="flex gap-4 items-center">
              <button 
                v-if="gameStore.canStartGame" 
                @click="gameStore.startGame()"
                class="btn btn-primary"
              >
                Start Game
              </button>
              <button @click="leaveParty" class="btn btn-secondary">Leave Party</button>
            </div>
          </div>

          <div v-if="gameStore.currentGame?.status === GameStatus.WAITING" class="text-center py-8">
            <h3 class="text-xl font-semibold mb-2">Waiting for players...</h3>
            <p class="text-gray-600">Share the room code with your friends to start playing!</p>
          </div>

          <div v-else-if="gameStore.currentRound" class="space-y-6">
            <div class="bg-gray-100 p-4 rounded-lg">
              <div class="text-center">
                <div class="text-lg font-semibold mb-2">
                  Round {{ gameStore.currentGame?.currentRoundNumber }} of {{ gameStore.currentGame?.totalRounds }}
                </div>
                
                <template v-if="gameStore.currentGame?.gameMode === 'MULTIPLE_CHOICE'">
                  <div class="grid grid-cols-2 gap-4">
                    <button
                      v-for="option in gameStore.currentRound.options"
                      :key="option"
                      @click="gameStore.submitAnswer(option)"
                      class="btn btn-secondary"
                    >
                      {{ option }}
                    </button>
                  </div>
                </template>
                
                <template v-else>
                  <div class="text-2xl font-mono tracking-wider mb-4">
                    {{ gameStore.currentRound.revealedLetters }}
                  </div>
                  <form @submit.prevent="submitGuess" class="flex gap-2 max-w-md mx-auto">
                    <input
                      v-model="userGuess"
                      type="text"
                      class="flex-1 px-4 py-2 border rounded-lg"
                      placeholder="Type your guess..."
                    >
                    <button type="submit" class="btn btn-primary">Submit</button>
                  </form>
                </template>
              </div>
            </div>

            <div class="bg-gray-100 p-4 rounded-lg">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="h-2 bg-gray-200 rounded-full">
                    <div
                      class="h-2 bg-spotify-green rounded-full transition-all duration-1000"
                      :style="{ width: `${(gameStore.currentRound.duration / 30000) * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="md:col-span-1">
        <PlayerList />
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-out {
  animation: fadeOut 2s ease-in-out;
}

@keyframes fadeOut {
  0% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; }
}
</style> 