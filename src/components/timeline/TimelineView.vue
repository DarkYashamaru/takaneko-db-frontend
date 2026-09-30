<script setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { apiGet } from '@/services/api'
import { MEDIA_BASE } from '@/config/urls'
import TimelineDay from '@/components/timeline/TimelineDay.vue'
import TimelineItem from '@/components/timeline/TimelineItem.vue'
import Lightbox from '@/components/Lightbox.vue'
import { ArrowLeft } from 'lucide-vue-next'
import { t } from '@/i18n'
import { track } from '@/services/analytics'
import { useRoute, useRouter } from 'vue-router'


// Router logic
const route = useRoute()
const router = useRouter()

const props = defineProps({
  apiQuery: {
    type: Object,
    required: true
  },
  presentation: {
    type: String,
    default: 'timeline'
  }
})

const photoId = computed(() => route.query.photo)

const emit = defineEmits(['error', 'open', 'close', 'back'])

const activeIndex = ref(null)

const loading = ref(true)
const error = ref(null)

const days = ref([])
const relevanceItems = ref([])
const cursor = ref(null)
const hasMore = ref(true)
const loadingMore = ref(false)

const isRelevance = computed(() => props.presentation === 'relevance')

// Lightbox state belongs in the URL but must never become an API filter or
// reload the active result set while navigating between pictures.
const requestQuery = computed(() => {
  const query = { ...props.apiQuery }
  delete query.photo
  return query
})
const requestKey = computed(() => JSON.stringify(requestQuery.value))

function updateActiveIndex(id)
{
  for (let i = 0; i < flatItems.value.length; i++) 
  {
    if (String(id) === String(flatItems.value[i].id))
    {
      activeIndex.value = i;
      return;
    }
  }
}

function getIndexFromId(id)
{
  for (let i = 0; i < flatItems.value.length; i++) 
  {
    if (String(id) === String(flatItems.value[i].id))
    {
      return i;
    }
  }
  return -1
}

watch(
  () => route.query.photo,
  (newPhoto) => {
    updateActiveIndex(newPhoto)
  }
)

watch(
  () => [props.presentation, requestKey.value],
  () => {
    activeIndex.value = null
    if (observer) loadTimeline({ reset: true })
  },
  { deep: true }
)

function openImage(item) {
  track("lightbox_open", { platform: item.platform || "", media_type: item.media_type || "" })
  //console.log("Open Image", item.id)
  router.replace({
    query: {
      ...route.query,
      photo: item.id
    }
  })
}

function closeLightbox() {
  activeIndex.value = null
  emit('close')
}

// Preload previous and next pictures logic

function preloadImage(src) {
  if (!src) return
  const img = new Image()
  img.src = src
}

watch(activeIndex, (index) => {
  if (index == null) return

  const offsets = [-2, -1, 1, 2]

  offsets.forEach(offset => {
    const item = flatItems.value[index + offset]
    if (item) preloadImage(item.src)
  })
})

//Show next and previous picture

function showPrev() {
  if (activeIndex.value > 0) {
    const item = flatItems.value[activeIndex.value - 1]
    router.replace({
      query: {
        ...route.query,
        photo: item.id
      }
    })
  }
}

async function showNext() {
  if (activeIndex.value == null) return

  const targetIndex = activeIndex.value + 1

  if (targetIndex < flatItems.value.length) {
    const item = flatItems.value[targetIndex]
    router.replace({
      query: { ...route.query, photo: item.id }
    })
    return
  }

  if(targetIndex >= flatItems.value.length && hasMore.value && !loadingMore.value)
  {
    await loadTimeline()
    showNext()
  }
}

const timelineByYear = computed(() => {
  const map = {}

  for (const day of days.value) {
    if (!map[day.year]) {
      map[day.year] = []
    }
    map[day.year].push(day)
  }

  return Object.entries(map)
    .sort((a, b) => b[0] - a[0]) // newest year first
    .map(([year, groups]) => ({
      year,
      groups
    }))
})

