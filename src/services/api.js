import { API_BASE } from '@/config/urls'

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}