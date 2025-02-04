<script setup lang="ts">
import { computed, ref } from 'vue';
import { useUserInitials } from '../composables/useUserInitials';
import { useAuthStore } from '../stores/auth';
import { useGameStore } from '../stores/game';
import { GameStatus } from '../types/game';

const gameStore = useGameStore()
const authStore = useAuthStore()
const recentlyLeft = ref(new Set<string>())

const isCurrentPlayer = (id: string) => id === authStore.player?.id
const playerCount = computed(() => gameStore.currentGame?.playerIds.length ?? 0)
const minPlayers = 2

// Compute player scores and sort by score
const sortedPlayers = computed(() => {
  if (!gameStore.currentGame?.playerIds) return [];
  
  const playerScores = new Map<string, number>();
  
  // Initialize scores to 0
  gameStore.currentGame.playerIds.forEach(id => playerScores.set(id, 0));
  
  // Sum up scores from all rounds
  if (gameStore.allRoundResults.length > 0) {
    gameStore.allRoundResults.forEach(roundResult => {
      roundResult.playerAnswers.forEach(answer => {
        const currentScore = playerScores.get(answer.playerId) || 0;
        playerScores.set(answer.playerId, currentScore + answer.score);
      });
    });
  }
  
  // Sort players by total score
  return [...gameStore.currentGame.playerIds].sort((a, b) => {
    const scoreA = playerScores.get(a) || 0;
    const scoreB = playerScores.get(b) || 0;
    return scoreB - scoreA;
  }).map(id => ({
    id,
    score: playerScores.get(id) || 0,
    info: gameStore.getPlayerById(id)
  }));
});

const getPlayerInitials = (playerId: string) => {
  const player = gameStore.getPlayerById(playerId);
  return useUserInitials(player?.displayName).value;
};
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
        v-for="player in sortedPlayers" 
        :key="player.id"
        class="flex items-center gap-3 p-2 rounded-lg transition-colors duration-200"
        :class="[
          isCurrentPlayer(player.id) ? 'bg-spotify-green bg-opacity-10' : 'hover:bg-gray-50',
          recentlyLeft.has(player.id) ? 'animate-pulse' : ''
        ]"
      >
        <div class="relative">
          <template v-if="player.info?.avatarUrl">
            <img 
              :src="player.info.avatarUrl"
              :alt="player.info.displayName"
              class="w-10 h-10 rounded-full object-cover"
            >
          </template>
          <template v-else>
            <div 
              class="w-10 h-10 rounded-full bg-spotify-green bg-opacity-10 flex items-center justify-center text-sm font-medium text-spotify-green"
            >
              {{ getPlayerInitials(player.id) }}
            </div>
          </template>
          <div 
            class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white transition-colors duration-200"
            :class="[
              gameStore.currentGame?.status === GameStatus.WAITING
                ? 'bg-green-500'
                : 'bg-yellow-500'
            ]"
          ></div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-medium truncate">
              {{ player.info?.displayName }}
            </span>
            <span 
              v-if="player.id === gameStore.currentGame?.hostId" 
              class="text-xs text-spotify-green font-medium px-2 py-0.5 rounded-full bg-spotify-green bg-opacity-10"
            >
              Host
            </span>
            <span 
              v-if="isCurrentPlayer(player.id)"
              class="text-xs text-gray-500"
            >
              (You)
            </span>
          </div>
          <div 
            v-if="gameStore.currentGame?.status === GameStatus.IN_PROGRESS"
            class="text-sm text-gray-600"
          >
            Score: {{ player.score }}
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