<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SiteHeader from '@/components/SiteHeader.vue'
import { API_BASE } from '@/config/urls'
import { clearAdminSession } from '@/services/adminAuth'

const route = useRoute()
const router = useRouter()
const profile = computed(() => String(route.params.profile || ''))
const profileName = ref('')
const items = ref([])
const options = ref([])
const status = ref('')
const loading = ref(false)
const submitting = ref(false)
const autoTrain = ref(false)

const current = computed(() => items.value[0] || null)
const endpoint = (path) => `${API_BASE}/preference/profiles/${encodeURIComponent(profile.value)}${path}`

async function responseJson(response) {
  const payload = await response.json().catch(() => ({}))
  if (response.status === 401) {
    clearAdminSession()
    await router.replace({ name: 'login', query: { redirect: route.fullPath } })
  }
  if (!response.ok) throw new Error(payload.detail || `Request failed (${response.status})`)
  return payload
}

async function loadOptions() {
  loading.value = true
  try {
    const result = await responseJson(await fetch(endpoint('/feed-options')))
    profileName.value = result.profile.display_name
    document.title = `${profileName.value} training · Takaneko DB`
    options.value = result.modes
  } catch (error) {
    status.value = error.message
  } finally {
    loading.value = false
  }
}

async function loadFeed(mode) {
  loading.value = true
  status.value = 'Loading feed…'
  try {
    const result = await responseJson(await fetch(`${endpoint('/feed')}?mode=${encodeURIComponent(mode)}`))
    items.value = result.items
    autoTrain.value = result.auto_train
    status.value = items.value.length < result.batch_size ? `${result.mode} feed: ${items.value.length} matching pictures available.` : ''
  } catch (error) {
    status.value = error.message
  } finally {
    loading.value = false
  }
}

function metric(metrics, name) {
  const value = metrics.find((item) => item.metric_name === name)?.value
  return value == null ? 'n/a' : Number(value).toFixed(3)
}

async function finishBatch() {
  if (!autoTrain.value) {
    status.value = 'Batch complete. This partial batch was saved; choose another feed.'
    return
  }
  status.value = 'Batch complete. Training your model…'
  try {
    const result = await responseJson(await fetch(endpoint('/train'), { method: 'POST' }))
    status.value = `Training complete: ${result.train_count} training / ${result.holdout_count} holdout ratings; P@20 ${metric(result.metrics, 'precision_at_20')}, NDCG@20 ${metric(result.metrics, 'ndcg_at_20')}, AUC ${metric(result.metrics, 'roc_auc')}. Choose another feed.`
    await loadOptions()
  } catch (error) {
    status.value = `Batch complete. Training did not run: ${error.message}`
  }
}

async function rate(rating) {
  if (!current.value || submitting.value) return
  submitting.value = true
  try {
    const response = await fetch(endpoint('/feedback'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ impression_id: current.value.id, rating }),
    })
    await responseJson(response)
    items.value.shift()
    if (!items.value.length) await finishBatch()
  } catch (error) {
    status.value = error.message
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  let robots = document.querySelector('meta[name="robots"]')
  if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.append(robots) }
  robots.content = 'noindex,nofollow'
})

watch(profile, () => {
  items.value = []
  options.value = []
  status.value = ''
  autoTrain.value = false
  profileName.value = ''
  loadOptions()
}, { immediate: true })
</script>

<template>
  <SiteHeader />
  <main class="training">
    <header><p class="eyebrow">PRIVATE TRAINING</p><h1>{{ profileName || profile }}</h1><p>Teach this scorer what you value.</p></header>
    <p v-if="status" class="status" role="status">{{ status }}</p>

    <section v-if="!current" class="chooser" aria-label="Choose a feed">
      <h2>Choose a feed</h2>
      <button v-for="option in options" :key="option.id" :disabled="loading || !option.available" @click="loadFeed(option.id)">
        <strong>{{ option.label }}</strong><small>{{ option.available ? option.description : `${option.description} ${option.reason || ''}` }}</small>
      </button>
      <p v-if="loading">Loading…</p>
    </section>

    <section v-else class="card">
      <img :src="current.media.src" :alt="current.media.description || 'Takaneko archive image'" @error="status = `Image could not load: ${current.media.src}`">
      <p class="guide">Rate the photo: 0 Dislike · 5 Neutral · 7 Like · 10 Exceptional</p>
      <div class="ratings"><button v-for="rating in 11" :key="rating - 1" :disabled="submitting" @click="rate(rating - 1)">{{ rating - 1 }}</button></div>
      
      <p v-if="current.media.description" class="description">{{ current.media.description }}</p>
      <p class="metadata">
        {{ new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(current.media.posted_at)) }}
        · {{ current.media.platform }} · {{ current.media.display_name || `@${current.media.username}` }}
        · <a :href="current.media.post_url" target="_blank" rel="noopener noreferrer">Open original post</a>
      </p>
    </section>
  </main>
</template>

<style scoped>
.training { min-height:calc(100vh - 52px); max-width:900px; margin:auto; padding:2rem 1rem 4rem; color:var(--iw-text); }
header { text-align:center; } .eyebrow { color:var(--iw-accent); font-weight:700; letter-spacing:.12em; margin:0; } h1 { margin:.35rem 0; font-size:clamp(2rem, 7vw, 3.3rem); }
header p:last-child,.metadata,.guide,.status { color:var(--iw-text-muted); } .status { min-height:1.5rem; text-align:center; }
.chooser { display:grid; gap:.7rem; max-width:38rem; margin:2rem auto; } .chooser h2 { margin-bottom:.2rem; }
.chooser button { text-align:left; padding:1rem; background:var(--iw-surface-selected); border:1px solid var(--iw-accent-soft); color:var(--iw-text-strong); border-radius:.5rem; cursor:pointer; } .chooser button:disabled { opacity:.55; cursor:not-allowed; }
.chooser small { display:block; color:var(--iw-text-muted); margin-top:.25rem; } .card { margin:1rem auto; } img { display:block; max-width:100%; max-height:70vh; margin:auto; border-radius:.4rem; }
.description { white-space:pre-wrap; } a { color:var(--iw-accent-hover); } .metadata { line-height:1.55; } .guide { margin-top:1.5rem; }.ratings { display:flex; flex-wrap:wrap; gap:.4rem; }
.ratings button { min-width:3rem; padding:.7rem; border:1px solid var(--iw-accent-soft); background:var(--iw-surface-selected); color:var(--iw-text-strong); border-radius:.35rem; cursor:pointer; font:inherit; } .ratings button:disabled { opacity:.55; }
</style>
