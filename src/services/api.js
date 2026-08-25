import { API_BASE } from '@/config/urls'
import { t } from '@/i18n'

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(t('errors.requestFailed'))
  return res.json()
}