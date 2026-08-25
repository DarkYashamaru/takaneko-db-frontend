import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { locale } from './i18n'
import '@vuepic/vue-datepicker/dist/main.css'

document.documentElement.lang = locale.value

createApp(App)
  .use(router)
  .mount('#app')
