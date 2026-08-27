import { ref } from 'vue'

export const supportedLocales = ['en', 'es-419']
export const locale = ref(resolveInitialLocale())

const messages = {
  en: {
    common: { language: 'Language', back: 'Back', close: 'Close', previous: 'Previous', next: 'Next', info: 'Info' },
    hero: { subtitle: 'Unofficial historical archive of Takane no Nadeshiko', imageAlt: 'Takane no Nadeshiko' },
    idols: { title: 'Idols', portraitAlt: '{name} portrait' },
    search: { title: 'Advanced Search', context: 'Context', contextPlaceholder: 'e.g. beach, live performance, white dress...', dateRange: 'Date range', startDate: 'Start date', endDate: 'End date', postedBy: 'Posted by', anyone: 'Anyone', faces: 'Faces', platform: 'Platform', allPlatforms: 'All', submit: 'Search' },
    timeline: { loading: 'Loading timeline…', loadingMore: 'Loading more…', end: 'End of timeline', today: 'Today' },
    memories: { title: 'On this day', yearsAgo: ({ count }) => count === 1 ? '1 year ago' : `${count} years ago` },
    lightbox: { platform: 'Platform:', postedAt: 'Posted at:', viewOriginal: 'View original post', recognizedIdols: 'Idols' },
    development: { title: '🚧 Under development' },
    mikurun: { title: 'WE LOVE YOU MIKURUN! 🌹❤️', imageAlt: 'Mikurun tribute image {index}', concertTitle: "Mikuru's Final Concert", concertUnavailable: 'The concert is temporarily unavailable.' },
    errors: { notFound: 'Page not found', goHome: '← Go back home', requestFailed: 'Unable to load media.' }
  },
  'es-419': {
    common: { language: 'Idioma', back: 'Volver', close: 'Cerrar', previous: 'Anterior', next: 'Siguiente', info: 'Información' },
    hero: { subtitle: 'Archivo histórico no oficial de Takane no Nadeshiko', imageAlt: 'Takane no Nadeshiko' },
    idols: { title: 'Ídolos', portraitAlt: 'Retrato de {name}' },
    search: { title: 'Búsqueda avanzada', context: 'Contexto', contextPlaceholder: 'p. ej., playa, presentación en vivo, vestido blanco…', dateRange: 'Rango de fechas', startDate: 'Fecha de inicio', endDate: 'Fecha de finalización', postedBy: 'Publicado por', anyone: 'Cualquiera', faces: 'Rostros', platform: 'Plataforma', allPlatforms: 'Todas', submit: 'Buscar' },
    timeline: { loading: 'Cargando cronología…', loadingMore: 'Cargando más…', end: 'Fin de la cronología', today: 'Hoy' },
    memories: { title: 'Memorias', yearsAgo: ({ count }) => count === 1 ? 'Hace 1 año' : `Hace ${count} años` },
    lightbox: { platform: 'Plataforma:', postedAt: 'Publicado:', viewOriginal: 'Ver publicación original', recognizedIdols: 'Ídolos' },
    development: { title: '🚧 En desarrollo' },
    mikurun: { title: 'TE AMAMOS MIKURUN! 🌹❤️', imageAlt: 'Imagen de homenaje a Mikurun {index}', concertTitle: 'Último concierto de Mikuru', concertUnavailable: 'El concierto no está disponible temporalmente.' },
    errors: { notFound: 'Página no encontrada', goHome: '← Volver al inicio', requestFailed: 'No se pudo cargar el contenido.' }
  }
}

function resolveInitialLocale() {
  const saved = window.localStorage.getItem('takaneko-locale')
  if (supportedLocales.includes(saved)) return saved
  return navigator.languages?.some(language => language.toLowerCase().startsWith('es')) || navigator.language?.toLowerCase().startsWith('es') ? 'es-419' : 'en'
}

function messageAt(key) {
  return key.split('.').reduce((value, part) => value?.[part], messages[locale.value]) ?? key.split('.').reduce((value, part) => value?.[part], messages.en)
}

export function t(key, values = {}) {
  const message = messageAt(key)
  if (typeof message === 'function') return message(values)
  return typeof message === 'string' ? message.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? `{${name}}`) : key
}

export function setLocale(nextLocale) {
  if (!supportedLocales.includes(nextLocale)) return
  locale.value = nextLocale
  window.localStorage.setItem('takaneko-locale', nextLocale)
  document.documentElement.lang = nextLocale
}

export function useI18n() { return { locale, setLocale, t } }

export function formatTimelineDay(date) {
  const localDate = new Date(`${date}T12:00:00`)
  const now = new Date()
  if (localDate.toDateString() === now.toDateString()) return t('timeline.today')
  const options = localDate.getFullYear() === now.getFullYear() ? { weekday: 'short', day: 'numeric', month: 'short' } : { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }
  return new Intl.DateTimeFormat(locale.value, options).format(localDate)
}

export function formatDateTime(value) { return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }
