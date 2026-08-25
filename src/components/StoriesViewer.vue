<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { ArrowLeft, Info, ChevronRight, ChevronLeft } from 'lucide-vue-next'
import '@/composables/lightbox.css'
import { t } from '@/i18n'

const props = defineProps({
  items: Array,
  label: String
})

const emit = defineEmits(['close'])

const index = ref(0)
const videoEl = ref(null)

function onKey(e) {
  if (e.key === 'Escape')
  {
    emit('close')
  }
  else if (e.key === 'ArrowLeft')
  {
    prev()
  }
  else if (e.key === 'ArrowRight')
  {
    next()   
  }
}

function next() {
  if (index.value < props.items.length - 1) {
    index.value++
  } else {
    emit('close')
  }
}

function prev() {
  if (index.value > 0) index.value--
}

watch(index, () => {
  cancelAnimationFrame(animationFrame)

  if (videoEl.value) {
    videoEl.value.pause()
    videoEl.value.currentTime = 0
  }

  startProgress()
})


const progress = ref(0) // 0 → 100
let animationFrame = null
let startTime = null
let durationMs = 4000

function startProgress() {
  cancelAnimationFrame(animationFrame)
  progress.value = 0

  const item = props.items[index.value]
  if (!item) return

  // IMAGE
  if (item.type === 'image') {
    durationMs = 4000
    startTime = null
    animationFrame = requestAnimationFrame(animate)
  }

  // VIDEO
  if (item.type === 'video') {
    // wait for metadata event instead
  }
}


function animate(timestamp) {
  if (!startTime) startTime = timestamp

  const elapsed = timestamp - startTime
  const percent = Math.min((elapsed / durationMs) * 100, 100)

  progress.value = percent

  if (percent < 100) {
    animationFrame = requestAnimationFrame(animate)
  } else {
    next()
  }
}

function onVideoLoaded() {
  if (!videoEl.value) return
  progress.value = 0
}

function onVideoTimeUpdate() {
  const video = videoEl.value
  if (!video || !video.duration) return

  progress.value = (video.currentTime / video.duration) * 100
}

function resetProgress() {
  cancelAnimationFrame(animationFrame)
  progress.value = 0
}

function getBarStyle(i) {
  if (i < index.value) {
    return { width: '100%' }
  }

  if (i === index.value) {
    return { width: progress.value + '%' }
  }

  return { width: '0%' }
}

onMounted(() => {
  document.body.style.overflow = 'hidden'
  startProgress()
  window.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  document.body.style.overflow = ''
  cancelAnimationFrame(animationFrame)
  window.removeEventListener('keydown', onKey)
})

</script>

<template>
  <div class="stories-root">
    <div class="top-bar">
      <button class="icon-btn" @click="$emit('close')" :aria-label="t('common.close')">
        <ArrowLeft />
      </button>
      <div class="year-title">{{ label }}</div>
    </div>

    <!-- Progress Bars -->
    <div class="progress">
    <div
        v-for="(item, i) in items"
        :key="i"
        class="bar"
    >
        <div
        class="bar-fill"
        :style="getBarStyle(i)"
        />
    </div>
    </div>

    <div class="media-area">
        <img
        v-if="items[index].type === 'image'"
        :src="items[index].src"
        />

        <video
        v-else
        ref="videoEl"
        :src="items[index].src"
        autoplay
        playsinline
        @loadedmetadata="onVideoLoaded"
        @timeupdate="onVideoTimeUpdate"
        @ended="next"
        />

        <button
          class="nav-btn nav-prev"
          @click="prev"
          :aria-label="t('common.previous')"
        >
          <ChevronLeft :size="36" />
        </button>

        <!-- Right -->
        <button
          class="nav-btn nav-next"
          @click="next"
          :aria-label="t('common.next')"
        >
          <ChevronRight :size="36" />
        </button>

    </div>
  </div>
</template>

<style>
.stories-root {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 2000;

  display: flex;
  flex-direction: column;
}

.top-bar {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  color: #fff;
  z-index: 5;
}

.media-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin: 20px 20px 20px 20px;
}

.media-area img,
.media-area video {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Progress bars */
.progress {
  display: flex;
  gap: 4px;
  padding: 8px 12px 0 12px;
}

.bar {
  flex: 1;
  height: 3px;
  background: rgba(255,255,255,0.3);
  border-radius: 999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  width: 0%;
  background: #fff;
  transition: width 0.05s linear;
}

.bar.active {
  background: #fff;
}

.year-title 
{
  font-size: 16px;
  font-weight: bold;
  margin-left: 20px;
}
</style>