const flatItems = computed(() => {
  return isRelevance.value ? relevanceItems.value : days.value.flatMap(day => day.items)
})

const activeItem = computed(() => {
  if (activeIndex.value === null) return null
  return flatItems.value[activeIndex.value] || null
})

const sentinel = ref(null)
let observer = null

async function loadStartingPictureInLightbox() 
{
  let index = -1;
  do 
  {
    await loadTimeline()
    index = getIndexFromId(route.query.photo)
  } while (index === -1 && hasMore.value);

  if (index !== -1) updateActiveIndex(route.query.photo)
}

onMounted(() => 
{
  if(route.query.photo)
  {
    loadStartingPictureInLightbox()
  }

  observer = new IntersectionObserver(
    async ([entry]) => {
      if (!entry.isIntersecting) return
      if (loadingMore.value || !hasMore.value) return

      // Temporarily unobserve to avoid re-trigger spam
      observer.unobserve(entry.target)

      await loadTimeline()

      // Re-observe after DOM grows
      if (sentinel.value && hasMore.value) {
        observer.observe(sentinel.value)
      }
    },
    {
      threshold: 0.25 // 25% of sentinel visible
    }
  )

  if (sentinel.value) {
    observer.observe(sentinel.value)
  }
})

onUnmounted(() => {
  observer?.disconnect()
})

let observedEl = null

watch(
  () => sentinel.value,
  (el) => {
    if (!observer) return
    if (observedEl) {
      try { observer.unobserve(observedEl) } catch (e) { /* ignore */ }
      observedEl = null
    }
    if (el) {
      observer.observe(el)
      observedEl = el
    }
  },
  { immediate: true }
)


