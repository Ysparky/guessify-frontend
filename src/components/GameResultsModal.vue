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
    class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    @click="emit('close')"
  >
    <div 
      class="bg-[#0f172a] border border-white/5 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20"
      @click.stop
    >
      <!-- Header -->
      <div class="p-6 text-center border-b border-white/5">
        <h2 class="text-3xl font-bold text-white mb-2">Game Over!</h2>
        <div 
          class="text-xl font-medium"
          :class="isWinner ? 'text-spotify-green' : 'text-gray-400'"
        >
          {{ isWinner ? 'You won!' : `${results.winner.displayName} wins!` }}
        </div>
      </div>

      <!-- Rankings -->
      <div class="p-6">
        <div class="space-y-2">
          <div 
            v-for="player in results.rankings" 
            :key="player.playerId"
            class="flex items-center gap-4 p-4 rounded-xl transition-colors"
            :class="[
              player.playerId === authStore.player?.id 
                ? 'bg-spotify-green/10 ring-1 ring-spotify-green' 
                : 'bg-white/5 hover:bg-white/[0.07]'
            ]"
          >
            <!-- Rank -->
            <div 
              class="text-2xl font-bold w-12"
              :class="[
                player.rank === 1 ? 'text-spotify-green' :
                player.rank === 2 ? 'text-gray-300' :
                player.rank === 3 ? 'text-amber-500' : 'text-gray-500'
              ]"
            >
              #{{ player.rank }}
            </div>

            <!-- Player Info -->
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-200">{{ player.displayName }}</span>
                <span 
                  v-if="player.playerId === authStore.player?.id"
                  class="text-xs text-spotify-green font-medium"
                >
                  (You)
                </span>
              </div>
              <div class="text-sm text-gray-400">
                {{ player.correctAnswers }}/{{ player.totalAnswers }} correct answers
              </div>
            </div>

            <!-- Score -->
            <div class="text-right">
              <div class="font-semibold text-gray-200">{{ player.totalScore }}</div>
              <div class="text-sm text-gray-500">points</div>
            </div>
          </div>
        </div>

        <!-- Game Stats -->
        <div class="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4 text-center">
          <div class="p-4 bg-white/5 rounded-xl">
            <div class="text-sm text-gray-400 mb-1">Average Score</div>
            <div class="text-2xl font-semibold text-gray-200">{{ Math.round(results.averageScore) }}</div>
          </div>
          <div class="p-4 bg-white/5 rounded-xl">
            <div class="text-sm text-gray-400 mb-1">Total Rounds</div>
            <div class="text-2xl font-semibold text-gray-200">{{ results.totalRoundsPlayed - 1 }}</div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="p-6 border-t border-white/5 flex justify-end">
        <button 
          @click="emit('close')"
          class="px-6 py-3 bg-spotify-green hover:bg-spotify-green/90 text-white font-medium rounded-xl transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
</style> 