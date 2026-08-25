<script setup>
import { ArrowLeft, Info, ChevronRight, ChevronLeft } from 'lucide-vue-next'
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { getIdolFaceImageBySlug, getIdolNameBySlug } from '@/data/idols'
import { MEDIA_BASE } from '@/config/urls'
import { useRouter } from 'vue-router'
import '@/composables/lightbox.css'
import { t, formatDateTime } from '@/i18n'

const router = useRouter()

const props = defineProps({
  src: String,
  item: Object
})

const startX = ref(0)
const startY = ref(0)
const deltaX = ref(0)
const deltaY = ref(0)
const isSwiping = ref(false)

// ===== face overlay logic =========
const hoveredFace = ref(null)

const mainImage = ref(null)

const faceBoxStyle = computed(() => {
  if (!hoveredFace.value || !mainImage.value) return {}

  const img = mainImage.value
  const imgRect = img.getBoundingClientRect()
  const wrapper = img.parentElement // image-wrapper
  if (!wrapper) return {}

  const wrapperRect = wrapper.getBoundingClientRect()

  const naturalW = img.naturalWidth
  const naturalH = img.naturalHeight
  if (!naturalW || !naturalH) return {}

  const renderedW = imgRect.width
  const renderedH = imgRect.height

  const { x, y, width, height } = hoveredFace.value.bbox

  // position of the image's top-left inside the wrapper (in px)
  const imgLeftInWrapper = imgRect.left - wrapperRect.left
  const imgTopInWrapper = imgRect.top - wrapperRect.top

  const left = imgLeftInWrapper + (x / naturalW) * renderedW
  const top = imgTopInWrapper + (y / naturalH) * renderedH
  const w = (width / naturalW) * renderedW
  const h = (height / naturalH) * renderedH

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${w}px`,
    height: `${h}px`,
    position: 'absolute'
  }
})

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
    return
  }

  if (!isSwiping.value) return

  deltaX.value = e.clientX - startX.value
  deltaY.value = e.clientY - startY.value
}

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

function openIdolByFace(slug) {
  router.push("/idol/by-face/"+slug)
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
      <button class="icon-btn" @click="$emit('close')" :aria-label="t('common.close')">
        <ArrowLeft :size="35" />
      </button>
      <div class="spacer" />
      <button class="icon-btn" @click="showInfo = !showInfo" :aria-label="t('common.info')">
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
              ref="mainImage"
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

        <!-- 🔴 FACE OVERLAY -->
        <div
          v-if="hoveredFace"
          class="face-box"
          :style="faceBoxStyle"
          aria-hidden="true"
        />

        <!-- Navigation -->
        <button
          class="nav-btn nav-prev"
          @click.stop="$emit('prev')"
          :aria-label="t('common.previous')"
        >
          <ChevronLeft :size="36" />
        </button>

        <!-- Right -->
        <button
          class="nav-btn nav-next"
          @click.stop="$emit('next')"
          :aria-label="t('common.next')"
        >
          <ChevronRight :size="36" />
        </button>
      </div>

      <aside v-if="showInfo" class="info-panel">
        <h3>{{ item.display_name }}</h3>
        <p class="username">@{{ item.username }}</p>

        <div class="meta">
          <div>
            <strong>{{ t('lightbox.platform') }} </strong>
            <span class="capitalize">{{ item.platform }}</span>
          </div>

          <div>
            <strong>{{ t('lightbox.postedAt') }} </strong>
            <span>{{ formatDateTime(item.posted_at) }}</span>
          </div>
        </div>

        <a
          :href="item.post_url"
          target="_blank"
          rel="noopener"
          class="external-link"
        >
          {{ t('lightbox.viewOriginal') }}
        </a>

        <div>
          <p>{{ item.description }}</p>
        </div>
          <h2>{{ t('lightbox.recognizedIdols') }}</h2>
          <div class="Idols-apperances">
            <div
              v-for="(face, index) in item.faces"
              :key="`${face.idol_slug}-${index}`"
              class="idol-face"
              @mouseenter="hoveredFace = face"
              @mouseleave="hoveredFace = null"
            >
              <button @click="openIdolByFace(face.idol_slug)">
                <img
                  :src="`${MEDIA_BASE}${getIdolFaceImageBySlug(face.idol_slug)}`"
                  :alt="t('idols.portraitAlt', { name: getIdolNameBySlug(face.idol_slug) })"
                  width="100"
                  height="100"
                  draggable="false"
                />
              </button>
              <div class="idol-label">
                {{getIdolNameBySlug(face.idol_slug)}}
              </div>
            </div>
          </div>
      </aside>
    </div>

  </div>
</template>