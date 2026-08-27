<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Hls from 'hls.js'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { MEDIA_BASE } from '@/config/urls'
import { t } from '@/i18n'

const imageNames = [
  '2092261785210597553_4.jpg', '2092261785210597553_2.jpg',
  '2092254454489948205_3.jpg', '2092254454489948205_2.jpg', '2092254454489948205_1.jpg',
  '2092244086992572476_4.jpg', '2092244086992572476_2.jpg', '2092244086992572476_1.jpg',
  '2092243458178306389_2.jpg', '2092243458178306389_1.jpg',
  '2092239581639069961_1.jpg', '2092239581639069961_2.jpg',
  '2092237050158494008_3.jpg', '2092237050158494008_2.jpg', '2092237050158494008_1.jpg',
  '2092236457947869294_3.jpg', '2092236457947869294_2.jpg',
  '2092235824431833323_4.jpg', '2092235824431833323_3.jpg',
  '2092234156973703520_3.jpg', '2092234156973703520_2.jpg', '2092234156973703520_1.jpg',
  '2092233691905093853_2.jpg', '2092233691905093853_1.jpg',
  '2092236552990835049_2.jpg', '2092236552990835049_1.jpg',
  '2092084721136341346_1.jpg', '2092083505304080484_1.jpg',
  '2092069479174008837_2.jpg', '2092069479174008837_1.jpg',
  '2092063972589711782_1.jpg', '2092060063234183351_2.jpg', '2092060063234183351_1.jpg',
  '2092048067893834238_2.jpg', '2092048067893834238_1.jpg',
  '2091899845598679279_1.jpg', '2091895723612856363_2.jpg', '2091895723612856363_1.jpg',
  '2091894196101865715_1.jpg', '2091890556029046964_1.jpg'
]

const currentIndex = ref(0)
const isPaused = ref(false)
const concertVideo = ref(null)
const concertUnavailable = ref(false)
let intervalId
let hls

const currentImage = computed(() => `${MEDIA_BASE}/media/we-love-you-mikurun/${imageNames[currentIndex.value]}`)
const concertUrl = `${MEDIA_BASE}/media/we-love-you-mikurun/final-concert/master.m3u8`
const concertPoster = `${MEDIA_BASE}/media/we-love-you-mikurun/${imageNames[0]}`

function next() {
  currentIndex.value = (currentIndex.value + 1) % imageNames.length
  restartAutoplay()
}

function previous() {
  currentIndex.value = (currentIndex.value - 1 + imageNames.length) % imageNames.length
  restartAutoplay()
}

function startAutoplay() {
  if (isPaused.value || intervalId) return
  intervalId = window.setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % imageNames.length
  }, 5000)
}

function stopAutoplay() {
  window.clearInterval(intervalId)
  intervalId = undefined
}

function restartAutoplay() {
  stopAutoplay()
  startAutoplay()
}

function pause() {
  isPaused.value = true
  stopAutoplay()
}

function resume() {
  isPaused.value = false
  startAutoplay()
}

function onKeydown(event) {
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    previous()
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    next()
  }
}

function initializeConcertPlayer() {
  const video = concertVideo.value
  if (!video) return

  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = concertUrl
    return
  }

  if (!Hls.isSupported()) {
    concertUnavailable.value = true
    return
  }

  hls = new Hls()
  hls.on(Hls.Events.ERROR, (_, data) => {
    if (!data.fatal) return
    concertUnavailable.value = true
    hls.destroy()
    hls = undefined
  })
  hls.loadSource(concertUrl)
  hls.attachMedia(video)
}

function markConcertUnavailable() {
  concertUnavailable.value = true
}

onMounted(() => {
  startAutoplay()
  initializeConcertPlayer()
})

onBeforeUnmount(() => {
  stopAutoplay()
  hls?.destroy()
})
</script>

<template>
  <section
    class="mikurun-tribute"
    tabindex="0"
    @mouseenter="pause"
    @mouseleave="resume"
    @focusin="pause"
    @focusout="resume"
    @keydown="onKeydown"
  >
    <h2>{{ t('mikurun.title') }}</h2>

    <div class="carousel">
      <button class="arrow previous" :aria-label="t('common.previous')" @click="previous">
        <ChevronLeft :size="34" />
      </button>

      <img :key="currentImage" :src="currentImage" :alt="t('mikurun.imageAlt', { index: currentIndex + 1 })" />

      <button class="arrow next" :aria-label="t('common.next')" @click="next">
        <ChevronRight :size="34" />
      </button>
    </div>

    <p class="counter" aria-live="polite">{{ currentIndex + 1 }} / {{ imageNames.length }}</p>

    <div class="concert-player">
      <h3>{{ t('mikurun.concertTitle') }}</h3>
      <video
        ref="concertVideo"
        class="concert-video"
        controls
        playsinline
        preload="metadata"
        :poster="concertPoster"
        :aria-describedby="concertUnavailable ? 'concert-unavailable' : undefined"
        @error="markConcertUnavailable"
      />
      <p v-if="concertUnavailable" id="concert-unavailable" class="concert-unavailable" role="alert">
        {{ t('mikurun.concertUnavailable') }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.mikurun-tribute { padding: 2rem 1rem 1.5rem; background: linear-gradient(180deg, #120b14, #000); color: #fff; text-align: center; outline: none; }
.mikurun-tribute:focus-visible { box-shadow: inset 0 0 0 2px #fff; }
h2 { margin: 0 0 1rem; font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 600; }
.carousel { position: relative; display: flex; align-items: center; justify-content: center; max-width: 980px; height: min(68vw, 680px); min-height: 300px; margin: 0 auto; background: #080808; overflow: hidden; }
.carousel img { width: 100%; height: 100%; object-fit: contain; animation: fade-in 260ms ease-out; }
.arrow { position: absolute; z-index: 1; top: 50%; display: grid; place-items: center; width: 48px; height: 48px; border: 0; border-radius: 50%; background: rgba(0, 0, 0, .62); color: #fff; cursor: pointer; transform: translateY(-50%); }
.arrow:hover, .arrow:focus-visible { background: rgba(255, 255, 255, .22); }
.previous { left: .75rem; }
.next { right: .75rem; }
.counter { margin: .7rem 0 0; color: #c9c9c9; font-variant-numeric: tabular-nums; }
.concert-player { width: min(100%, 980px); margin: 2rem auto 0; }
.concert-player h3 { margin: 0 0 1rem; font-size: clamp(1.25rem, 3vw, 1.75rem); font-weight: 600; }
.concert-video { display: block; width: 100%; aspect-ratio: 16 / 9; background: #080808; }
.concert-unavailable { margin: .8rem 0 0; color: #f5b9b9; }
@keyframes fade-in { from { opacity: .25; } to { opacity: 1; } }
@media (max-width: 600px) { .carousel { height: 78vw; min-height: 240px; } .arrow { width: 42px; height: 42px; } .previous { left: .4rem; } .next { right: .4rem; } }
</style>
