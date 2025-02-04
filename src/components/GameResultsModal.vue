<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import type { GameResults } from '../types/stats';

const props = defineProps<{
  results: GameResults;
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const authStore = useAuthStore();

const isWinner = computed(() => 
  props.results.winner.id === authStore.player?.id
);
</script>

<template>
  <div 
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click="emit('close')"
  >
    <div 
      class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Header -->
      <div class="p-6 text-center border-b border-gray-200">
        <h2 class="text-3xl font-bold mb-2">Game Over!</h2>
        <div 
          class="text-xl"
          :class="isWinner ? 'text-spotify-green' : 'text-gray-600'"
        >
          {{ isWinner ? 'You won!' : `${results.winner.displayName} wins!` }}
        </div>
      </div>

      <!-- Rankings -->
      <div class="p-6">
        <div class="space-y-4">
          <div 
            v-for="player in results.rankings" 
            :key="player.playerId"
            class="flex items-center gap-4 p-4 rounded-lg"
            :class="[
              player.playerId === authStore.player?.id 
                ? 'bg-spotify-green bg-opacity-5' 
                : 'bg-gray-50'
            ]"
          >
            <!-- Rank -->
            <div class="text-2xl font-bold text-gray-400 w-12">
              #{{ player.rank }}
            </div>

            <!-- Player Info -->
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ player.displayName }}</span>
                <span 
                  v-if="player.playerId === authStore.player?.id"
                  class="text-xs text-gray-500"
                >
                  (You)
                </span>
              </div>
              <div class="text-sm text-gray-600">
                {{ player.correctAnswers }}/{{ player.totalAnswers }} correct answers
              </div>
            </div>

            <!-- Score -->
            <div class="text-right">
              <div class="font-semibold">{{ player.totalScore }}</div>
              <div class="text-sm text-gray-500">points</div>
            </div>
          </div>
        </div>

        <!-- Game Stats -->
        <div class="mt-8 pt-6 border-t border-gray-200 grid grid-cols-2 gap-4 text-center">
          <div>
            <div class="text-sm text-gray-600">Average Score</div>
            <div class="text-xl font-semibold">{{ Math.round(results.averageScore) }}</div>
          </div>
          <div>
            <div class="text-sm text-gray-600">Total Rounds</div>
            <div class="text-xl font-semibold">{{ results.totalRoundsPlayed - 1 }}</div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="p-6 border-t border-gray-200 flex justify-end">
        <button 
          @click="emit('close')"
          class="btn btn-primary"
        >
          Back to Home
        </button>
      </div>
    </div>
  </div>
</template> 