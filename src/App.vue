<script setup lang="ts">
// Component imports will go here
</script>

<template>
  <div class="app">
    <header>
      <h1>Guessify</h1>
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

header {
  padding: 1rem;
  background-color: #1DB954;
  color: white;
  text-align: center;
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
