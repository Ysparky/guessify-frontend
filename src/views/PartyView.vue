<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import GameResultsModal from '../components/GameResultsModal.vue'
import PlayerList from '../components/PlayerList.vue'
import SpotifyPlayer from '../components/SpotifyPlayer.vue'
import { useGameStore } from '../stores/game'
import { useStatsStore } from '../stores/stats'
import { GameStatus } from '../types/game'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const statsStore = useStatsStore()
const toast = useToast()
const userGuess = ref('')
const showCopied = ref(false)
const showGameResults = ref(false)
const selectedOption = ref<string | null>(null)
const nextRoundCountdown = ref<number | null>(null)

// Watch for game results
watch(() => statsStore.gameResults, (newResults) => {
  if (newResults) {
    showGameResults.value = true;
  }
});

// Watch for round end
watch(() => gameStore.elapsedTime, (newTime, oldTime) => {
  if (gameStore.currentRound && !selectedOption.value) {
    const duration = gameStore.currentRound.duration || 30000;
    // Check if we just crossed the duration threshold
    if (newTime >= duration && oldTime < duration) {
      // Time's up and no selection was made
      gameStore.submitAnswer('');
      selectedOption.value = '';
    }
  }
});

// Reset selected option when new round starts
watch(() => gameStore.currentRound, (newRound) => {
  if (newRound) {
    selectedOption.value = null;
  }
});

// Watch for round results to start countdown
watch(() => gameStore.roundResults, (newResults) => {
  if (newResults && 
      gameStore.currentGame?.currentRoundNumber != null && 
      gameStore.currentGame.currentRoundNumber < (gameStore.currentGame?.totalRounds || 0)
  ) {
    nextRoundCountdown.value = 3;
    const countdownInterval = setInterval(() => {
      if (nextRoundCountdown.value !== null) {
        nextRoundCountdown.value--;
        if (nextRoundCountdown.value <= 0) {
          clearInterval(countdownInterval);
          nextRoundCountdown.value = null;
        }
      }
    }, 1000);
  } else {
    nextRoundCountdown.value = null;
  }
});

// Close game results modal
const closeGameResults = () => {
  showGameResults.value = false;
  router.push('/');
};

// Join the game if not already in one
onMounted(async () => {
  if (!gameStore.isInGame) {
    await gameStore.joinGame(route.params.id as string);
  }
});

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

