<script setup lang="ts">
import { ref } from 'vue'

const gameMode = ref('multiple-choice')
const partyName = ref('')

const createParty = () => {
  // TODO: Implement party creation logic
  console.log('Creating party:', {
    name: partyName.value,
    mode: gameMode.value
  })
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-6">
    <h2 class="text-3xl font-bold mb-8">Create New Party</h2>
    
    <form @submit.prevent="createParty" class="space-y-6">
      <div>
        <label for="partyName" class="block text-sm font-medium text-gray-700">Party Name</label>
        <input
          id="partyName"
          v-model="partyName"
          type="text"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-spotify-green focus:ring-spotify-green"
          placeholder="Enter party name"
        >
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Game Mode</label>
        <div class="mt-2 space-y-4">
          <div class="flex items-center">
            <input
              id="multiple-choice"
              type="radio"
              v-model="gameMode"
              value="multiple-choice"
              class="h-4 w-4 text-spotify-green focus:ring-spotify-green"
            >
            <label for="multiple-choice" class="ml-3">
              <span class="block text-sm font-medium text-gray-700">Multiple Choice</span>
              <span class="block text-sm text-gray-500">Players choose from 4 song options</span>
            </label>
          </div>
          
          <div class="flex items-center">
            <input
              id="revealed-letters"
              type="radio"
              v-model="gameMode"
              value="revealed-letters"
              class="h-4 w-4 text-spotify-green focus:ring-spotify-green"
            >
            <label for="revealed-letters" class="ml-3">
              <span class="block text-sm font-medium text-gray-700">Revealed Letters</span>
              <span class="block text-sm text-gray-500">Letters are revealed as the song plays</span>
            </label>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-4">
        <button type="button" @click="$router.push('/')" class="btn btn-secondary">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Party</button>
      </div>
    </form>
  </div>
</template> 