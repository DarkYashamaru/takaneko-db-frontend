<script setup lang="ts">
import IdolCard from './IdolCard.vue'
import { idols } from '@/data/idols'
</script>

<template>
  <section class="idol-grid">
    <h2 class="section-title">Idols</h2>

    <div class="grid">
      <IdolCard
        v-for="idol in idols"
        :key="idol.slug"
        :idol="idol"
      />
    </div>
  </section>
</template>

<style scoped>
.idol-grid {
  padding: 2rem 1rem;
}

.section-title {
  color: #fff;
  font-size: 1.4rem;
  margin-bottom: 1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, 160px);
  gap: 1rem;
  justify-content: center;
}
</style>
