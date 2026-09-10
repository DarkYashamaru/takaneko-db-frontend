<script setup>
import { onMounted, ref } from 'vue'
import { MEDIA_BASE } from '@/config/urls'
import { t } from '@/i18n'
import SiteHeader from '@/components/SiteHeader.vue'
import SubtitledVideoCatalog from '@/components/SubtitledVideoCatalog.vue'

const episodes = ref([])
const loading = ref(true)
const loadFailed = ref(false)

function validEpisode(item) {
  return item && typeof item.id === 'string' && typeof item.published_at === 'string' && typeof item.original_url === 'string'
    && typeof item.stream === 'string' && typeof item.poster === 'string' && item.title?.en && item.title?.es
    && item.subtitles?.en && item.subtitles?.es
}

onMounted(async () => {
  try {
    const response = await fetch(`${MEDIA_BASE}/media/takaneko-tv/index.json`)
    if (!response.ok) throw new Error('Catalog request failed')
    const catalog = await response.json()
    episodes.value = Array.isArray(catalog.episodes) ? catalog.episodes.filter(validEpisode) : []
  } catch {
    loadFailed.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <SiteHeader />
  <main class="takaneko-tv">
    <header class="intro"><p class="eyebrow">TAKANEKO TV</p><h1>{{ t('takanekoTv.title') }}</h1><p>{{ t('takanekoTv.intro') }}</p></header>
    <aside class="disclaimer"><h2>{{ t('takanekoTv.disclaimerTitle') }}</h2><p>{{ t('takanekoTv.disclaimer') }}</p></aside>
    <p v-if="loading" class="state">{{ t('takanekoTv.loading') }}</p>
    <p v-else-if="loadFailed" class="state error" role="alert">{{ t('takanekoTv.loadFailed') }}</p>
    <p v-else-if="!episodes.length" class="state">{{ t('takanekoTv.empty') }}</p>
    <SubtitledVideoCatalog v-else :episodes="episodes" media-directory="takaneko-tv" analytics-prefix="tv" route="/takaneko-tv" :watch-original-label="t('takanekoTv.watchOriginal')" />
  </main>
</template>

<style scoped>
.takaneko-tv { min-height: calc(100vh - 52px); padding: clamp(1.5rem, 4vw, 3.5rem) 1rem 4rem; background: #090909; color: #f8f8f8; }
.intro, .disclaimer { width: min(100%, 1080px); margin-inline: auto; }
.intro { text-align: center; max-width: 760px; }
.eyebrow { margin: 0; color: #ee8ca9; font-weight: 700; letter-spacing: .12em; }
h1 { margin: .35rem 0 .75rem; font-size: clamp(2rem, 5vw, 3.4rem); }
.intro p:last-child { margin: 0; color: #d1d1d1; line-height: 1.6; }
.disclaimer { box-sizing: border-box; margin-top: 2rem; padding: 1rem 1.2rem; border-left: 4px solid #ee8ca9; background: #1c1317; }
.disclaimer h2, .disclaimer p { margin: 0; }
.disclaimer p { margin-top: .4rem; color: #e1dadd; line-height: 1.55; }
.state { width: min(100%, 1080px); margin: 3rem auto; text-align: center; color: #d1d1d1; }
.error { color: #ffb5b5; }
</style>
