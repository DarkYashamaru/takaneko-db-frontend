<script setup>
defineProps({
  item: Object
})
const emit = defineEmits(['open'])
</script>

<template>
  <div class="timeline-item" tabindex="0" @click="emit('open', item)">
    <img
      :src="item.thumbnail"
      loading="lazy"
      draggable="false"
    />
    <span v-if="item.type === 'video'" class="play-badge">▶</span>
  </div>
</template>

<style scoped>
.timeline-item {
  width: 200px;
  height: 200px;
  background: #111;
  overflow: hidden;
  border-radius: 6px;

  transform: translateZ(0);
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    filter 120ms ease;

  cursor: pointer;
}

.timeline-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;

  transform: scale(1);
  transition: transform 120ms ease;
}

/* Hover & keyboard focus */
.timeline-item:hover,
.timeline-item:focus-visible {
  z-index: 2;
  transform: scale(1.04);
  box-shadow:
    0 6px 18px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}

.timeline-item:hover img,
.timeline-item:focus-visible img {
  transform: scale(1.08);
  filter: brightness(1.05);
}

.timeline-item {
  will-change: transform;
}

</style>
