<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useStatsStore } from '../stores/stats';
import LeaderboardModal from './LeaderboardModal.vue';

const statsStore = useStatsStore();
const showModal = ref(false);

onMounted(async () => {
  try {
    await statsStore.getLeaderboard(3); // Get only top 3 players
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
  }
});
</script>

<template>
  <div class="w-full max-w-md mx-auto mt-12 px-4">
    <div class="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden">
      <div class="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <h2 class="text-lg font-medium text-white/90">Top Players</h2>
        <button 
          @click="showModal = true"
          class="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
        >
          View All
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div class="divide-y divide-white/5">
        <div v-if="statsStore.isLoading" class="px-6 py-8 text-center text-gray-400">
          <div class="animate-pulse flex justify-center">
            <div class="w-6 h-6 bg-white/10 rounded-full"></div>
          </div>
        </div>

        <div v-else-if="statsStore.error" class="px-6 py-4 text-center text-red-400 text-sm">
          {{ statsStore.error }}
        </div>
        
        <template v-else>
          <div v-for="(entry, index) in statsStore.leaderboard" 
               :key="entry.playerId"
               class="px-6 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors group">
            <!-- Rank -->
            <div class="w-6 text-center">
              <span :class="[
                'font-medium',
                index === 0 ? 'text-yellow-500' :
                index === 1 ? 'text-gray-300' :
                index === 2 ? 'text-amber-600' :
                'text-gray-500'
              ]">
                #{{ index + 1 }}
              </span>
            </div>
            
            <!-- Player -->
            <div class="flex-1 flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-spotify-green/10 ring-1 ring-white/10 flex items-center justify-center text-sm font-medium text-spotify-green/90">
                {{ entry.displayName.charAt(0) }}
              </div>
              <span class="text-sm text-gray-300 group-hover:text-white transition-colors">
                {{ entry.displayName }}
              </span>
            </div>
            
            <!-- Stats -->
            <div class="text-right">
              <div class="text-sm font-medium text-gray-300">{{ Math.round(entry.averageScore) }}</div>
              <div class="text-xs text-gray-500">
                <span class="text-spotify-green">{{ entry.gamesWon }}</span>
                <span class="mx-1">/</span>
                <span>{{ entry.totalGames }} games</span>
              </div>
            </div>
          </div>

          <div v-if="statsStore.leaderboard.length === 0" 
               class="px-6 py-4 text-center text-gray-500 text-sm">
            No players yet
          </div>
        </template>
      </div>
    </div>
  </div>

  <!-- Full Leaderboard Modal -->
  <LeaderboardModal 
    :show="showModal"
    @close="showModal = false"
  />
</template> 