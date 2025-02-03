<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useToast } from 'vue-toastification';
import { useAuthStore } from '../stores/auth';
import { useStatsStore } from '../stores/stats';

const authStore = useAuthStore();
const statsStore = useStatsStore();
const toast = useToast();
const activeTab = ref<'personal' | 'leaderboard'>('personal');

// Load initial data
onMounted(async () => {
  if (authStore.player?.id) {
    try {
      await statsStore.getPlayerStats(authStore.player.id);
      await statsStore.getLeaderboard();
    } catch (err) {
      toast.error('Failed to load statistics');
    }
  }
});
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <h2 class="text-3xl font-bold mb-8">Statistics</h2>

    <!-- Tab Navigation -->
    <div class="flex gap-4 mb-6">
      <button
        @click="activeTab = 'personal'"
        class="btn"
        :class="activeTab === 'personal' ? 'btn-primary' : 'btn-secondary'"
      >
        Personal Stats
      </button>
      <button
        @click="activeTab = 'leaderboard'"
        class="btn"
        :class="activeTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'"
      >
        Leaderboard
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="statsStore.isLoading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-spotify-green border-t-transparent mx-auto"></div>
      <p class="mt-4 text-gray-600">Loading statistics...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="statsStore.error" class="bg-red-50 text-red-700 p-4 rounded-lg">
      {{ statsStore.error }}
    </div>

    <!-- Personal Stats -->
    <div v-else-if="activeTab === 'personal' && statsStore.playerStats" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-xl font-semibold mb-4">Overview</h3>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Total Games</span>
            <span class="font-semibold">{{ statsStore.playerStats.totalGames }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Games Won</span>
            <span class="font-semibold">{{ statsStore.playerStats.gamesWon }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Win Rate</span>
            <span class="font-semibold">
              {{ ((statsStore.playerStats.gamesWon / statsStore.playerStats.totalGames) * 100).toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-xl font-semibold mb-4">Performance</h3>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Average Score</span>
            <span class="font-semibold">{{ Math.round(statsStore.playerStats.averageScore) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Average Rank</span>
            <span class="font-semibold">{{ statsStore.playerStats.averageRank.toFixed(1) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Accuracy</span>
            <span class="font-semibold">{{ (statsStore.playerStats.accuracy * 100).toFixed(1) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Leaderboard -->
    <div v-else-if="activeTab === 'leaderboard' && statsStore.leaderboard.length > 0" class="bg-white rounded-lg shadow-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-xl font-semibold">Global Leaderboard</h3>
      </div>
      <div class="divide-y divide-gray-200">
        <div
          v-for="(entry, index) in statsStore.leaderboard"
          :key="entry.playerId"
          class="px-6 py-4 flex items-center"
          :class="entry.playerId === authStore.player?.id ? 'bg-spotify-green bg-opacity-5' : ''"
        >
          <div class="w-12 text-2xl font-bold text-gray-400">
            #{{ index + 1 }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center">
              <span class="font-medium truncate">
                {{ entry.displayName }}
              </span>
              <span 
                v-if="entry.playerId === authStore.player?.id"
                class="ml-2 text-xs text-gray-500"
              >
                (You)
              </span>
            </div>
            <div class="text-sm text-gray-500">
              {{ entry.gamesWon }} wins in {{ entry.totalGames }} games
            </div>
          </div>
          <div class="text-right">
            <div class="font-semibold">{{ Math.round(entry.averageScore) }}</div>
            <div class="text-sm text-gray-500">avg. score</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty States -->
    <div v-else-if="activeTab === 'personal'" class="text-center py-12 bg-white rounded-lg shadow-lg">
      <div class="text-gray-500">
        No statistics available yet. Play some games to see your stats!
      </div>
    </div>
    <div v-else-if="activeTab === 'leaderboard'" class="text-center py-12 bg-white rounded-lg shadow-lg">
      <div class="text-gray-500">
        No leaderboard data available yet. Be the first to play!
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn {
  @apply px-6 py-2 rounded-full font-semibold transition-colors duration-200;
}

.btn-primary {
  @apply bg-spotify-green text-white;
}

.btn-secondary {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}
</style> 