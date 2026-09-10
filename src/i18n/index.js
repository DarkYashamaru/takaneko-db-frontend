import { ref } from 'vue'

export const supportedLocales = ['en', 'es-419']
export const locale = ref(resolveInitialLocale())

const messages = {
  en: {
    common: {
      language: 'Language',
      back: 'Back',
      close: 'Close',
      previous: 'Previous',
      next: 'Next',
      info: 'Info'
    },

    hero: {
      subtitle: 'An unofficial historical archive of Takane no Nadeshiko',
      imageAlt: 'Takane no Nadeshiko'
    },

    idols: {
      title: 'Members',
      portraitAlt: 'Portrait of {name}'
    },

    search: {
      title: 'Advanced Search',
      context: 'Context',
      contextPlaceholder: 'e.g. beach, live performance, white dress…',
      dateRange: 'Date range',
      startDate: 'Start date',
      endDate: 'End date',
      postedBy: 'Posted by',
      anyone: 'Anyone',
      faces: 'Members',
      platform: 'Platform',
      allPlatforms: 'All platforms',
      submit: 'Search'
    },

    timeline: {
      loading: 'Loading timeline…',
      loadingMore: 'Loading more…',
      end: 'You’ve reached the end of the timeline',
      today: 'Today'
    },

    memories: {
      title: 'On this day',
      yearsAgo: ({ count }) =>
        count === 1 ? '1 year ago' : `${count} years ago`
    },

    lightbox: {
      platform: 'Platform:',
      postedAt: 'Posted:',
      viewOriginal: 'View original post',
      recognizedIdols: 'Members'
    },

    development: {
      title: '🚧 Under development'
    },

    mikurun: {
      title: 'WE LOVE YOU, MIKURUN! 🌹❤️',
      imageAlt: 'Mikurun tribute image {index}',
      concertTitle: "Mikuru's Final Concert",
      concertUnavailable: 'The concert is temporarily unavailable.'
    },

    takanekoTv: {
      title: 'TAKANEKO TV with subtitles',
      intro: 'Watch TAKANEKO TV with fan-made English and Spanish subtitles.',
      disclaimerTitle: 'Unofficial fan project',
      disclaimer:
        'This is a non-commercial fan project and is not affiliated with Takane no Nadeshiko. All videos belong to their respective copyright holders. Please also watch the official upload on YouTube to support the group directly.',
      loading: 'Loading episodes…',
      loadFailed: 'TAKANEKO TV is temporarily unavailable.',
      empty: 'No subtitled episodes are available yet.',
      playbackFailed: 'This episode is temporarily unavailable.',
      watchOriginal: 'Watch on YouTube',
      captions: 'Subtitles', english: 'English', spanish: 'Spanish', open: 'Explore TAKANEKO TV', episodes: 'Episodes'
    },

    showrooms: {
      title: 'TAKANEKO Showrooms with subtitles',
      intro: 'Watch member SHOWROOM archives with fan-made English and Spanish subtitles.',
      disclaimerTitle: 'Unofficial fan project',
      disclaimer: 'This is a non-commercial fan project and is not affiliated with Takane no Nadeshiko. All videos belong to their respective copyright holders. Please also watch the original broadcast on SHOWROOM to support the group directly.',
      watchOriginal: 'Watch on SHOWROOM',
      loading: 'Loading showrooms…',
      loadFailed: 'TAKANEKO Showrooms are temporarily unavailable.',
      empty: 'No subtitled SHOWROOM videos are available for this member yet.',
      open: 'Explore TAKANEKO Showrooms',
      members: 'Members',
      videoCount: '{count} videos',
      memberTitle: '{name} SHOWROOM archives',
      memberIntro: 'Watch this member’s SHOWROOM archives with English and Spanish subtitles.',
      allMembers: '← All members'
    },

    errors: {
      notFound: 'Page not found',
      goHome: '← Back to home',
      requestFailed: 'Unable to load this content.'
    }
  },

  'es-419': {
    common: {
      language: 'Idioma',
      back: 'Volver',
      close: 'Cerrar',
      previous: 'Anterior',
      next: 'Siguiente',
      info: 'Información'
    },

    hero: {
      subtitle: 'Archivo histórico no oficial de Takane no Nadeshiko',
      imageAlt: 'Takane no Nadeshiko'
    },

    idols: {
      title: 'Miembros',
      portraitAlt: 'Retrato de {name}'
    },

    search: {
      title: 'Búsqueda avanzada',
      context: 'Contexto',
      contextPlaceholder: 'p. ej., playa, presentación en vivo, vestido blanco…',
      dateRange: 'Rango de fechas',
      startDate: 'Fecha de inicio',
      endDate: 'Fecha de fin',
      postedBy: 'Publicado por',
      anyone: 'Cualquiera',
      faces: 'Miembros',
      platform: 'Plataforma',
      allPlatforms: 'Todas las plataformas',
      submit: 'Buscar'
    },

    timeline: {
      loading: 'Cargando cronología…',
      loadingMore: 'Cargando más…',
      end: 'Has llegado al final de la cronología',
      today: 'Hoy'
    },

    memories: {
      title: 'Un día como hoy',
      yearsAgo: ({ count }) =>
        count === 1 ? 'Hace 1 año' : `Hace ${count} años`
    },

    lightbox: {
      platform: 'Plataforma:',
      postedAt: 'Publicado:',
      viewOriginal: 'Ver publicación original',
      recognizedIdols: 'Miembros'
    },

    development: {
      title: '🚧 En desarrollo'
    },

    mikurun: {
      title: '¡TE AMAMOS MIKURUN! 🌹❤️',
      imageAlt: 'Imagen de homenaje a Mikurun {index}',
      concertTitle: 'Último concierto de Mikuru',
      concertUnavailable: 'El concierto no está disponible temporalmente.'
    },

    takanekoTv: {
      title: 'TAKANEKO TV con subtítulos',
      intro: 'Mira TAKANEKO TV con subtítulos en inglés y español creados por fans.',
      disclaimerTitle: 'Proyecto de fans no oficial',
      disclaimer:
        'Este es un proyecto de fans sin fines comerciales y no está afiliado con Takane no Nadeshiko. Todos los videos pertenecen a sus respectivos titulares de derechos de autor. Te invitamos a ver también el video oficial en YouTube para apoyar directamente al grupo.',
      loading: 'Cargando episodios…',
      loadFailed: 'TAKANEKO TV no está disponible temporalmente.',
      empty: 'Aún no hay episodios subtitulados disponibles.',
      playbackFailed: 'Este episodio no está disponible temporalmente.',
      watchOriginal: 'Ver en YouTube',
      captions: 'Subtítulos', english: 'Inglés', spanish: 'Español', open: 'Explorar TAKANEKO TV', episodes: 'Episodios'
    },

    showrooms: {
      title: 'TAKANEKO Showrooms con subtítulos',
      intro: 'Mira los archivos de SHOWROOM de cada integrante con subtítulos en inglés y español creados por fans.',
      disclaimerTitle: 'Proyecto de fans no oficial',
      disclaimer: 'Este es un proyecto de fans sin fines comerciales y no está afiliado con Takane no Nadeshiko. Todos los videos pertenecen a sus respectivos titulares de derechos de autor. Te invitamos a ver también la transmisión original en SHOWROOM para apoyar directamente al grupo.',
      watchOriginal: 'Ver en SHOWROOM',
      loading: 'Cargando showrooms…',
      loadFailed: 'TAKANEKO Showrooms no está disponible temporalmente.',
      empty: 'Aún no hay videos de SHOWROOM subtitulados para esta integrante.',
      open: 'Explorar TAKANEKO Showrooms',
      members: 'Integrantes',
      videoCount: '{count} videos',
      memberTitle: 'Archivos de SHOWROOM de {name}',
      memberIntro: 'Mira los archivos de SHOWROOM de esta integrante con subtítulos en inglés y español.',
      allMembers: '← Todas las integrantes'
    },

    errors: {
      notFound: 'Página no encontrada',
      goHome: '← Volver al inicio',
      requestFailed: 'No se pudo cargar este contenido.'
    }
  }
}

