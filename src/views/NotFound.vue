<template>
  <main class="not-found">
    <h1>404</h1>
    <p>{{ t('errors.notFound') }}</p>

    <RouterLink to="/" class="home-link">
      {{ t('errors.goHome') }}
    </RouterLink>
  </main>
</template>

<script setup>
import { t } from '@/i18n'
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  background: #000;
  color: #e6e6e6;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  text-align: center;
}

h1 {
  font-size: 5rem;
  margin-bottom: 0.5rem;
}

p {
  color: #aaa;
  margin-bottom: 1.5rem;
}

.home-link {
  color: #8ab4f8;
  text-decoration: none;
}
</style>
