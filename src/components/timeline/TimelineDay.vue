<script setup>
import TimelineItem from './TimelineItem.vue'

defineProps({
  group: Object
})

defineEmits(['open'])
</script>

<template>
  <section class="timeline-day">
    <div class="day-label">
      {{ group.label }}
    </div>

    <div class="grid">
      <TimelineItem
        v-for="item in group.items"
        :key="item.id"
        :item="item"
        @open="$emit('open', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.timeline-day {
  margin-bottom: 2rem;
}

/* Immich-like sticky date */
.day-label {
  position: sticky;
  top: 0;
  z-index: 10;

  background: #000;
  color: #aaa;
  font-size: 0.9rem;
  padding: 0.5rem 0;
}

/* Square grid */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 200px);
  gap: 6px;
}
</style>
