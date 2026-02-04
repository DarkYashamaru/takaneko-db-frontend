<script setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiGet } from '@/services/api'
import { MEDIA_BASE } from '@/config/urls'
import TimelineDay from '@/components/timeline/TimelineDay.vue'
import Lightbox from '@/components/Lightbox.vue'

const activeIndex = ref(null)
const pendingNext = ref(false)
const lastRequestedCursor = ref(null)

const route = useRoute()
const router = useRouter()
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
  const index = flatItems.value.findIndex(i => i.id === item.id)
  if (index !== -1) {
    activeIndex.value = index

    router.replace({
      query: {
        ...route.query,
        photo: item.id
      }
    })
  }
}

function closeImage() {
  activeIndex.value = null

  const { photo, ...rest } = route.query
  router.replace({ query: rest })
}

function updateUrlForIndex() {
  const item = flatItems.value[activeIndex.value]
  if (!item) return

  router.replace({
    query: {
      ...route.query,
      photo: item.id
    }
  })
}

function showPrev() {
  if (activeIndex.value > 0) {
    activeIndex.value--
    updateUrlForIndex()
  }
}

function showNext() {
  // Normal case: next image already loaded
  if (activeIndex.value < flatItems.value.length - 1) {
    activeIndex.value++
    updateUrlForIndex()
    return
  }

  // Edge case: at end, but more data exists
  if (hasMore.value && !loadingMore.value) {
    pendingNext.value = true
    loadTimeline()
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

  const effectiveCursor = reset ? null : cursor.value

  // 🔒 Prevent refetching the same page
  if (
    !reset &&
    effectiveCursor === lastRequestedCursor.value
  ) {
    return
  }


  if (loadingMore.value || (!hasMore.value && !reset)) return

  if (reset) {
    days.value = []
    cursor.value = null
    hasMore.value = true
    lastRequestedCursor.value = null
  }

  loading.value = reset
  loadingMore.value = !reset
  error.value = null

  const username = route.params.username
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const query = new URLSearchParams({
    username,
    tz: timezone,
  })

  if (cursor.value) {
    query.append('cursor', cursor.value)
  }

  try {
    lastRequestedCursor.value = effectiveCursor
    const res = await apiGet(`/timeline?${query.toString()}`)

    // 🔽 TEMP: support both paged and non-paged backends
    const newGroups = Array.isArray(res) ? res : res.items

    const normalized = newGroups.map(group => ({
      ...group,
      year: new Date(group.date).getFullYear(),
      items: group.items.map(item => ({
        ...item,
        thumbnail: `${MEDIA_BASE}${item.thumbnail}`
      }))
    }))

    days.value.push(...normalized)

    // cursor handling (safe for later)
    cursor.value = res.next_cursor ?? null
    hasMore.value = Boolean(res.next_cursor)

  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}
onMounted(() => {
  loadTimeline({ reset: true })
})

watch(
  () => [route.query.photo, flatItems.value.length],
  ([photo]) => {
    if (!photo) return
    const index = flatItems.value.findIndex(i => i.id === photo)
    if (index !== -1) {
      activeIndex.value = index
    }
  },
  { immediate: true }
)

watch(activeIndex, (index) => {
  if (index === null) return

  const prev = flatItems.value[index - 1]
  const next = flatItems.value[index + 1]

  if (prev) preloadImage(fullImageUrl(prev.thumbnail))
  if (next) preloadImage(fullImageUrl(next.thumbnail))
})

watch(
  () => flatItems.value.length,
  () => {
    if (
      pendingNext.value &&
      activeIndex.value < flatItems.value.length - 1
    ) {
      pendingNext.value = false
      activeIndex.value++
      updateUrlForIndex()
    }
  }
)
</script>

<template>
  <main class="idol-timeline">
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
    :src="fullImageUrl(activeItem.thumbnail)"
    :item="activeItem"
    @close="closeImage"
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
  top: 0;
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
</style>
