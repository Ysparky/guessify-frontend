<script setup lang="ts">
import { useUserInitials } from './composables/useUserInitials';
import { useAuthStore } from './stores/auth';

const authStore = useAuthStore();
const userInitials = useUserInitials(authStore.player?.displayName);
</script>

<template>
  <div class="app">
    <header class="bg-spotify-black text-white">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="text-2xl font-bold hover:text-spotify-green transition-colors">
          Guessify
        </router-link>
        
        <nav v-if="authStore.isAuthenticated" class="flex items-center gap-6">
          <router-link 
            to="/stats" 
            class="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Stats
          </router-link>
          <router-link 
            to="/profile" 
            class="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
          >
            <template v-if="authStore.player?.avatarUrl">
              <img 
                :src="authStore.player.avatarUrl" 
                :alt="authStore.player.displayName"
                class="w-8 h-8 rounded-full object-cover"
              >
            </template>
            <template v-else>
              <div 
                class="w-8 h-8 rounded-full bg-spotify-green bg-opacity-10 flex items-center justify-center text-sm font-medium text-spotify-green"
              >
                {{ userInitials }}
              </div>
            </template>
            <span class="text-sm">{{ authStore.player?.displayName }}</span>
          </router-link>
        </nav>
      </div>
    </header>
    
    <main>
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
  padding: 2rem;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
