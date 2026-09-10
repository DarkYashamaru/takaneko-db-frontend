import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { routeCategory, track } from './services/analytics'
import { locale } from './i18n'
import '@vuepic/vue-datepicker/dist/main.css'

document.documentElement.lang = locale.value

router.afterEach((to) => {
  const page = routeCategory(to.path)
  track("page_view", { page, ...(to.params.slug ? { idol: String(to.params.slug), filter: page === "idol_face" ? "face" : "posted" } : {}) }, to.path)
  if (to.params.slug && page !== "idol_face") track("idol_page_open", { idol: String(to.params.slug), filter: "posted" }, to.path)
})

createApp(App)
  .use(router)
  .mount('#app')
