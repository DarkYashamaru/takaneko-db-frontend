<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Idol } from '@/data/idols'
import { MEDIA_BASE } from '@/config/urls'
import { t } from '@/i18n'

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
        :alt="t('idols.portraitAlt', { name: idol.name })"
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
  background: var(--iw-bg-elevated);
  border-radius: 14px;
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.idol-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--iw-shadow-md);
}

.image-wrapper {
  aspect-ratio: 3 / 4;
  background: var(--iw-surface-hover);
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--iw-surface-hover), var(--iw-border));
}

.info {
  padding: 0.75rem;
}

.name {
  color: var(--iw-text-strong);
  font-weight: 600;
}

.native {
  color: var(--iw-text-muted);
  font-size: 0.85rem;
  margin-top: 0.25rem;
}
</style>
