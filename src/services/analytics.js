import { API_BASE } from '@/config/urls'
let referrerDomain = 'direct'
try { if (document.referrer) referrerDomain = new URL(document.referrer).hostname || 'direct' } catch (_) {}
export function routeCategory(path) {
  if (path === '/') return 'landing'
  if (path === '/takaneko-tv') return 'takaneko_tv'
  if (path === '/takaneko-showrooms' || path.startsWith('/takaneko-showrooms/')) return 'takaneko_showrooms'
  if (path.startsWith('/search')) return 'search'
  if (path.startsWith('/idol/by-face/')) return 'idol_face'
  if (path.startsWith('/idol/')) return 'idol'
  return 'not_found'
}
export function track(event_type, data = {}, path = window.location.pathname) {
  const body = JSON.stringify({ event_type, route: path, referrer_domain: referrerDomain, data })
  fetch(`${API_BASE}/analytics/events`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
}
