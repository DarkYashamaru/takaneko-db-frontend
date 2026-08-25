<script setup>
import { useI18n } from '@/i18n'
const { locale, setLocale, t } = useI18n()
</script>

<template>
  <header class="site-header">
    <RouterLink to="/" class="brand">Takaneko DB</RouterLink>
    <div class="language-switcher" :aria-label="t('common.language')">
      <button :class="{ active: locale === 'en' }" :aria-pressed="locale === 'en'" @click="setLocale('en')">EN</button>
      <button :class="{ active: locale === 'es-419' }" :aria-pressed="locale === 'es-419'" @click="setLocale('es-419')">ES</button>
    </div>
  </header>
</template>

<style scoped>
.site-header { position: static; height: 52px; display: flex; align-items: center; justify-content: space-between; padding: 0 1rem; background: rgba(0, 0, 0, .94); border-bottom: 1px solid rgba(255,255,255,.1); }
.brand { color: #fff; font-weight: 700; text-decoration: none; }
.language-switcher { display: flex; border: 1px solid #555; border-radius: 6px; overflow: hidden; }
.language-switcher button { border: 0; background: transparent; color: #ccc; padding: .35rem .55rem; cursor: pointer; font: inherit; font-size: .8rem; }
.language-switcher button.active { background: #fff; color: #111; }
</style>
