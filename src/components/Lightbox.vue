<script setup>
import { ArrowLeft, Info, ChevronRight, ChevronLeft } from 'lucide-vue-next'
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  src: String,
  item: Object
})

const startX = ref(0)
const startY = ref(0)
const deltaX = ref(0)
const deltaY = ref(0)
const isSwiping = ref(false)

function onPointerDown(e) {
  if (e.pointerType === 'mouse') return

  startX.value = e.clientX
  startY.value = e.clientY
  deltaX.value = 0
  deltaY.value = 0
  isSwiping.value = true
}

function onPointerMove(e) {
  if (!isSwiping.value) return

  deltaX.value = e.clientX - startX.value
  deltaY.value = e.clientY - startY.value
}

function onPointerUp() {
  if (!isSwiping.value) return

  const absX = Math.abs(deltaX.value)
  const absY = Math.abs(deltaY.value)

  const SWIPE_THRESHOLD = 60

  // Horizontal swipe
  if (absX > absY && absX > SWIPE_THRESHOLD) {
    deltaX.value > 0 ? emit('prev') : emit('next')
  }

  // Vertical swipe (close)
  if (absY > absX && absY > SWIPE_THRESHOLD && deltaY.value > 0) {
    emit('close')
  }

  isSwiping.value = false
}

const videoEl = ref(null)

const showInfo = ref(false)

const emit = defineEmits(['close', 'prev', 'next'])

function onKey(e) {
  if (e.key === 'Escape') emit('close')
  else if (e.key === 'ArrowLeft') emit('prev')
  else if (e.key === 'ArrowRight') emit('next')
  else if (e.key === ' ' && videoEl.value) {
    e.preventDefault()
    videoEl.value.paused
      ? videoEl.value.play()
      : videoEl.value.pause()
  }
}

onMounted(() => {
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKey)
})

watch(
  () => props.item,
  () => {
    if (videoEl.value) {
      videoEl.value.pause()
      videoEl.value.currentTime = 0
    }
  }
)
</script>

<template>
  <div class="lightbox-root" @click.self="$emit('close')">

    <!-- Top bar -->
    <div class="lightbox-topbar">
      <button class="icon-btn" @click="$emit('close')" aria-label="Close">
        <ArrowLeft :size="35" />
      </button>
      <div class="spacer" />
      <button class="icon-btn" @click="showInfo = !showInfo" aria-label="Info">
        <Info :size="29" />
      </button>
    </div>

    <!-- Main content -->
    <div class="lightbox-body">
      <div class="media-stage">
        <div
          class="media-container"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        >
          <template v-if="item.type === 'image'">
            <img :src="src" />
          </template>

          <template v-else-if="item.type === 'video'">
            <video
              ref="videoEl"
              :src="item.src"
              controls
              autoplay
              loop
              playsinline
              preload="metadata"
            />
          </template>
        </div>
        <!-- Navigation -->
        <button
          class="nav-btn nav-prev"
          @click.stop="$emit('prev')"
          aria-label="Previous"
        >
          <ChevronLeft :size="36" />
        </button>

        <!-- Right -->
        <button
          class="nav-btn nav-next"
          @click.stop="$emit('next')"
          aria-label="Next"
        >
          <ChevronRight :size="36" />
        </button>
      </div>

      <aside v-if="showInfo" class="info-panel">
        <h3>{{ item.display_name }}</h3>
        <p class="username">@{{ item.username }}</p>

        <div class="meta">
          <div>
            <strong>Platform: </strong>
            <span class="capitalize">{{ item.platform }}</span>
          </div>

          <div>
            <strong>Posted at: </strong>
            <span>{{ new Date(item.posted_at).toLocaleString() }}</span>
          </div>
        </div>

        <a
          :href="item.post_url"
          target="_blank"
          rel="noopener"
          class="external-link"
        >
          View original post
        </a>

        <div>
          <p>{{ item.description }}</p>
        </div>
      </aside>
    </div>

  </div>
</template>


<style scoped>
.lightbox-root {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  z-index: 1000;

  display: flex;
  flex-direction: column;
}

/* ─── Top bar ───────────────────────── */
.lightbox-topbar {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: #fff;
  z-index: 2;
}

.spacer {
  flex: 1;
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

/* ─── Body ──────────────────────────── */
.lightbox-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  height: calc(100vh - 56px);
}

.media-container {
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: pan-y;
  overflow: hidden;
}

.media-container img,
.media-container video {
  max-width: 100%;
  max-height: 100%;

  object-fit: contain;
  display: block;

  animation: zoomIn 120ms ease-out;
}

.media-stage {
  position: relative;
  flex: 1;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: hidden;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);

  width: 56px;
  height: 56px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);

  color: white;
  cursor: pointer;

  opacity: 0.65;
  transition:
    opacity 0.15s ease,
    background 0.15s ease,
    transform 0.1s ease;

  pointer-events: auto;
}

.nav-btn:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.7);
}

.nav-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.nav-prev {
  left: 16px;
}

.nav-next {
  right: 16px;
}

@media (hover: none) {
  .nav-btn {
    display: none;
  }
}


/* Info panel */
.info-panel {
  width: 340px;
  background: #111;
  color: #eee;
  padding: 1rem;
  border-left: 1px solid #222;
  overflow-y: auto;
}

.username {
  color: #aaa;
  margin-bottom: 1rem;
}

.meta div {
  margin-bottom: 0.75rem;
}

.external-link {
  display: inline-block;
  margin-top: 1rem;
  color: #6ea8ff;
  text-decoration: none;
}

.external-link:hover {
  text-decoration: underline;
}

/* Animation */
@keyframes zoomIn {
  from {
    transform: scale(0.97);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.capitalize {
  text-transform: capitalize;
}

.icon-btn {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 999px;

  width: 44px;
  height: 44px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #fff;
  cursor: pointer;

  transition: background 0.15s ease, transform 0.1s ease;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

.icon-btn:active {
  transform: scale(0.96);
}

</style>
