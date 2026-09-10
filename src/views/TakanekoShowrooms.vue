<script setup>
import { computed, onMounted, ref } from 'vue'
import { MEDIA_BASE } from '@/config/urls'
import { idols } from '@/data/idols'
import { t } from '@/i18n'
import SiteHeader from '@/components/SiteHeader.vue'

const counts = ref({})
const loading = ref(true)
const loadFailed = ref(false)
const members = computed(() => idols.map(idol => ({ ...idol, episodeCount: counts.value[idol.slug] ?? 0 })))

onMounted(async () => {
  try {
    const response = await fetch(`${MEDIA_BASE}/media/takaneko-showrooms/index.json`)
    if (response.status === 404) return
    if (!response.ok) throw new Error('Catalog request failed')
    const catalog = await response.json()
    if (Array.isArray(catalog.idols)) {
      counts.value = Object.fromEntries(catalog.idols.filter(item => typeof item?.slug === 'string' && Number.isInteger(item.episode_count) && item.episode_count >= 0).map(item => [item.slug, item.episode_count]))
    }
  } catch {
    loadFailed.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <SiteHeader />
  <main class="showrooms">
    <header class="intro"><p class="eyebrow">TAKANEKO SHOWROOMS</p><h1>{{ t('showrooms.title') }}</h1><p>{{ t('showrooms.intro') }}</p></header>
    <p v-if="loading" class="state">{{ t('showrooms.loading') }}</p>
    <p v-else-if="loadFailed" class="state error" role="alert">{{ t('showrooms.loadFailed') }}</p>
    <section v-else class="member-grid" :aria-label="t('showrooms.members')">
      <RouterLink v-for="idol in members" :key="idol.slug" class="member-card" :to="`/takaneko-showrooms/${idol.slug}`">
        <img :src="`${MEDIA_BASE}${idol.face || idol.image}`" :alt="t('idols.portraitAlt', { name: idol.name })">
        <span><strong>{{ idol.name }}</strong><small>{{ t('showrooms.videoCount', { count: idol.episodeCount }) }}</small></span>
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.showrooms { min-height: calc(100vh - 52px); padding: clamp(1.5rem, 4vw, 3.5rem) 1rem 4rem; background: #090909; color: #f8f8f8; }
.intro, .member-grid, .state { width: min(100%, 1080px); margin-inline: auto; }
.intro { text-align: center; max-width: 760px; }
.eyebrow { margin: 0; color: #ee8ca9; font-weight: 700; letter-spacing: .12em; }
h1 { margin: .35rem 0 .75rem; font-size: clamp(2rem, 5vw, 3.4rem); }
.intro p:last-child, .state { color: #d1d1d1; line-height: 1.6; }
.state { margin-top: 3rem; text-align: center; }
.member-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 1rem; margin-top: 2.5rem; }
.member-card { overflow: hidden; border: 1px solid #444; border-radius: .5rem; background: #171717; color: inherit; text-decoration: none; }
.member-card:hover, .member-card:focus-visible { border-color: #ee8ca9; outline: 2px solid #ee8ca9; outline-offset: 2px; }
.member-card img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; background: #000; }
.member-card span { display: grid; gap: .35rem; padding: .75rem; }
.member-card small { color: #c8c8c8; }
.error { color: #ffb5b5; }
</style>
