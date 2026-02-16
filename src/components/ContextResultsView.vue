<script setup>
import { apiGet } from '@/services/api'
import { MEDIA_BASE } from '@/config/urls'
import { useMediaFeed } from '@/composables/useMediaFeed'
import TimelineItem from '@/components/timeline/TimelineItem.vue'
import Lightbox from '@/components/Lightbox.vue'

const props = defineProps({
  apiQuery: { type: Object, required: true }
})

function fetchPage(cursor) {
  const params = new URLSearchParams()

  for (const key in props.apiQuery) {
    const value = props.apiQuery[key]
    if (Array.isArray(value)) value.forEach(v => params.append(key, v))
    else if (value != null) params.append(key, value)
  }

  if (cursor) params.append('cursor', cursor)

  return apiGet(`/timeline?${params.toString()}`)
}

function normalize(res) {
  return res.items.map(item => ({
    ...item,
    thumbnail: `${MEDIA_BASE}${item.thumbnail}`,
    src: `${MEDIA_BASE}${item.src}`
  }))
}

const feed = useMediaFeed({ fetchPage, normalize })
</script>

<template>
  <main class="context-results">
    <div class="grid">
      <TimelineItem
        v-for="item in feed.items"
        :key="item.id"
        :item="item"
        @open="feed.openImage"
      />
    </div>

    <div ref="feed.sentinel" class="scroll-sentinel" />

    <Lightbox
      v-if="feed.activeItem"
      :src="feed.activeItem.src"
      :item="feed.activeItem"
      @close="feed.closeLightbox"
    />
  </main>
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
