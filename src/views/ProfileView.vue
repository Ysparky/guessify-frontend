<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useUserInitials } from '../composables/useUserInitials';
import { useAuthStore } from '../stores/auth';
import { useStatsStore } from '../stores/stats';

const router = useRouter();
const authStore = useAuthStore();
const statsStore = useStatsStore();
const userInitials = useUserInitials();

// Load stats when component mounts
if (authStore.player?.id) {
  statsStore.getPlayerStats(authStore.player.id);
}

const handleSignOut = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b] px-6 py-8 sm:py-12">
    <div class="max-w-2xl mx-auto space-y-8">
      <!-- Profile Header -->
      <div class="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
        <div class="flex items-center gap-6">
          <template v-if="authStore.player?.avatarUrl">
            <img
              :src="authStore.player.avatarUrl"
              :alt="authStore.player.displayName"
              class="w-24 h-24 rounded-full object-cover ring-2 ring-white/10"
            />
          </template>
          <template v-else>
            <div
              class="w-24 h-24 rounded-full bg-spotify-green/10 ring-2 ring-white/10 flex items-center justify-center text-3xl font-medium text-spotify-green/90"
            >
              {{ userInitials }}
            </div>
          </template>
          <div>
            <h1 class="text-2xl font-bold text-white mb-1">
              {{ authStore.player?.displayName }}
            </h1>
            <p class="text-gray-400">
              Member since {{ new Date().toLocaleDateString() }}
            </p>
          </div>
          <button
            @click="handleSignOut"
            class="ml-auto px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-xl transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
          <div class="text-4xl font-bold text-spotify-green mb-2">
            {{ statsStore.playerStats?.totalGames || 0 }}
          </div>
          <div class="text-gray-400">Total Games</div>
          <div class="text-sm text-gray-500 mt-1">
            {{ statsStore.playerStats?.gamesWon || 0 }} wins ({{ Math.round((statsStore.playerStats?.gamesWon || 0) / (statsStore.playerStats?.totalGames || 1) * 100) }}% win rate)
          </div>
        </div>

        <div class="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
          <div class="text-4xl font-bold text-spotify-green mb-2">
            {{ Math.round(statsStore.playerStats?.averageScore || 0) }}
          </div>
          <div class="text-gray-400">Average Score</div>
          <div class="text-sm text-gray-500 mt-1">
            Typical rank: {{ Math.round((statsStore.playerStats?.averageRank || 0) * 10) / 10 }}
          </div>
        </div>

        <div class="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
          <div class="text-4xl font-bold text-spotify-green mb-2">
            {{ Math.round((statsStore.playerStats?.accuracy || 0) * 100) }}%
          </div>
          <div class="text-gray-400">Answer Accuracy</div>
          <div class="text-sm text-gray-500 mt-1">
            {{ statsStore.playerStats?.totalCorrectAnswers || 0 }} correct answers
          </div>
        </div>
      </div>

      <!-- Achievements -->
      <div class="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
        <h2 class="text-xl font-bold text-white mb-6">Achievements</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center mb-3">
              <span class="text-2xl">🎮</span>
            </div>
            <div class="font-medium text-gray-300">First Game</div>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center mb-3">
              <span class="text-2xl">🏆</span>
            </div>
            <div class="font-medium text-gray-300">First Win</div>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center mb-3">
              <span class="text-2xl">🎯</span>
            </div>
            <div class="font-medium text-gray-300">Sharp Ear</div>
          </div>
          <div class="text-center opacity-50">
            <div class="w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center mb-3">
              <span class="text-2xl">⭐</span>
            </div>
            <div class="font-medium text-gray-300">Veteran</div>
          </div>
        </div>
      </div>

      <!-- Recent Games -->
      <div class="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
        <h2 class="text-xl font-bold text-white mb-6">Recent Games</h2>
        <div class="space-y-4">
          <div v-for="i in 3" :key="i" class="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <div>
              <div class="flex items-center gap-3 text-gray-300 mb-1">
                <span class="text-spotify-green font-medium">Rank #{{ i }}/2</span>
                <span class="text-gray-500">2/3/2025</span>
              </div>
              <div class="text-sm text-gray-500">
                {{ 5 - i }}/5 correct answers
              </div>
            </div>
            <div class="text-right">
              <div class="text-xl font-bold text-gray-300 mb-1">
                {{ 4214 - (i * 469) }} points
              </div>
              <div class="text-sm text-gray-500">
                {{ 100 - (i * 10) }}% accuracy
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 