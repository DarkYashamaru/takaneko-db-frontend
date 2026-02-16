<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'

const props = defineProps({
  items: Array,
  label: String
})

const emit = defineEmits(['close'])

const index = ref(0)

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
  resetProgress()
  startProgress()
})

const progress = ref(0) // 0 → 100
let animationFrame = null
let startTime = null
let durationMs = 4000

function startProgress() {
  cancelAnimationFrame(animationFrame)

  const item = props.items[index.value]

  if (!item) return

  // Image duration
  if (item.type === 'image') {
    durationMs = 4000
  }

  // Video duration
  if (item.type === 'video') {
    durationMs = 4000 // temporary fallback
  }

  progress.value = 0
  startTime = null

  animationFrame = requestAnimationFrame(animate)
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
})

onUnmounted(() => {
  document.body.style.overflow = ''
  cancelAnimationFrame(animationFrame)
})

</script>

<template>
  <div class="stories-root">
    <div class="top-bar">
      <button @click="$emit('close')">
        <ArrowLeft />
      </button>
      <div>{{ label }}</div>
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

    <div class="media-area" @click="next">
      <img
        v-if="items[index].type === 'image'"
        :src="items[index].src"
      />

      <video
        v-else
        :src="items[index].src"
        autoplay
        @ended="next"
      />
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

</style>
