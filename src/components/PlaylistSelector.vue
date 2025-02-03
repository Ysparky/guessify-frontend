<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useGameStore } from '../stores/game';
import type { SpotifyPlaylist } from '../types/game';

const props = defineProps<{
  modelValue: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void;
}>();

const authStore = useAuthStore();
const gameStore = useGameStore();
const playlists = ref<SpotifyPlaylist[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

const loadPlaylists = async () => {
  if (!authStore.player?.id) return;
  
  try {
    isLoading.value = true;
    error.value = null;
    playlists.value = await gameStore.getUserPlaylists(authStore.player.id);
  } catch (err) {
    error.value = 'Failed to load playlists';
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadPlaylists();
});
</script>

<template>
  <div class="space-y-4">
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-spotify-green border-t-transparent mx-auto"></div>
      <p class="mt-2 text-sm text-gray-600">Loading playlists...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-600">{{ error }}</p>
      <button @click="loadPlaylists" class="mt-2 text-spotify-green hover:underline">
        Try Again
      </button>
    </div>

    <!-- Playlists Grid -->
    <div v-else class="grid grid-cols-2 gap-4">
      <button
        v-for="playlist in playlists"
        :key="playlist.id"
        class="flex items-center gap-4 p-4 rounded-lg transition-colors text-left"
        :class="[
          modelValue === playlist.id
            ? 'bg-spotify-green bg-opacity-10 border-2 border-spotify-green'
            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
        ]"
        @click="emit('update:modelValue', playlist.id)"
      >
        <div 
          v-if="playlist.images?.[0]"
          class="w-16 h-16 rounded bg-gray-200 flex-shrink-0"
        >
          <img 
            :src="playlist.images[0].url" 
            :alt="playlist.name"
            class="w-full h-full object-cover rounded"
          >
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-medium truncate">{{ playlist.name }}</div>
          <div class="text-sm text-gray-600">{{ playlist.tracks.total }} tracks</div>
        </div>
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && !error && playlists.length === 0" class="text-center py-8">
      <p class="text-gray-600">No playlists found</p>
    </div>
  </div>
</template> 