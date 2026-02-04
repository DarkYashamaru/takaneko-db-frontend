import { createRouter, createWebHistory } from 'vue-router'
import Landing from '@/views/Landing.vue'
import IdolTimeline from '@/views/IdolTimeline.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'landing', component: Landing },
    { path: '/search', component: () => import('@/views/Search.vue') },
    { path: '/idol/:slug', component: () => import('@/views/Idol.vue') },
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound.vue')}
  ],

  scrollBehavior(to, from, savedPosition) {
    // Browser back / forward
    if (savedPosition) {
      return savedPosition
    }

    // SAME route, only query changed (lightbox open/close)
    if (to.path === from.path) {
      return false
    }

    // Different page → reset scroll
    return { top: 0 }
  }
})