const submitAnswer = (answer: string) => {
  selectedOption.value = answer
  gameStore.submitAnswer(answer)
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
  <div class="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b] px-4 py-6 sm:px-6 sm:py-8">
    <div class="max-w-4xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <!-- Main Game Area -->
        <div class="md:col-span-2 space-y-4 sm:space-y-6">
          <SpotifyPlayer />
          
          <div class="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div class="flex items-center gap-3">
                <div>
                  <h2 class="text-base font-medium text-gray-400 mb-1">Room Code</h2>
                  <div class="flex items-center gap-2">
                    <code class="bg-white/5 px-3 py-1 rounded-lg text-lg font-mono text-white">
                      {{ gameStore.currentGame?.roomCode }}
                    </code>
                    <button 
                      @click="copyRoomCode"
                      class="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
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
              <div class="flex gap-3 w-full sm:w-auto">
                <button 
                  v-if="gameStore.canStartGame" 
                  @click="gameStore.startGame()"
                  class="flex-1 sm:flex-none px-4 py-2 bg-spotify-green hover:bg-spotify-green/90 text-white font-medium rounded-lg transition-colors"
                >
                  Start Game
                </button>
                <button 
                  @click="leaveParty" 
                  class="flex-1 sm:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-lg transition-colors"
                >
                  Leave Party
                </button>
              </div>
            </div>

            <div v-if="gameStore.currentRound" class="space-y-4">
              <div class="text-center mb-6">
                <div class="text-base font-medium text-gray-400 mb-1">
                  Round {{ gameStore.currentGame?.currentRoundNumber ? gameStore.currentGame.currentRoundNumber + 1 : 1 }} of {{ gameStore.currentGame?.totalRounds ?? 0 }}
                </div>
                
                <template v-if="gameStore.currentGame?.gameMode === 'MULTIPLE_CHOICE'">
                  <div class="grid grid-cols-2 gap-3">
                    <button
                      v-for="option in gameStore.currentRound.options"
                      :key="option"
                      @click="submitAnswer(option)"
                      class="p-4 rounded-xl text-left transition-colors"
                      :class="[
                        selectedOption === option 
                          ? 'bg-spotify-green/10 ring-1 ring-spotify-green text-white' 
                          : selectedOption 
                            ? 'bg-white/5 text-gray-600 cursor-not-allowed' 
                            : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
                      ]"
                      :disabled="selectedOption !== null && selectedOption !== option"
                    >
                      {{ option }}
                    </button>
                  </div>
                </template>
              </div>

              <div class="bg-white/5 p-4 rounded-xl">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        class="h-2 bg-spotify-green rounded-full transition-all duration-100"
                        :style="{ width: `${(gameStore.elapsedTime / (gameStore.currentRound?.duration || 30000)) * 100}%` }"
                      ></div>
                    </div>
                    <div class="mt-2 text-sm text-gray-400 text-right">
                      {{ Math.ceil((gameStore.currentRound?.duration || 30000) - gameStore.elapsedTime) / 1000 }}s
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Round Results -->
            <div v-else-if="gameStore.roundResults" class="space-y-4">
              <div class="text-center">
                <h3 class="text-xl font-medium text-white mb-6">Round {{ gameStore.currentGame?.currentRoundNumber }} Results</h3>
                
                <!-- Next Round Countdown -->
                <div v-if="nextRoundCountdown !== null" class="mb-6">
                  <div class="text-sm text-gray-400">Next round starting in</div>
                  <div class="text-3xl font-semibold text-spotify-green">{{ nextRoundCountdown }}s</div>
                </div>
                
                <!-- Correct Answer -->
                <div class="mb-8">
                  <div class="text-sm text-gray-400 mb-1">Correct Answer</div>
                  <div class="text-lg font-medium text-spotify-green">{{ gameStore.roundResults.correctAnswer }}</div>
                </div>
              </div>

              <!-- Player Results -->
              <div class="space-y-2">
                <div 
                  v-for="answer in gameStore.roundResults.playerAnswers" 
                  :key="answer.playerId"
                  class="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div class="flex items-center gap-3">
                    <div 
                      class="w-8 h-8 rounded-full bg-spotify-green/10 flex items-center justify-center text-spotify-green"
                    >
                      {{ gameStore.getPlayerById(answer.playerId)?.displayName.charAt(0) }}
                    </div>
                    <div>
                      <div class="font-medium text-gray-300">{{ gameStore.getPlayerById(answer.playerId)?.displayName }}</div>
                      <div class="text-sm text-gray-500">{{ answer.answer }}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div 
                      class="text-sm font-medium"
                      :class="answer.correct ? 'text-spotify-green' : 'text-red-400'"
                    >
                      {{ answer.score }} points
                    </div>
                    <div 
                      class="w-6 h-6 rounded-full flex items-center justify-center"
                      :class="answer.correct ? 'bg-spotify-green/10 text-spotify-green' : 'bg-red-400/10 text-red-400'"
                    >
                      <svg v-if="answer.correct" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="gameStore.currentGame?.status === GameStatus.WAITING" class="text-center py-12">
              <h3 class="text-xl font-medium text-white mb-2">Waiting for players...</h3>
              <p class="text-gray-400">Share the room code with your friends to start playing!</p>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="md:col-span-1">
          <PlayerList />
        </div>
      </div>
    </div>
  </div>

  <!-- Game Results Modal -->
  <GameResultsModal
    v-if="statsStore.gameResults"
    :results="statsStore.gameResults"
    :show="showGameResults"
    @close="closeGameResults"
  />
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