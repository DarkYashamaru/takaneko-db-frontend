<template>
  <main class="memories-root">
    <h1 class="title">On this day</h1>

    <div class="years-grid">
      <div
        v-for="group in groups"
        :key="group.year"
        class="year-card"
        @click="openYear(group)"
      >
        <img :src="group.items[0].thumbnailFull" />
        <div class="overlay">
          <span>{{ group.label }}</span>
        </div>
      </div>
    </div>

    <StoriesViewer
      v-if="activeGroup"
      :items="activeGroup.items"
      :label="activeGroup.label"
      @close="activeGroup = null"
    />
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiGet } from '@/services/api'
import { MEDIA_BASE } from '@/config/urls'
import StoriesViewer from '@/components/StoriesViewer.vue'

const groups = ref([])
const activeGroup = ref(null)

async function load() {
  const res = await apiGet('/memories')
  groups.value = res.items.map(g => ({
    ...g,
    items: g.items.map(i => ({
      ...i,
      thumbnailFull: `${MEDIA_BASE}${i.thumbnail}`,
      src: `${MEDIA_BASE}${i.src}`
    }))
  }))
}

function openYear(group) {
  activeGroup.value = group
}

onMounted(load)
</script>


<style>
.memories-root {
  padding: 2rem 1rem;
  background: #000;
  color: #fff;
}

.title {
  font-size: 1.6rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

/* Horizontal scroll carousel */
.years-grid {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 0.5rem;

  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

/* Hide scrollbar (optional) */
.years-grid::-webkit-scrollbar {
  display: none;
}

.year-card {
  flex: 0 0 auto;
  width: 180px;
  height: 240px;

  border-radius: 14px;
  overflow: hidden;
  position: relative;
  cursor: pointer;

  background: #111;
  transition: transform 0.2s ease;
  scroll-snap-align: start;
}

.year-card:hover {
  transform: scale(1.04);
}

.year-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0,0,0,0.75),
    rgba(0,0,0,0.1)
  );

  display: flex;
  align-items: flex-end;
  padding: 1rem;
  font-weight: 600;
}

</style>