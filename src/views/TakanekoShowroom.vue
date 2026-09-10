<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { MEDIA_BASE } from '@/config/urls'
import { idols } from '@/data/idols'
import { t } from '@/i18n'
import SiteHeader from '@/components/SiteHeader.vue'
import SubtitledVideoCatalog from '@/components/SubtitledVideoCatalog.vue'

const route = useRoute()
const episodes = ref([])
const loading = ref(true)
const loadFailed = ref(false)
const idol = computed(() => idols.find(item => item.slug === route.params.slug))

function validEpisode(item) {
  return item && typeof item.id === 'string' && typeof item.published_at === 'string' && typeof item.original_url === 'string'
    && typeof item.stream === 'string' && typeof item.poster === 'string' && item.title?.en && item.title?.es
    && item.subtitles?.en && item.subtitles?.es
}

async function loadCatalog() {
  episodes.value = []
  loadFailed.value = false
  loading.value = true
  if (!idol.value) {
    loadFailed.value = true
    loading.value = false
    return
  }
  try {
    const response = await fetch(`${MEDIA_BASE}/media/takaneko-showrooms/${idol.value.slug}/index.json`)
    if (response.status === 404) return
    if (!response.ok) throw new Error('Catalog request failed')
    const catalog = await response.json()
    episodes.value = Array.isArray(catalog.episodes) ? catalog.episodes.filter(validEpisode) : []
  } catch {
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

onMounted(loadCatalog)
watch(() => route.params.slug, loadCatalog)
</script>

<template>
  <SiteHeader />
  <main class="showroom-detail">
    <header class="intro"><p class="eyebrow">TAKANEKO SHOWROOMS</p><h1>{{ idol ? t('showrooms.memberTitle', { name: idol.name }) : t('showrooms.title') }}</h1><p>{{ t('showrooms.memberIntro') }}</p><RouterLink class="back" to="/takaneko-showrooms">{{ t('showrooms.allMembers') }}</RouterLink></header>
    <aside class="disclaimer"><h2>{{ t('showrooms.disclaimerTitle') }}</h2><p>{{ t('showrooms.disclaimer') }}</p></aside>
    <p v-if="loading" class="state">{{ t('showrooms.loading') }}</p>
    <p v-else-if="loadFailed" class="state error" role="alert">{{ t('showrooms.loadFailed') }}</p>
    <p v-else-if="!episodes.length" class="state">{{ t('showrooms.empty') }}</p>
    <SubtitledVideoCatalog v-else :episodes="episodes" :media-directory="`takaneko-showrooms/${idol.slug}`" analytics-prefix="showroom" :analytics-data="{ idol_slug: idol.slug }" :route="`/takaneko-showrooms/${idol.slug}`" :watch-original-label="t('showrooms.watchOriginal')" />
  </main>
</template>

<style scoped>
.showroom-detail { min-height: calc(100vh - 52px); padding: clamp(1.5rem, 4vw, 3.5rem) 1rem 4rem; background: #090909; color: #f8f8f8; }
.intro, .disclaimer, .state { width: min(100%, 1080px); margin-inline: auto; }
.intro { text-align: center; max-width: 760px; }
.eyebrow { margin: 0; color: #ee8ca9; font-weight: 700; letter-spacing: .12em; }
h1 { margin: .35rem 0 .75rem; font-size: clamp(2rem, 5vw, 3.4rem); }
.intro p { margin: 0; color: #d1d1d1; line-height: 1.6; }
.back { display: inline-block; margin-top: 1rem; color: #f7bdcd; }
.disclaimer { box-sizing: border-box; margin-top: 2rem; padding: 1rem 1.2rem; border-left: 4px solid #ee8ca9; background: #1c1317; }
.disclaimer h2, .disclaimer p { margin: 0; }
.disclaimer p { margin-top: .4rem; color: #e1dadd; line-height: 1.55; }
.state { margin-top: 3rem; text-align: center; color: #d1d1d1; }
.error { color: #ffb5b5; }
</style>
