<script setup>
import { useRoute, useRouter } from 'vue-router'
import { onMounted, watch } from 'vue'
import TimelineView from '@/components/timeline/TimelineView.vue'

const route = useRoute()
const router = useRouter()
const emit = defineEmits(['error', 'open', 'close', 'back'])

onMounted(() => {
  window.scrollTo({ top: 0 })
})

watch(
  () => route.params.slug,
  () => {
    window.scrollTo({ top: 0 })
  }
)

const apiQuery = {
  type: 'idol',
  slug: route.params.slug,
}

function onOpen(item) {
  router.replace({
    query: {
      ...route.query,
      photo: item.id
    }
  })
}

function onClose() {
  const { photo, ...rest } = route.query
  router.replace({ query: rest })
}

function onError(err) {
  if (err?.status === 404) {
    router.replace({ name: 'NotFound' })
  }
}


</script>

<template>
  <TimelineView
    :apiQuery="apiQuery"
    @open="onOpen"
    @close="onClose"
    @error="onError"
    @back="() => { router.replace({ name: 'landing' })}"
  />
</template>