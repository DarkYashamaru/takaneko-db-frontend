<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import Hls from 'hls.js'
import { MEDIA_BASE } from '@/config/urls'
import { t, useI18n } from '@/i18n'
import { track } from '@/services/analytics'

const props = defineProps({
  episodes: { type: Array, required: true },
  mediaDirectory: { type: String, required: true },
  analyticsPrefix: { type: String, required: true },
  analyticsData: { type: Object, default: () => ({}) },
  route: { type: String, required: true },
  watchOriginalLabel: { type: String, required: true },
})

const { locale } = useI18n()
const video = ref(null)
const selectedEpisode = ref(null)
const playbackFailed = ref(false)
const selectedSubtitle = ref(locale.value === 'es-419' ? 'es' : 'en')
let hls
let trackingEpisodeId
let playbackStarted = false
let engagedViewRecorded = false
let completionRecorded = false
let lastPlaybackPosition
let pendingWatchSeconds = 0

const selectedTitle = computed(() => selectedEpisode.value?.title?.[locale.value === 'es-419' ? 'es' : 'en'] ?? '')
const selectedDescription = computed(() => selectedEpisode.value?.description?.[locale.value === 'es-419' ? 'es' : 'en'])
const subtitles = computed(() => selectedEpisode.value ? [
  { language: 'en', label: 'English', src: mediaUrl(selectedEpisode.value.subtitles.en) },
  { language: 'es', label: 'Español', src: mediaUrl(selectedEpisode.value.subtitles.es) },
] : [])

function mediaUrl(path) {
  return `${MEDIA_BASE}/media/${props.mediaDirectory}/${path}`
}

function destroyPlayer() {
  hls?.destroy()
  hls = undefined
}

function trackingData(extra = {}) {
  return { episode_id: trackingEpisodeId, subtitle_language: selectedSubtitle.value, ...props.analyticsData, ...extra }
}

function flushWatchTime() {
  if (!trackingEpisodeId || pendingWatchSeconds <= 0) return
  track(`${props.analyticsPrefix}_watch_time`, trackingData({ watched_seconds: Math.max(1, Math.round(pendingWatchSeconds)) }), props.route)
  pendingWatchSeconds = 0
}

function resetPlaybackTracking(episodeId) {
  flushWatchTime()
  trackingEpisodeId = episodeId
  playbackStarted = false
  engagedViewRecorded = false
  completionRecorded = false
  lastPlaybackPosition = undefined
  pendingWatchSeconds = 0
}

function onVideoPlay() {
  if (!trackingEpisodeId || playbackStarted) return
  playbackStarted = true
  track(`${props.analyticsPrefix}_play_started`, trackingData(), props.route)
}

function onVideoTimeUpdate(event) {
  const element = event.currentTarget
  const currentPosition = element.currentTime
  if (lastPlaybackPosition === undefined) {
    lastPlaybackPosition = currentPosition
    return
  }
  const elapsed = currentPosition - lastPlaybackPosition
  lastPlaybackPosition = currentPosition
  if (elapsed <= 0 || elapsed > 5) return
  pendingWatchSeconds += elapsed
  if (pendingWatchSeconds >= 15) flushWatchTime()
  if (!engagedViewRecorded && element.duration > 0 && currentPosition / element.duration >= 0.25) {
    engagedViewRecorded = true
    track(`${props.analyticsPrefix}_engaged_view`, trackingData(), props.route)
  }
}

function onVideoSeeking(event) { lastPlaybackPosition = event.currentTarget.currentTime }
function onVideoPause() { flushWatchTime() }
function onVideoEnded() {
  flushWatchTime()
  if (!trackingEpisodeId || completionRecorded) return
  completionRecorded = true
  track(`${props.analyticsPrefix}_completed`, trackingData(), props.route)
}

function applySelectedSubtitle() {
  for (const trackItem of video.value?.textTracks ?? []) trackItem.mode = trackItem.language === selectedSubtitle.value ? 'showing' : 'disabled'
}

function selectSubtitle(language) {
  flushWatchTime()
  selectedSubtitle.value = language
  applySelectedSubtitle()
}

function initializePlayer() {
  const element = video.value
  if (!element || !selectedEpisode.value) return
  playbackFailed.value = false
  const streamUrl = mediaUrl(selectedEpisode.value.stream)
  if (element.canPlayType('application/vnd.apple.mpegurl')) element.src = streamUrl
  else if (Hls.isSupported()) {
    hls = new Hls()
    hls.on(Hls.Events.ERROR, (_, data) => {
      if (!data.fatal) return
      playbackFailed.value = true
      destroyPlayer()
    })
    hls.loadSource(streamUrl)
    hls.attachMedia(element)
  } else playbackFailed.value = true
  applySelectedSubtitle()
}

function chooseEpisode(episode) {
  if (selectedEpisode.value?.id !== episode.id) selectedEpisode.value = episode
}

