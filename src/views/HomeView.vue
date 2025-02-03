<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'

const router = useRouter()
const gameStore = useGameStore()
const roomCode = ref('')
const showJoinInput = ref(false)

const createNewParty = () => {
  router.push('/create')
}

const joinParty = async () => {
  if (!roomCode.value) return
  await gameStore.joinGame(roomCode.value.toUpperCase())
  if (gameStore.currentGame) {
    router.push(`/party/${gameStore.currentGame.roomCode}`)
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[80vh] gap-8">
    <h2 class="text-4xl font-bold text-center">Welcome to Guessify</h2>
    <p class="text-xl text-center text-gray-600">Create or join a party to start guessing songs!</p>
    
    <div v-if="gameStore.error" class="text-red-500">
      {{ gameStore.error }}
    </div>

    <div v-if="!showJoinInput" class="flex gap-4">
      <button @click="createNewParty" class="btn btn-primary">Create New Party</button>
      <button @click="showJoinInput = true" class="btn btn-secondary">Join Party</button>
    </div>

    <form v-else @submit.prevent="joinParty" class="flex flex-col items-center gap-4">
      <input
        v-model="roomCode"
        type="text"
        placeholder="Enter Room Code"
        class="px-4 py-2 border rounded-lg focus:border-spotify-green focus:ring-spotify-green"
        maxlength="6"
      >
      <div class="flex gap-4">
        <button type="button" @click="showJoinInput = false" class="btn btn-secondary">Cancel</button>
        <button type="submit" class="btn btn-primary">Join</button>
      </div>
    </form>
  </div>
</template> 