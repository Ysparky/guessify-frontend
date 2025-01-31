<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const createNewParty = () => {
  router.push('/create')
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[80vh] gap-8">
    <h2 class="text-4xl font-bold text-center">Welcome to Guessify</h2>
    <p class="text-xl text-center text-gray-600">Create or join a party to start guessing songs!</p>
    <div class="flex gap-4">
      <button @click="createNewParty" class="btn btn-primary">Create New Party</button>
      <button class="btn btn-secondary">Join Party</button>
    </div>
  </div>
</template> 