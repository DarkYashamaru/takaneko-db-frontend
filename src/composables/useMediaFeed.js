import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function useMediaFeed({ fetchPage, normalize }) {
  const route = useRoute()
  const router = useRouter()

  const activeIndex = ref(null)
  const loading = ref(true)
  const loadingMore = ref(false)
  const error = ref(null)

  const items = ref([])       // FLAT list now
  const cursor = ref(null)
  const hasMore = ref(true)

  const flatItems = computed(() => items.value)

  const activeItem = computed(() => {
    if (activeIndex.value == null) return null
    return flatItems.value[activeIndex.value] || null
  })

  function updateActiveIndex(id) {
    const index = flatItems.value.findIndex(i => String(i.id) === String(id))
    if (index !== -1) activeIndex.value = index
  }

  watch(
    () => route.query.photo,
    (newPhoto) => {
      if (newPhoto) updateActiveIndex(newPhoto)
    }
  )

  function openImage(item) {
    router.replace({
      query: { ...route.query, photo: item.id }
    })
  }

  function closeLightbox() {
    activeIndex.value = null
  }

  function preloadImage(src) {
    if (!src) return
    const img = new Image()
    img.src = src
  }

  watch(activeIndex, (index) => {
    if (index == null) return
    [-2, -1, 1, 2].forEach(offset => {
      const item = flatItems.value[index + offset]
      if (item) preloadImage(item.src)
    })
  })

  async function load({ reset = false } = {}) {
    if (!reset && loadingMore.value) return
    if (loadingMore.value || (!hasMore.value && !reset)) return

    if (reset) {
      items.value = []
      cursor.value = null
      hasMore.value = true
    }

    loading.value = reset
    loadingMore.value = !reset
    error.value = null

    try {
      const res = await fetchPage(cursor.value)
      const newItems = normalize(res)

      items.value.push(...newItems)

      cursor.value = res.next_cursor ?? null
      hasMore.value = Boolean(res.next_cursor)

    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  const sentinel = ref(null)
  let observer = null

  onMounted(() => {
    observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting) return
      if (loadingMore.value || !hasMore.value) return

      observer.unobserve(entry.target)
      await load()
      if (sentinel.value && hasMore.value) {
        observer.observe(sentinel.value)
      }
    }, { threshold: 0.25 })

    if (sentinel.value) observer.observe(sentinel.value)
  })

  onUnmounted(() => observer?.disconnect())

  return {
    items,
    flatItems,
    activeItem,
    activeIndex,
    loading,
    loadingMore,
    error,
    hasMore,
    cursor,
    sentinel,
    openImage,
    closeLightbox,
    load
  }
}
