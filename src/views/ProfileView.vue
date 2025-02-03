<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useUserInitials } from '../composables/useUserInitials';
import { useAuthStore } from '../stores/auth';
import { useStatsStore } from '../stores/stats';

const authStore = useAuthStore();
const statsStore = useStatsStore();
const toast = useToast();
const router = useRouter();

const userInitials = useUserInitials(authStore.player?.displayName);

// Computed properties for achievements
const achievements = computed(() => {
  const stats = statsStore.playerStats;
  if (!stats) return [];

  return [
    {
      id: 'first-game',
      name: 'First Game',
      icon: '🎮',
      unlocked: stats.totalGames >= 1
    },
    {
      id: 'first-win',
      name: 'First Win',
      icon: '🏆',
      unlocked: stats.gamesWon >= 1
    },
    {
      id: 'sharp-ear',
      name: 'Sharp Ear',
      icon: '🎯',
      unlocked: stats.accuracy >= 0.8
    },
    {
      id: 'veteran',
      name: 'Veteran',
      icon: '⭐',
      unlocked: stats.totalGames >= 10
    }
  ];
});

// Load player data
onMounted(async () => {
  if (authStore.player?.id) {
    try {
      await Promise.all([
        statsStore.getPlayerStats(authStore.player.id),
        statsStore.getRecentGames(authStore.player.id)
      ]);
    } catch (err) {
      toast.error('Failed to load profile data');
    }
  }
});
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <!-- Profile Header -->
    <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
      <div class="flex items-center gap-6">
        <template v-if="authStore.player?.avatarUrl">
          <img 
            :src="authStore.player.avatarUrl" 
            :alt="authStore.player.displayName"
            class="w-24 h-24 rounded-full object-cover border-4 border-spotify-green"
          >
        </template>
        <template v-else>
          <div 
            class="w-24 h-24 rounded-full border-4 border-spotify-green bg-spotify-green bg-opacity-10 flex items-center justify-center text-3xl font-bold text-spotify-green"
          >
            {{ userInitials }}
          </div>
        </template>
        <div class="flex-1">
          <h2 class="text-3xl font-bold mb-2">{{ authStore.player?.displayName }}</h2>
          <div class="text-gray-600">Member since {{ new Date(authStore.player?.createdAt || '').toLocaleDateString() }}</div>
        </div>
        <button 
          @click="() => { authStore.logout(); router.push('/login'); }"
          class="btn btn-secondary flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414a1 1 0 00-.293-.707L11.414 2.414A1 1 0 0010.707 2H4a1 1 0 00-1 1zm9 6V3.586L16.586 8H12z" clip-rule="evenodd" />
            <path fill-rule="evenodd" d="M10 12a1 1 0 00-1-1H4a1 1 0 100 2h5a1 1 0 001-1z" clip-rule="evenodd" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="statsStore.isLoading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-spotify-green border-t-transparent mx-auto"></div>
      <p class="mt-4 text-gray-600">Loading profile data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="statsStore.error" class="bg-red-50 text-red-700 p-4 rounded-lg">
      {{ statsStore.error }}
    </div>

    <!-- Stats Grid -->
    <div v-else-if="statsStore.playerStats" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- Games Stats -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="text-4xl font-bold text-spotify-green mb-2">
          {{ statsStore.playerStats.totalGames }}
        </div>
        <div class="text-gray-600">Total Games</div>
        <div class="mt-4 text-sm text-gray-500">
          {{ statsStore.playerStats.gamesWon }} wins ({{ ((statsStore.playerStats.gamesWon / statsStore.playerStats.totalGames) * 100).toFixed(1) }}% win rate)
        </div>
      </div>

      <!-- Score Stats -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="text-4xl font-bold text-spotify-green mb-2">
          {{ Math.round(statsStore.playerStats.averageScore) }}
        </div>
        <div class="text-gray-600">Average Score</div>
        <div class="mt-4 text-sm text-gray-500">
          Typical rank: {{ statsStore.playerStats.averageRank.toFixed(1) }}
        </div>
      </div>

      <!-- Accuracy Stats -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="text-4xl font-bold text-spotify-green mb-2">
          {{ (statsStore.playerStats.accuracy * 100).toFixed(1) }}%
        </div>
        <div class="text-gray-600">Answer Accuracy</div>
        <div class="mt-4 text-sm text-gray-500">
          {{ statsStore.playerStats.totalCorrectAnswers }} correct answers
        </div>
      </div>
    </div>

    <!-- Achievement Badges -->
    <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold mb-4">Achievements</h3>
      <div v-if="statsStore.playerStats?.totalGames && statsStore.playerStats.totalGames > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          v-for="achievement in achievements"
          :key="achievement.id"
          class="p-4 text-center rounded-lg"
          :class="achievement.unlocked ? 'bg-gray-50' : 'bg-gray-50 opacity-50'"
        >
          <div class="text-3xl mb-2">{{ achievement.icon }}</div>
          <div class="font-medium">{{ achievement.name }}</div>
        </div>
      </div>
      <div v-else class="text-center text-gray-500 py-4">
        Play games to unlock achievements!
      </div>
    </div>

    <!-- Recent Games -->
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h3 class="text-xl font-semibold mb-4">Recent Games</h3>
      <div v-if="statsStore.recentGames.length > 0" class="space-y-4">
        <div 
          v-for="game in statsStore.recentGames" 
          :key="game.gameId"
          class="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div>
            <div class="flex items-center gap-2">
              <span 
                class="text-sm px-2 py-0.5 rounded-full font-medium"
                :class="game.isWinner ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
              >
                Rank #{{ game.rank }}/{{ game.totalPlayers }}
              </span>
              <span class="text-sm text-gray-500">
                {{ new Date(game.createdAt).toLocaleDateString() }}
              </span>
            </div>
            <div class="mt-1 text-sm text-gray-600">
              {{ game.correctAnswers }}/{{ game.totalAnswers }} correct answers
            </div>
          </div>
          <div class="text-right">
            <div class="font-medium">{{ game.score }} points</div>
            <div class="text-sm text-gray-500">
              {{ Math.round((game.correctAnswers / game.totalAnswers) * 100) }}% accuracy
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center text-gray-500 py-4">
        No recent games found
      </div>
    </div>
  </div>
</template> 