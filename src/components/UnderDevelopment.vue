<template>
  <main class="under-development">
    <h1>{{ t('development.title') }}</h1>
  </main>
</template>

<script setup>
import { t } from '@/i18n'
</script>

<style>
.under-development {
  min-height: 10vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-family: system-ui, sans-serif;
}
</style>