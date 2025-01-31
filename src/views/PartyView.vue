<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const partyId = route.params.id as string

// Placeholder state
const currentSong = ref({
  isPlaying: false,
  progress: 0,
  title: ''
})

const gameState = ref({
  mode: 'multiple-choice',
  options: ['Song 1', 'Song 2', 'Song 3', 'Song 4'],
  revealedLetters: '_ _ _ _ _'
})
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">Party ID: {{ partyId }}</h2>
        <button class="btn btn-secondary">Leave Party</button>
      </div>

      <div class="space-y-6">
        <div class="bg-gray-100 p-4 rounded-lg">
          <div class="text-center">
            <div class="text-lg font-semibold mb-2">
              {{ gameState.mode === 'multiple-choice' ? 'Choose the correct song:' : 'Guess the song:' }}
            </div>
            
            <template v-if="gameState.mode === 'multiple-choice'">
              <div class="grid grid-cols-2 gap-4">
                <button
                  v-for="option in gameState.options"
                  :key="option"
                  class="btn btn-secondary"
                >
                  {{ option }}
                </button>
              </div>
            </template>
            
            <template v-else>
              <div class="text-2xl font-mono tracking-wider">
                {{ gameState.revealedLetters }}
              </div>
              <input
                type="text"
                class="mt-4 w-full max-w-md mx-auto px-4 py-2 border rounded-lg"
                placeholder="Type your guess..."
              >
            </template>
          </div>
        </div>

        <div class="bg-gray-100 p-4 rounded-lg">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="h-2 bg-gray-200 rounded-full">
                <div
                  class="h-2 bg-spotify-green rounded-full"
                  :style="{ width: `${currentSong.progress}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 