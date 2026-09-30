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
  background: var(--iw-media);
  color: var(--iw-text);

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
  color: var(--iw-text-muted);
  margin-bottom: 1.5rem;
}

.home-link {
  color: var(--iw-link);
  text-decoration: none;
}
</style>
