import { MEDIA_BASE } from '@/config/urls'

export function thumbnail200(path) {
  return `${MEDIA_BASE}/media/thumbnails/200/${path.replace(/\.[^.]+$/, '.webp')}`
}
