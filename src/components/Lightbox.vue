<script setup>
function trackSource() { track("source_link_open", { platform: props.item?.platform || "" }) }
import { ArrowLeft, Info, ChevronRight, ChevronLeft } from 'lucide-vue-next'
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { getIdolFaceImageBySlug, getIdolNameBySlug } from '@/data/idols'
import { API_BASE, MEDIA_BASE } from '@/config/urls'
import { track } from '@/services/analytics'
import { useRouter } from 'vue-router'
import '@/composables/lightbox.css'
import { t, formatDateTime } from '@/i18n'
import { clearAdminSession, isAdmin, refreshAdminSession } from '@/services/adminAuth'

const router = useRouter()

const props = defineProps({
  src: String,
  item: Object
})

const adminProfiles = ref([])
const selectedProfile = ref('')
const manualRating = ref(null)
const manualLabelLoading = ref(false)
const manualLabelSaving = ref(false)
const manualLabelStatus = ref('')
const manualLabelVisible = computed(() => isAdmin.value && props.item?.type === 'image' && Number.isInteger(props.item?.media_id))
let manualRatingRequest = 0

function manualLabelEndpoint(path = '') {
  return `${API_BASE}/preference/profiles/${encodeURIComponent(selectedProfile.value)}/labels/${props.item.media_id}${path}`
}

async function adminResponse(response) {
  const payload = await response.json().catch(() => ({}))
  if (response.status === 401) clearAdminSession()
  if (!response.ok) throw new Error(payload.detail || `Request failed (${response.status})`)
  return payload
}

async function loadManualRating() {
  const request = ++manualRatingRequest
  manualRating.value = null
  if (!manualLabelVisible.value || !selectedProfile.value) return
  manualLabelLoading.value = true
  manualLabelStatus.value = ''
  try {
    const payload = await adminResponse(await fetch(manualLabelEndpoint(), { credentials: 'same-origin' }))
    if (request !== manualRatingRequest) return
    manualRating.value = payload.rating
  } catch (error) {
    if (request !== manualRatingRequest) return
    manualLabelStatus.value = error.message
  } finally {
    if (request === manualRatingRequest) manualLabelLoading.value = false
  }
}

async function loadManualProfiles() {
  if (!await refreshAdminSession()) return
  manualLabelLoading.value = true
  try {
    const payload = await adminResponse(await fetch(`${API_BASE}/preference/profiles`, { credentials: 'same-origin' }))
    adminProfiles.value = payload.items
    if (!adminProfiles.value.some((profile) => profile.slug === selectedProfile.value)) {
      selectedProfile.value = adminProfiles.value[0]?.slug || ''
    }
    await loadManualRating()
  } catch (error) {
    manualLabelStatus.value = error.message
  } finally {
    manualLabelLoading.value = false
  }
}

async function saveManualRating(rating) {
  if (!manualLabelVisible.value || manualLabelSaving.value) return
  manualLabelSaving.value = true
  manualLabelStatus.value = ''
  try {
    await adminResponse(await fetch(manualLabelEndpoint(), {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    }))
    manualRating.value = rating
    manualLabelStatus.value = `Saved ${rating}/10. Train this profile when you are ready.`
  } catch (error) {
    manualLabelStatus.value = error.message
  } finally {
    manualLabelSaving.value = false
  }
}

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
  loadManualProfiles()
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

function findSimilarImages() {
  if (props.item?.type !== 'image' || !Number.isInteger(props.item?.media_id)) return
  router.push({ path: '/search', query: { similarity: String(props.item.media_id) } })
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
  () => [props.item?.media_id, selectedProfile.value],
  () => { loadManualRating() }
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
          @click="trackSource"
          :href="item.post_url"
          target="_blank"
          rel="noopener"
          class="external-link"
        >
          {{ t('lightbox.viewOriginal') }}
        </a>

        <button v-if="item.type === 'image' && Number.isInteger(item.media_id)" type="button" class="similar-images" @click="findSimilarImages">
          {{ t('lightbox.findSimilar') }}
        </button>

        <div>
          <p>{{ item.description }}</p>
        </div>

        <section v-if="manualLabelVisible" class="preference-training" aria-label="Preference training">
          <h2>Preference training</h2>
          <label>
            Profile
            <select v-model="selectedProfile" :disabled="manualLabelLoading || manualLabelSaving || !adminProfiles.length">
              <option v-for="profile in adminProfiles" :key="profile.id" :value="profile.slug">{{ profile.display_name }}</option>
            </select>
          </label>
          <p v-if="manualLabelLoading">Loading score…</p>
          <div v-else class="preference-ratings" aria-label="Rate this image from zero to ten">
            <button v-for="score in 11" :key="score - 1" type="button"
              :class="{ selected: manualRating === score - 1 }"
              :disabled="manualLabelSaving || !selectedProfile"
              @click="saveManualRating(score - 1)">{{ score - 1 }}</button>
          </div>
          <p v-if="manualLabelStatus" class="preference-status" role="status">{{ manualLabelStatus }}</p>
        </section>

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

<style scoped>
.preference-training { margin:1.25rem 0; padding:1rem 0; border-top:1px solid var(--iw-border); border-bottom:1px solid var(--iw-border); }
.similar-images { width:100%; margin:.75rem 0 0; min-height:2.5rem; border:1px solid var(--iw-accent-soft); border-radius:var(--iw-radius-sm); background:var(--iw-surface-selected); color:var(--iw-text); cursor:pointer; font:inherit; font-weight:700; }.similar-images:hover { border-color:var(--iw-accent); color:var(--iw-accent); }
.preference-training h2 { margin:0 0 .75rem; }.preference-training label { display:grid; gap:.35rem; color:var(--iw-text-muted); font-size:.9rem; }.preference-training select { min-height:2.35rem; border:1px solid var(--iw-control-border); border-radius:var(--iw-radius-sm); padding:.35rem .5rem; background:var(--iw-surface-selected); color:var(--iw-text); font:inherit; }
.preference-ratings { display:flex; flex-wrap:wrap; gap:.35rem; margin-top:.85rem; }.preference-ratings button { min-width:2.25rem; min-height:2.25rem; border:1px solid var(--iw-accent-soft); border-radius:var(--iw-radius-sm); background:var(--iw-surface-selected); color:var(--iw-text); cursor:pointer; font:inherit; }.preference-ratings button.selected { border-color:var(--iw-accent); background:var(--iw-accent); color:var(--iw-on-accent); font-weight:700; }.preference-ratings button:disabled { opacity:.55; cursor:not-allowed; }.preference-status { margin:.75rem 0 0; color:var(--iw-text-muted); font-size:.9rem; line-height:1.4; }
</style>