function resolveInitialLocale() {
  const saved = window.localStorage.getItem("takaneko-locale")
  if (supportedLocales.includes(saved)) return saved
  return navigator.languages?.some(language => language.toLowerCase().startsWith("es")) || navigator.language?.toLowerCase().startsWith("es") ? "es-419" : "en"
}

function messageAt(key) {
  return key.split(".").reduce((value, part) => value?.[part], messages[locale.value]) ?? key.split(".").reduce((value, part) => value?.[part], messages.en)
}

export function t(key, values = {}) {
  const message = messageAt(key)
  if (typeof message === "function") return message(values)
  return typeof message === "string" ? message.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? `{${name}}`) : key
}

export function setLocale(nextLocale) {
  if (!supportedLocales.includes(nextLocale)) return
  locale.value = nextLocale
  window.localStorage.setItem("takaneko-locale", nextLocale)
  document.documentElement.lang = nextLocale
}

export function useI18n() { return { locale, setLocale, t } }

export function formatTimelineDay(date) {
  const localDate = new Date(`${date}T12:00:00`)
  const now = new Date()
  if (localDate.toDateString() === now.toDateString()) return t("timeline.today")
  const options = localDate.getFullYear() === now.getFullYear() ? { weekday: "short", day: "numeric", month: "short" } : { weekday: "short", day: "numeric", month: "short", year: "numeric" }
  return new Intl.DateTimeFormat(locale.value, options).format(localDate)
}

export function formatDateTime(value) { return new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) }
