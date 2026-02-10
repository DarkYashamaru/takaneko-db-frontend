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

// Keep loading pages until the requested flat index exists or we run out of pages.
// Returns true if index became available, false otherwise.
async function ensureIndexLoaded(targetIndex) {
  // Fast path: already there
  if (targetIndex < flatItems.value.length) return true

  // Keep fetching while we need more pages
  while (targetIndex >= flatItems.value.length && hasMore.value && !loadingMore.value) {
    // load another page
    await loadTimeline()
    // loop will re-check whether the index is now available
  }

  return targetIndex < flatItems.value.length
}


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

function openImage(item) {
  router.replace({
    query: {
      ...route.query,
      photo: item.id
    }
  })
}

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

  // Case 1: already loaded
  if (targetIndex < flatItems.value.length) {
    const item = flatItems.value[targetIndex]
    router.replace({
      query: { ...route.query, photo: item.id }
    })
    return
  }

  // Case 2: need more data — ensure we load until the target exists (or we can't)
  if (hasMore.value && !loadingMore.value) {
    // mark intent (optional — you can use this for UI)
    pendingIndex.value = targetIndex

    const ok = await ensureIndexLoaded(targetIndex)

    // clear intent
    pendingIndex.value = null

    if (ok) {
      // item is now loaded — update URL to open it
      const item = flatItems.value[targetIndex]
      router.replace({
        query: { ...route.query, photo: item.id }
      })
    } else {
      // ran out of pages — nothing to do (optionally show toast)
      // console.warn('Desired index not found, no more pages')
    }
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
    ([entry]) => {
      if (entry.isIntersecting) {
        loadTimeline()
      }
    },
    {
      rootMargin: '800px'
    }
  )

  if (sentinel.value) {
    observer.observe(sentinel.value)
  }
})

onUnmounted(() => {
  observer?.disconnect()
})

async function loadTimeline({ reset = false } = {}) {

  if (!reset && loadingMore.value) return

  const effectiveCursor = reset ? null : cursor.value

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

  const params = new URLSearchParams({
  ...props.apiQuery,
  tz: timezone,
  })

    if (cursor.value) {
    params.append('cursor', cursor.value)
    }

  try {
    const res = await apiGet(`/timeline?${params.toString()}`)

    // 🔽 TEMP: support both paged and non-paged backends
    const newGroups = Array.isArray(res) ? res : res.items

    //console.log(res.items[0].items[0].faces[0].bbox)

    const normalized = newGroups.map(group => ({
      ...group,
      year: new Date(group.date).getFullYear(),
      items: group.items.map(item => ({
        ...item,
        thumbnail: `${MEDIA_BASE}${item.thumbnail}`,
        src: `${MEDIA_BASE}${item.src}`
      }))
    }))

    days.value.push(...normalized)

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

watch(
  () => props.apiQuery,
  () => {
    loadTimeline({ reset: true })
  },
  { deep: true, immediate: true }
)

watch(activeIndex, (index) => {
  if (index === null) return

  const prev = flatItems.value[index - 1]
  const next = flatItems.value[index + 1]

  if (prev) preloadImage(fullImageUrl(prev.thumbnail))
  if (next) preloadImage(fullImageUrl(next.thumbnail))
})

// watch(
//   () => flatItems.value.length,
//   () => {
//     if (
//       pendingNext.value &&
//       activeIndex.value < flatItems.value.length - 1
//     ) {
//       pendingNext.value = false
//       activeIndex.value++
//     }
//   }
// )

watch(
  [() => route.query.photo, () => flatItems.value],
  async ([photoId, items]) => {
    if (!photoId) {
      activeIndex.value = null
      seekingPhoto.value = false
      return
    }

    if (!items.length) return

    const index = items.findIndex(
      item => String(item.id) === String(photoId)
    )

    if (index !== -1) {
      activeIndex.value = index
      seekingPhoto.value = false
      return
    }

    // ❗ Not found yet → try loading more
    if (hasMore.value && !loadingMore.value) {
      seekingPhoto.value = true
      await loadTimeline()
    } else {
      // Not found & no more pages
      seekingPhoto.value = false
      activeIndex.value = null
    }
  },
  { immediate: true }
)

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
    @close="() => { activeIndex = null; emit('close') }"
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
  height: 1px;
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
