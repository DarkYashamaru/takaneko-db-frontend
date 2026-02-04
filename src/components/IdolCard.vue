<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Idol } from '@/data/idols'
import { MEDIA_BASE } from '@/config/urls'

const props = defineProps<{
  idol: Idol
}>()

const idolImage = `${MEDIA_BASE}${props.idol.image}`

const router = useRouter()

function openIdol() {
  router.push(`/idol/${props.idol.slug}`)
}
</script>

<template>
  <div class="idol-card" @click="openIdol">
    <div class="image-wrapper">
      <img
        v-if="idol.image"
        :src= "idolImage"
        :alt="idol.name"
        loading="lazy"
      />
      <div v-else class="placeholder" />
    </div>

    <div class="info">
      <div class="name">{{ idol.name }}</div>
      <div v-if="idol.name_native" class="native">
        {{ idol.name_native }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.idol-card {
  cursor: pointer;
  background: #111;
  border-radius: 14px;
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.idol-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.35);
}

.image-wrapper {
  aspect-ratio: 3 / 4;
  background: #222;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #222, #333);
}

.info {
  padding: 0.75rem;
}

.name {
  color: #fff;
  font-weight: 600;
}

.native {
  color: #aaa;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}
</style>
