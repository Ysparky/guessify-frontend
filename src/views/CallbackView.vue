<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (code) {
    try {
      const success = await authStore.handleCallback(code);
      if (success) {
        // Check for redirect path from session storage
        const redirectPath = sessionStorage.getItem('redirectPath');
        if (redirectPath) {
          sessionStorage.removeItem('redirectPath');
          router.push(redirectPath);
        } else {
          router.push('/');
        }
        return;
      }
    } catch (err) {
      console.error('Failed to handle callback:', err);
    }
  }
  
  // If we get here, something went wrong
  router.push('/login');
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-spotify-green mx-auto mb-4"></div>
      <p class="text-gray-600">Completing login...</p>
    </div>
  </div>
</template> 