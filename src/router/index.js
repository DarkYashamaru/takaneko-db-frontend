import { createRouter, createWebHistory } from 'vue-router'
import Landing from '@/views/Landing.vue'
import IdolTimeline from '@/views/IdolTimeline.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'landing', component: Landing },
    { path: '/idol/:slug', component: () => import('@/views/Idol.vue') },
    { path: '/idol/by-face/:slug', component: () => import('@/views/IdolByFace.vue') },
    { path: '/search/', component: () => import('@/views/SearchResults.vue') },
    { path: '/takaneko-tv', name: 'takaneko-tv', component: () => import('@/views/TakanekoTv.vue') },
    { path: '/takaneko-showrooms', name: 'takaneko-showrooms', component: () => import('@/views/TakanekoShowrooms.vue') },
    { path: '/takaneko-showrooms/:slug', name: 'takaneko-showroom', component: () => import('@/views/TakanekoShowroom.vue') },
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound.vue')},
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
