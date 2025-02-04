<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
import { ref, watch } from "vue";
import { useUserInitials } from "./composables/useUserInitials";
import { useAuthStore } from "./stores/auth";
import { useStatsStore } from "./stores/stats";

const authStore = useAuthStore();
const statsStore = useStatsStore();
const showProfileMenu = ref(false);
const menuRef = ref(null);

const userInitials = useUserInitials();

console.log(userInitials.value);

onClickOutside(menuRef, () => {
  showProfileMenu.value = false;
});

const loadStats = async () => {
  if (authStore.player?.id && showProfileMenu.value) {
    await statsStore.getPlayerStats(authStore.player.id);
  }
};

// Watch for menu open to load stats
watch(
  () => showProfileMenu.value,
  async (newValue) => {
    if (newValue) {
      loadStats();
    }
  }
);
</script>

<template>
  <div class="app bg-gradient-to-b from-[#0f172a] to-[#1e293b] min-h-screen">
    <!-- App Home Button (Left) -->
    <div class="fixed top-3 left-3 sm:top-4 sm:left-4 z-50">
      <router-link
        to="/"
        class="flex items-center justify-center p-1.5 rounded-full bg-[#0f172a]/90 backdrop-blur-sm border border-white/5 hover:border-spotify-green/20 transition-all group"
      >
        <svg class="w-7 h-7 sm:w-8 sm:h-8 text-white/75 group-hover:text-spotify-green transition-colors" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
      </router-link>
    </div>

    <!-- Profile Button (Right) -->
    <div v-if="authStore.isAuthenticated" class="fixed top-3 right-3 sm:top-4 sm:right-4 z-50">
      <div class="relative" ref="menuRef">
        <button
          @click="showProfileMenu = !showProfileMenu"
          class="flex items-center justify-center p-1.5 rounded-full bg-[#0f172a]/90 backdrop-blur-sm border border-white/5 hover:border-white/10 transition-all group"
        >
          <template v-if="authStore.player?.avatarUrl">
            <img
              :src="authStore.player.avatarUrl"
              :alt="authStore.player.displayName"
              class="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-white/10 group-hover:ring-spotify-green/20 transition-all"
            />
          </template>
          <template v-else>
            <div
              class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-spotify-green/10 ring-1 ring-white/10 group-hover:ring-spotify-green/20 flex items-center justify-center text-xs sm:text-sm font-medium text-spotify-green/90 transition-all"
            >
              {{ userInitials }}
            </div>
          </template>
        </button>

        <!-- Profile Menu -->
        <div
          v-if="showProfileMenu"
          class="absolute right-0 mt-2 w-[calc(100vw-24px)] sm:w-72 max-w-[320px] py-2 bg-[#0f172a]/90 backdrop-blur-sm border border-white/5 rounded-xl shadow-lg animate-fadeIn"
        >
          <!-- Profile Header -->
          <div class="px-4 py-3 border-b border-white/5">
            <div class="flex items-center gap-3">
              <template v-if="authStore.player?.avatarUrl">
                <img
                  :src="authStore.player.avatarUrl"
                  :alt="authStore.player.displayName"
                  class="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-1 ring-white/10"
                />
              </template>
              <template v-else>
                <div
                  class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-spotify-green/10 ring-1 ring-white/10 flex items-center justify-center text-sm sm:text-base font-medium text-spotify-green/90"
                >
                  {{ userInitials }}
                </div>
              </template>
              <div class="min-w-0 flex-1">
                <div class="font-medium text-white truncate">
                  {{ authStore.player?.displayName }}
                </div>
                <div class="text-xs text-gray-400">Your Profile</div>
              </div>
            </div>
          </div>

          <!-- Stats Section -->
          <div class="px-4 py-3 border-b border-white/5">
            <div v-if="statsStore.isLoading" class="flex justify-center py-2">
              <div class="animate-pulse w-4 h-4 bg-white/10 rounded-full"></div>
            </div>
            <template v-else-if="statsStore.playerStats">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-sm font-medium text-gray-300">
                    {{ statsStore.playerStats.totalGames }}
                  </div>
                  <div class="text-xs text-gray-500">Games Played</div>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-300">
                    {{ statsStore.playerStats.gamesWon }}
                  </div>
                  <div class="text-xs text-gray-500">Games Won</div>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-300">
                    {{ Math.round(statsStore.playerStats.averageScore) }}
                  </div>
                  <div class="text-xs text-gray-500">Avg Score</div>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-300">
                    {{ Math.round(statsStore.playerStats.accuracy * 100) }}%
                  </div>
                  <div class="text-xs text-gray-500">Accuracy</div>
                </div>
              </div>
            </template>
          </div>

          <!-- Menu Items -->
          <div class="py-1">
            <router-link
              to="/profile"
              class="block px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10"
              @click="showProfileMenu = false"
            >
              Settings
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <main class="pt-16 sm:pt-20">
      <router-view></router-view>
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