async function loadTimeline({ reset = false } = {}) {
  //console.log('loadTimeline called', { reset, cursor: cursor.value, loadingMore: loadingMore.value, hasMore: hasMore.value })
  if (!reset && loadingMore.value) return

  if (loadingMore.value || (!hasMore.value && !reset)) return

  if (reset) {
    days.value = []
    relevanceItems.value = []
    cursor.value = null
    hasMore.value = true
  }

  loading.value = reset
  loadingMore.value = !reset
  error.value = null

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const params = new URLSearchParams()

  // Append the request query without the lightbox-only photo parameter.
  for (const key in requestQuery.value) {
    const value = requestQuery.value[key]

    if (Array.isArray(value)) {
      value.forEach(v => params.append(key, v))
    } else if (value != null) {
      params.append(key, value)
    }
  }

  // Chronological timelines group media by the viewer's local calendar day.
  if (!isRelevance.value) {
    params.append('tz', timezone)
  }

  // cursor
  if (cursor.value) {
    params.append('cursor', cursor.value)
  }

  try {

    const endpoint = isRelevance.value ? '/context-search' : '/timeline'
    const res = await apiGet(`${endpoint}?${params.toString()}`)

    if (isRelevance.value) {
      const knownIds = new Set(relevanceItems.value.map(item => item.id))
      const normalized = res.items.map(item => ({
        ...item,
        thumbnail: `${MEDIA_BASE}${item.thumbnail}`,
        src: `${MEDIA_BASE}${item.src}`
      })).filter(item => !knownIds.has(item.id))
      relevanceItems.value.push(...normalized)
      if (!params.has('cursor')) {
        track('search_results_loaded', { result_count: normalized.length, has_more: Boolean(res.next_cursor) }, route.path)
      }
    } else {
      const normalized = res.items.map(group => ({
        ...group,
        year: new Date(group.date).getFullYear(),
        items: group.items.map(item => ({
        ...item,
        thumbnail: `${MEDIA_BASE}${item.thumbnail}`,
        src: `${MEDIA_BASE}${item.src}`
      }))
    }))

      // Deduplicate days against currently loaded chronological pages.
      const existingDates = new Set(days.value.map(d => d.date))
      const deduped = normalized.filter(group => {
        if (existingDates.has(group.date)) return false
        existingDates.add(group.date)
        return true
      })

      days.value.push(...deduped)
      if (!params.has('cursor')) {
        track('search_results_loaded', { result_count: normalized.reduce((count, group) => count + group.items.length, 0), has_more: Boolean(res.next_cursor) }, route.path)
      }
    }

    cursor.value = res.next_cursor ?? null
    hasMore.value = Boolean(res.next_cursor)
    if (days.value.length && [2, 5, 10].includes(days.value.length)) track("timeline_depth", { loaded_pages: days.value.length }, route.path)

  } catch (err) {
    error.value = err.message
    emit('error', err)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

</script>

<template>
  <main class="idol-timeline">

    <div class="timeline-header">
      <button
        class="icon-btn back-btn"
        @click="$emit('back')"
        :aria-label="t('common.back')"
      >
        <ArrowLeft :size="28" />
      </button>
    </div>

    <div v-if="loading" class="loading">
      {{ isRelevance ? t('search.relevanceLoading') : t('timeline.loading') }}
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <section
      v-else-if="isRelevance"
      class="relevance-results"
    >
      <h2 class="relevance-heading">
        {{ t('search.relevanceTitle', { query: apiQuery.context }) }}
      </h2>
      <p v-if="!relevanceItems.length" class="empty-results">
        {{ t('search.relevanceEmpty') }}
      </p>
      <div v-else class="relevance-grid">
        <TimelineItem
          v-for="item in relevanceItems"
          :key="item.id"
          :item="item"
          @open="openImage"
        />
      </div>
    </section>

    <section
      v-else
      v-for="yearBlock in timelineByYear"
      :key="yearBlock.year"
      class="year-block"
    >
      <h2 class="year-label">
        {{ yearBlock.year }}
      </h2>

      <TimelineDay
        v-for="group in yearBlock.groups"
        :key="group.date"
        :group="group"
        @open="openImage"
      />
    </section>

    <div
      ref="sentinel"
      class="scroll-sentinel"
    />

    <div v-if="loadingMore" class="loading-more">
      {{ isRelevance ? t('search.relevanceLoadingMore') : t('timeline.loadingMore') }}
    </div>

    <div v-if="!hasMore" class="end">
      {{ isRelevance ? t('search.relevanceEnd') : t('timeline.end') }}
    </div>

  </main>

  <Lightbox
    v-if="activeItem"
    :src="activeItem.src"
    :item="activeItem"
    @close="closeLightbox"
    @prev="showPrev"
    @next="showNext"
  />
</template>

<style scoped>
.idol-timeline {
  background: #000;
  min-height: 100vh;
  padding: 1rem;
}

.loading,
.error {
  color: #888;
  padding: 2rem;
}

.year-block {
  margin-bottom: 3rem;
}

.relevance-heading {
  color: #e6e6e6;
  font-size: 1.25rem;
  margin: 1rem 0;
}

.relevance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 200px);
  gap: 6px;
}

.empty-results {
  color: #888;
  padding: 2rem 0;
}

.year-label {
  font-size: 2rem;
  font-weight: 600;
  color: #e6e6e6;
  margin: 1.5rem 0 1rem;
}

.year-label {
  position: sticky;
  top: 56px;
  background: #000;
  z-index: 20;
}

.scroll-sentinel {
  height: 20vh; /* relative to viewport */
}

.loading-more,
.end {
  color: #666;
  text-align: center;
  padding: 2rem;
}

.timeline-header {
  position: sticky;
  top: 0;
  z-index: 30;

  display: flex;
  align-items: center;

  height: 56px;
  padding: 0 0.5rem;

  background: linear-gradient(
    to bottom,
    rgba(0,0,0,0.95),
    rgba(0,0,0,0.85)
  );

  backdrop-filter: blur(6px);
}

.back-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.25rem;
  cursor: pointer;
  opacity: 0.85;
}

.back-btn:hover {
  opacity: 1;
  transform: translateX(-2px);
}

.back-btn:active {
  transform: translateX(-4px) scale(0.96);
}

.icon-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.25rem;
  cursor: pointer;
  opacity: 0.85;
}

.icon-btn:hover {
  opacity: 1;
}

</style>
