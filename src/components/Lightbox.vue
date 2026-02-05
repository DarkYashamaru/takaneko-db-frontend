<script setup>
import { ArrowLeft, Info, ChevronRight, ChevronLeft } from 'lucide-vue-next'
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
  src: String,
  item: Object
})

const startX = ref(0)
const startY = ref(0)
const deltaX = ref(0)
const deltaY = ref(0)
const isSwiping = ref(false)

// ===== zoom/ pan logic ============
const scale = ref(1)
const minScale = 1
const maxScale = 10

const translateX = ref(0)
const translateY = ref(0)

const isPanning = ref(false)
let lastX = 0
let lastY = 0
let lastDistance = 0
const mediaContainer = ref(null)
const containerRect = ref({ width: 0, height: 0 })

const panBounds = computed(() => {
  if (scale.value <= 1) {
    return { x: 0, y: 0 }
  }

  const extraX =
    (containerRect.value.width * Math.min(scale.value, 2) - containerRect.value.width) / 2

  const extraY =
    (containerRect.value.height * Math.min(scale.value, 2) - containerRect.value.height) / 2

  return {
    x: extraX,
    y: extraY
  }
})

function updateContainerRect() {
  if (!mediaContainer.value) return
  const r = mediaContainer.value.getBoundingClientRect()
  containerRect.value = { width: r.width, height: r.height }
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val))
}

watch(scale, () => {
  translateX.value = clamp(
    translateX.value,
    -panBounds.value.x,
    panBounds.value.x
  )
  translateY.value = clamp(
    translateY.value,
    -panBounds.value.y,
    panBounds.value.y
  )
})

onMounted(() => {
  updateContainerRect()
  window.addEventListener('resize', updateContainerRect)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerRect)
})

const cursor = computed(() => {
  if (props.item.type !== 'image') return 'default'
  if (scale.value <= 1) return 'default'
  return isPanning.value ? 'grabbing' : 'grab'
})

function getDistance(touches) {
  const [a, b] = touches
  return Math.hypot(
    b.clientX - a.clientX,
    b.clientY - a.clientY
  )
}

function onWheel(e) {
  //if (props.item.type !== 'image') return

  e.preventDefault()

  const delta = -e.deltaY
  const zoomFactor = delta > 0 ? 1.1 : 0.9

  const nextScale = Math.min(
    maxScale,
    Math.max(minScale, scale.value * zoomFactor)
  )

  // Reset pan when fully zoomed out
  if (nextScale === 1) {
    translateX.value = 0
    translateY.value = 0
  }

  scale.value = nextScale
}

function onPointerDown(e) 
{
  e.preventDefault()
  console.log("onPointerDown")
  console.log(containerRect.value.height, containerRect.value.width)

  //if (props.item.type !== 'image') return

  if (scale.value > 1) {
    isPanning.value = true
    lastX = e.clientX
    lastY = e.clientY

    e.currentTarget.setPointerCapture(e.pointerId)
    return
  }

  // swipe logic
  if (e.pointerType === 'mouse') return
  startX.value = e.clientX
  startY.value = e.clientY
  deltaX.value = 0
  deltaY.value = 0
  isSwiping.value = true
}

function onPointerUp(e) 
{
  console.log("onPointerUp")

  if (isPanning.value) {
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  isPanning.value = false

  if (!isSwiping.value) return

  const absX = Math.abs(deltaX.value)
  const absY = Math.abs(deltaY.value)

  if (scale.value === 1) {
    const SWIPE_THRESHOLD = 60

    if (absX > absY && absX > SWIPE_THRESHOLD) {
      deltaX.value > 0 ? emit('prev') : emit('next')
    }

    if (absY > absX && absY > SWIPE_THRESHOLD && deltaY.value > 0) {
      emit('close')
    }
  }

  isSwiping.value = false
}

function onPointerMove(e) {
  console.log("onPointerMove")
  if (isPanning.value) 
  {
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY

    const nextX = translateX.value + dx / (scale.value * 0.8)
    const nextY = translateY.value + dy / (scale.value * 0.8)

    translateX.value = clamp(nextX, -panBounds.value.x, panBounds.value.x)
    translateY.value = clamp(nextY, -panBounds.value.y, panBounds.value.y)

    lastX = e.clientX
    lastY = e.clientY
    console.log({ nextX, nextY, translateX: translateX.value, scale: scale.value})
    return
  }

  if (!isSwiping.value) return

  deltaX.value = e.clientX - startX.value
  deltaY.value = e.clientY - startY.value
}

watch(isPanning, (val, oldVal) => {
  console.log('[isPanning]', oldVal, '→', val)
})

function onTouchMove(e) {
  if (e.touches.length !== 2) return

  e.preventDefault()

  const distance = getDistance(e.touches)

  if (!lastDistance) 
  {
    lastDistance = distance
    return
  }

  const zoomFactor = distance / lastDistance
  scale.value = Math.min(maxScale, Math.max(minScale, scale.value * zoomFactor))

  lastDistance = distance
}

function onTouchEnd() {
  lastDistance = 0
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

watch(
  () => props.item,
  () => {
    scale.value = 1
    translateX.value = 0
    translateY.value = 0

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
      <div class="media-stage" ref="mediaContainer">
        <div
          class="media-container"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
          @wheel.prevent="onWheel"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
          :style="{ transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`, cursor}"
        >
          <template v-if="item.type === 'image'">
            <img
              :src="src"
              draggable="false"
              @dragstart.prevent
            />
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
  touch-action: none;
  overflow: hidden;
}

.media-container,
.media-container * {
  user-select: none;
  -webkit-user-drag: none;
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
