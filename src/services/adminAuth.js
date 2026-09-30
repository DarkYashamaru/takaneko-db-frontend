import { computed, ref } from 'vue'
import { API_BASE } from '@/config/urls'

const authenticated = ref(false)
const checked = ref(false)

export const isAdmin = computed(() => authenticated.value)
export const adminAuthChecked = computed(() => checked.value)

export async function refreshAdminSession() {
  try {
    const response = await fetch(`${API_BASE}/auth/admin/session`, { credentials: 'same-origin' })
    const payload = response.ok ? await response.json() : { authenticated: false }
    authenticated.value = payload.authenticated === true
  } catch {
    authenticated.value = false
  } finally {
    checked.value = true
  }
  return authenticated.value
}

export async function loginAdmin(password) {
  const response = await fetch(`${API_BASE}/auth/admin/login`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!response.ok) {
    authenticated.value = false
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.detail || 'Login failed')
  }
  authenticated.value = true
  checked.value = true
}

export async function logoutAdmin() {
  try {
    await fetch(`${API_BASE}/auth/admin/logout`, { method: 'POST', credentials: 'same-origin' })
  } finally {
    authenticated.value = false
    checked.value = true
  }
}

export function clearAdminSession() {
  authenticated.value = false
  checked.value = true
}
