<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGameStore } from '../stores/game';
import { GameStatus } from '../types/game';

const gameStore = useGameStore()
const recentlyLeft = ref(new Set<string>())

const isCurrentPlayer = (id: string) => id === gameStore.playerId
const playerCount = computed(() => gameStore.currentGame?.playerIds.length ?? 0)
const minPlayers = 2

const getPlayerNumber = (id: string) => {
  return (gameStore.currentGame?.playerIds.indexOf(id) ?? -1) + 1
}

// Watch for player departures
const handlePlayerLeft = (playerId: string) => {
  recentlyLeft.value.add(playerId)
  setTimeout(() => {
    recentlyLeft.value.delete(playerId)
  }, 5000)
}
</script>

<template>
  <div class="bg-gray-100 rounded-lg p-4">
    <div class="flex justify-between items-center mb-3">
      <h3 class="text-lg font-semibold">Players in Lobby</h3>
      <span 
        class="text-sm px-2 py-1 rounded-full"
        :class="[
          playerCount >= minPlayers 
            ? 'bg-green-100 text-green-800' 
            : gameStore.currentGame?.status === GameStatus.WAITING
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
        ]"
      >
        {{ playerCount }}/{{ minPlayers }}+ Players
      </span>
    </div>
    
    <ul class="space-y-2">
      <li 
        v-for="playerId in gameStore.currentGame?.playerIds" 
        :key="playerId"
        class="flex items-center gap-2 p-2 rounded-lg transition-colors duration-200"
        :class="[
          isCurrentPlayer(playerId) ? 'bg-spotify-green bg-opacity-10' : 'hover:bg-gray-50',
          recentlyLeft.has(playerId) ? 'animate-pulse' : ''
        ]"
      >
        <div 
          class="w-2 h-2 rounded-full transition-colors duration-200"
          :class="[
            gameStore.currentGame?.status === GameStatus.WAITING
              ? 'bg-green-500'
              : 'bg-yellow-500'
          ]"
        ></div>
        <div class="flex-1">
          <span class="font-medium">Player {{ getPlayerNumber(playerId) }}</span>
          <div class="flex gap-1 text-sm text-gray-500">
            <span 
              v-if="playerId === gameStore.currentGame?.hostId" 
              class="text-spotify-green font-medium"
            >
              Host
            </span>
            <span v-if="isCurrentPlayer(playerId)">
              (You)
            </span>
          </div>
        </div>
      </li>
    </ul>

    <div 
      v-if="playerCount < minPlayers && gameStore.currentGame?.status === GameStatus.WAITING" 
      class="mt-4 text-sm text-yellow-700 bg-yellow-50 p-2 rounded"
    >
      Waiting for {{ minPlayers - playerCount }} more player{{ minPlayers - playerCount > 1 ? 's' : '' }} to start
    </div>

    <div 
      v-else-if="playerCount < minPlayers" 
      class="mt-4 text-sm text-red-700 bg-red-50 p-2 rounded"
    >
      Not enough players to continue. Game will end soon...
    </div>
  </div>
</template> 