function formatDate(value) {
  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`))
}

watch(selectedEpisode, async (episode) => {
  if (!episode) return
  resetPlaybackTracking(episode.id)
  selectedSubtitle.value = locale.value === 'es-419' ? 'es' : 'en'
  destroyPlayer()
  await nextTick()
  initializePlayer()
})
watch(locale, () => selectSubtitle(locale.value === 'es-419' ? 'es' : 'en'))
watch(() => props.episodes, (episodes) => { selectedEpisode.value = episodes[0] ?? null }, { immediate: true })

window.addEventListener('pagehide', flushWatchTime)
onBeforeUnmount(() => {
  window.removeEventListener('pagehide', flushWatchTime)
  flushWatchTime()
  destroyPlayer()
})
</script>

<template>
  <section v-if="selectedEpisode" class="player-section" :aria-labelledby="'episode-' + selectedEpisode.id">
    <div class="video-wrap">
      <video ref="video" :key="selectedEpisode.id" controls controlslist="nodownload noremoteplayback" playsinline preload="metadata" :poster="mediaUrl(selectedEpisode.poster)" @play="onVideoPlay" @timeupdate="onVideoTimeUpdate" @seeking="onVideoSeeking" @pause="onVideoPause" @ended="onVideoEnded" @error="playbackFailed = true">
        <track v-for="trackItem in subtitles" :key="trackItem.language" kind="subtitles" :srclang="trackItem.language" :label="trackItem.label" :src="trackItem.src" @load="applySelectedSubtitle">
      </video>
    </div>
    <fieldset class="caption-picker">
      <legend>{{ t('takanekoTv.captions') }}</legend>
      <button v-for="trackItem in subtitles" :key="trackItem.language" type="button" :class="{ active: selectedSubtitle === trackItem.language }" :aria-pressed="selectedSubtitle === trackItem.language" @click="selectSubtitle(trackItem.language)">{{ trackItem.language === 'en' ? t('takanekoTv.english') : t('takanekoTv.spanish') }}</button>
    </fieldset>
    <p v-if="playbackFailed" class="error" role="alert">{{ t('takanekoTv.playbackFailed') }}</p>
    <div class="episode-copy">
      <p class="date">{{ formatDate(selectedEpisode.published_at) }}</p>
      <h2 :id="'episode-' + selectedEpisode.id">{{ selectedTitle }}</h2>
      <p v-if="selectedDescription">{{ selectedDescription }}</p>
      <a class="official-link" :href="selectedEpisode.original_url" target="_blank" rel="noopener noreferrer">{{ watchOriginalLabel }} <span aria-hidden="true">↗</span></a>
    </div>
  </section>
  <section v-if="episodes.length" class="episodes" :aria-label="t('takanekoTv.episodes')">
    <h2>{{ t('takanekoTv.episodes') }}</h2>
    <div class="episode-grid">
      <button v-for="episode in episodes" :key="episode.id" class="episode-card" :class="{ selected: episode.id === selectedEpisode?.id }" :aria-pressed="episode.id === selectedEpisode?.id" @click="chooseEpisode(episode)">
        <img :src="mediaUrl(episode.poster)" :alt="episode.title[locale === 'es-419' ? 'es' : 'en']">
        <span class="episode-card-copy"><strong>{{ episode.title[locale === 'es-419' ? 'es' : 'en'] }}</strong><small>{{ formatDate(episode.published_at) }}</small></span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.player-section, .episodes { width: min(100%, 1080px); margin-inline: auto; }
.player-section { margin-top: 2rem; }
.video-wrap { background: #000; }
video { display: block; width: 100%; aspect-ratio: 16 / 9; background: #000; }
.caption-picker { display: flex; gap: .5rem; align-items: center; margin: .8rem 0 0; padding: 0; border: 0; }
.caption-picker legend { padding: 0 .4rem 0 0; color: #d1d1d1; }
.caption-picker button { border: 1px solid #777; border-radius: .3rem; padding: .4rem .7rem; background: #1b1b1b; color: #fff; cursor: pointer; }
.caption-picker button.active { border-color: #ee8ca9; background: #5d2032; }
.episode-copy { padding: 1rem 0 .5rem; }
.episode-copy h2 { margin: .25rem 0 .55rem; font-size: clamp(1.35rem, 3vw, 2rem); }
.episode-copy p { margin: 0 0 .8rem; color: #d1d1d1; line-height: 1.55; }
.date { color: #ee8ca9 !important; font-size: .9rem; font-weight: 600; }
.official-link { display: inline-block; padding: .7rem 1rem; border-radius: .4rem; background: #e62117; color: #fff; font-weight: 700; text-decoration: none; }
.official-link:hover, .official-link:focus-visible { background: #ff3a31; }
.episodes { margin-top: 2.5rem; }
.episodes > h2 { margin-bottom: 1rem; }
.episode-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
.episode-card { padding: 0; overflow: hidden; border: 1px solid #444; border-radius: .45rem; background: #171717; color: inherit; text-align: left; cursor: pointer; }
.episode-card.selected, .episode-card:focus-visible { border-color: #ee8ca9; outline: 2px solid #ee8ca9; outline-offset: 2px; }
.episode-card img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; background: #000; }
.episode-card-copy { display: grid; gap: .45rem; padding: .75rem; }
.episode-card-copy strong { line-height: 1.3; }
.episode-card-copy small { color: #bfbfbf; }
.error { color: #ffb5b5; }
</style>
