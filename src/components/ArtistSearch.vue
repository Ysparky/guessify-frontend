<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useGameStore } from '../stores/game';
import type { SpotifyArtist } from '../types/game';

const props = defineProps<{
  modelValue: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void;
}>();

const authStore = useAuthStore();
const gameStore = useGameStore();
const searchQuery = ref('');
const artists = ref<SpotifyArtist[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Debounced search function
let searchTimeout: number | null = null;
const searchArtists = async () => {
  if (!authStore.player?.id || !searchQuery.value.trim()) {
    artists.value = [];
    return;
  }

  if (searchTimeout) {
    window.clearTimeout(searchTimeout);
  }

  searchTimeout = window.setTimeout(async () => {
    try {
      isLoading.value = true;
      error.value = null;
      artists.value = await gameStore.searchArtists(
        searchQuery.value.trim(),
        authStore.player!.id
      );
    } catch (err) {
      error.value = 'Failed to search artists';
      console.error(err);
    } finally {
      isLoading.value = false;
    }
  }, 300);
};

watch(searchQuery, searchArtists);
</script>

<template>
  <div class="space-y-4">
    <!-- Search Input -->
    <div>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search for an artist..."
        class="w-full px-4 py-2 rounded-lg border-2 focus:border-spotify-green focus:ring-spotify-green"
      >
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-spotify-green border-t-transparent mx-auto"></div>
      <p class="mt-2 text-sm text-gray-600">Searching artists...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-600">{{ error }}</p>
    </div>

    <!-- Artists Grid -->
    <div v-else-if="artists.length > 0" class="grid grid-cols-2 gap-4">
      <button
        v-for="artist in artists"
        :key="artist.id"
        class="flex items-center gap-4 p-4 rounded-lg transition-colors text-left"
        :class="[
          modelValue === artist.id
            ? 'bg-spotify-green bg-opacity-10 border-2 border-spotify-green'
            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
        ]"
        @click="emit('update:modelValue', artist.id)"
      >
        <div 
          v-if="artist.images?.[0]"
          class="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0"
        >
          <img 
            :src="artist.images[0].url" 
            :alt="artist.name"
            class="w-full h-full object-cover rounded-full"
          >
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-medium truncate">{{ artist.name }}</div>
          <div class="text-sm text-gray-600">
            {{ artist.genres.slice(0, 2).join(', ') }}
          </div>
        </div>
      </button>
    </div>

    <!-- Empty State -->
    <div 
      v-else-if="searchQuery && !isLoading" 
      class="text-center py-8"
    >
      <p class="text-gray-600">No artists found</p>
    </div>

    <!-- Initial State -->
    <div 
      v-else 
      class="text-center py-8"
    >
      <p class="text-gray-600">Type to search for artists</p>
    </div>
  </div>
</template> 