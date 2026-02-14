<script setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { apiGet } from '@/services/api'
import { MEDIA_BASE } from '@/config/urls'
import TimelineDay from '@/components/timeline/TimelineDay.vue'
import Lightbox from '@/components/Lightbox.vue'
import { ArrowLeft } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'


// Router logic
const seekingPhoto = ref(false)
const route = useRoute()
const router = useRouter()

const props = defineProps({
  apiQuery: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['error', 'open', 'close', 'back'])

const activeIndex = ref(null)
const pendingIndex = ref(null)

const loading = ref(true)
const error = ref(null)

const days = ref([])
const cursor = ref(null)
const hasMore = ref(true)
const loadingMore = ref(false)

function fullImageUrl(thumbnailUrl) {
  return thumbnailUrl
    .replace('/thumbnails/200/', '/')
    .replace('.webp', '.jpg')
}

function preloadImage(src) {
  if (!src) return
  const img = new Image()
  img.src = src
}

function updateActiveIndex(item)
{
  for (let i = 0; i < flatItems.value.length; i++) 
  {
    if (String(item.id) === String(flatItems.value[i].id))
    {
      activeIndex.value = i;
      return;
    }
  }
}

function openImage(item) {
  console.log("Open Image", item.id)
  router.replace({
    query: {
      ...route.query,
      photo: item.id
    }
  })
  updateActiveIndex(item)
}

function closeLightbox() {
  activeIndex.value = null
  emit('close')
}


function showPrev() {
  console.log(activeIndex.value)

  if (activeIndex.value > 0) {
    const item = flatItems.value[activeIndex.value - 1]
    router.replace({
      query: {
        ...route.query,
        photo: item.id
      }
    })
    updateActiveIndex(item)
  }
}

async function showNext() {
  console.log("Active Index:",activeIndex.value)
  console.log("Flat items amout",flatItems.value.length)
  if (activeIndex.value == null) return

  const targetIndex = activeIndex.value + 1

  console.log("Target Index:",targetIndex)

  // Case 1: already loaded
  if (targetIndex < flatItems.value.length) {
    console.log("Already loaded")
    const item = flatItems.value[targetIndex]
    router.replace({
      query: { ...route.query, photo: item.id }
    })

    updateActiveIndex(item)
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
  return days.value.flatMap(day => day.items)
})

const activeItem = computed(() => {
  if (activeIndex.value === null) return null
  return flatItems.value[activeIndex.value] || null
})

const sentinel = ref(null)
let observer = null

onMounted(() => {
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
    cursor.value = null
    hasMore.value = true
  }

  loading.value = reset
  loadingMore.value = !reset
  error.value = null

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const params = new URLSearchParams()

  // append apiQuery safely
  for (const key in props.apiQuery) {
    const value = props.apiQuery[key]

    if (Array.isArray(value)) {
      value.forEach(v => params.append(key, v))
    } else if (value != null) {
      params.append(key, value)
    }
  }

  // always append timezone
  params.append('tz', timezone)

  // cursor
  if (cursor.value) {
    params.append('cursor', cursor.value)
  }

  try {

    console.log(`/timeline?${params.toString()}`)
    const res = await apiGet(`/timeline?${params.toString()}`)

    const normalized = res.items.map(group => ({
      ...group,
      year: new Date(group.date).getFullYear(),
      items: group.items.map(item => ({
        ...item,
        thumbnail: `${MEDIA_BASE}${item.thumbnail}`,
        src: `${MEDIA_BASE}${item.src}`
      }))
    }))

    // ✅ Deduplicate days AGAINST CURRENTLY LOADED DAYS
    const existingDates = new Set(days.value.map(d => d.date))
    const deduped = normalized.filter(group => {
      if (existingDates.has(group.date)) return false
      existingDates.add(group.date)
      return true
    })

    // ✅ THIS is what actually grows the timeline
    days.value.push(...deduped)


    // cursor handling (safe for later)
    cursor.value = res.next_cursor ?? null
    hasMore.value = Boolean(res.next_cursor)

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
        aria-label="back"
      >
        <ArrowLeft :size="28" />
      </button>
    </div>

    <div v-if="loading" class="loading">
      Loading timeline…
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

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
      Loading more…
    </div>

    <div v-if="!hasMore" class="end">
      End of timeline
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