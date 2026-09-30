<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SiteHeader from '@/components/SiteHeader.vue'
import { API_BASE } from '@/config/urls'
import { clearAdminSession, logoutAdmin } from '@/services/adminAuth'

const router = useRouter()
const route = useRoute()
const profiles = ref([])
const loading = ref(false)
const creating = ref(false)
const error = ref('')
const displayName = ref('')
const slug = ref('')
const slugEdited = ref(false)

function slugify(value) {
  return value.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64)
}

function updateSuggestedSlug() {
  if (!slugEdited.value) slug.value = slugify(displayName.value)
}

function updateSlug() {
  slugEdited.value = true
}

async function responseJson(response) {
  const payload = await response.json().catch(() => ({}))
  if (response.status === 401) {
    clearAdminSession()
    await router.replace({ name: 'login', query: { redirect: route.fullPath } })
  }
  if (!response.ok) throw new Error(payload.detail || `Request failed (${response.status})`)
  return payload
}

async function loadProfiles() {
  loading.value = true
  error.value = ''
  try {
    profiles.value = (await responseJson(await fetch(`${API_BASE}/preference/profiles`))).items
  } catch (cause) {
    error.value = cause.message
  } finally {
    loading.value = false
  }
}

async function createProfile() {
  creating.value = true
  error.value = ''
  try {
    const profile = await responseJson(await fetch(`${API_BASE}/preference/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: displayName.value, slug: slug.value }),
    }))
    await router.push({ name: 'highlights-training', params: { profile: profile.slug } })
  } catch (cause) {
    error.value = cause.message
  } finally {
    creating.value = false
  }
}

async function signOut() {
  await logoutAdmin()
  await router.replace('/')
}

onMounted(loadProfiles)
</script>

<template>
  <SiteHeader />
  <main class="dashboard">
    <header>
      <p class="eyebrow">ADMINISTRATION</p>
      <h1>Dashboard</h1>
      <p>Private tools for maintaining Takaneko DB.</p>
    </header>

    <section class="profile-form" aria-labelledby="new-profile-heading">
      <div>
        <h2 id="new-profile-heading">New preference profile</h2>
        <p>Each profile keeps its own ratings and trained model while sharing the NaFlex media archive.</p>
      </div>
      <form @submit.prevent="createProfile">
        <label>Profile name<input v-model="displayName" required maxlength="100" placeholder="Beautiful stage" @input="updateSuggestedSlug"></label>
        <label>Profile slug<input v-model="slug" required minlength="3" maxlength="64" pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="beautiful-stage" @input="updateSlug"></label>
        <button type="submit" :disabled="creating || !displayName.trim() || !slug">{{ creating ? 'Creating…' : 'Create and start training' }}</button>
      </form>
    </section>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <section class="profiles" aria-labelledby="profiles-heading">
      <h2 id="profiles-heading">Preference profiles</h2>
      <p v-if="loading">Loading profiles…</p>
      <p v-else-if="!profiles.length">No profiles have been created yet.</p>
      <template v-else>
        <RouterLink v-for="profile in profiles" :key="profile.id" class="profile-card" :to="{ name: 'highlights-training', params: { profile: profile.slug } }">
          <div><h3>{{ profile.display_name }}</h3><p>{{ profile.slug }}</p></div>
          <div class="profile-state"><strong>{{ profile.rating_count }} ratings</strong><span>{{ profile.active_model_run_id ? 'Model ready' : 'Needs initial training' }}</span></div>
        </RouterLink>
      </template>
    </section>
    <button class="logout" type="button" @click="signOut">Sign out</button>
  </main>
</template>

<style scoped>
.dashboard { width:min(100% - 2rem, 56rem); min-height:calc(100vh - 52px); margin:auto; padding:clamp(2rem, 6vw, 4rem) 0; }
header { text-align:center; } .eyebrow { margin:0; color:var(--iw-accent); font-weight:700; letter-spacing:.12em; } header > p:last-child,.profile-form p,.profile-card p { margin-top:.45rem; color:var(--iw-text-muted); }
.profile-form,.profiles { margin-top:2.5rem; padding:1.25rem; border:1px solid var(--iw-border); border-radius:var(--iw-radius-md); background:var(--iw-surface); }
.profile-form form { display:grid; grid-template-columns:1fr 1fr auto; gap:.75rem; align-items:end; margin-top:1.25rem; }.profile-form label { display:grid; gap:.35rem; color:var(--iw-text-muted); font-size:.9rem; }.profile-form input { min-width:0; min-height:2.75rem; padding:.6rem .7rem; border:1px solid var(--iw-control-border); border-radius:var(--iw-radius-sm); background:var(--iw-surface-selected); color:var(--iw-text); font:inherit; }
.profile-form button,.logout { min-height:2.75rem; padding:.65rem 1rem; border:1px solid var(--iw-accent); border-radius:var(--iw-radius-sm); background:var(--iw-accent); color:var(--iw-on-accent); font:inherit; font-weight:700; cursor:pointer; }.profile-form button:disabled { opacity:.6; cursor:not-allowed; }
.profiles h2 { margin-bottom:1rem; }.profile-card { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:1rem 0; border-top:1px solid var(--iw-border); color:inherit; text-decoration:none; }.profile-card:first-of-type { border-top:0; }.profile-card h3,.profile-card p { margin:0; }.profile-state { display:grid; gap:.2rem; text-align:right; }.profile-state span { color:var(--iw-text-muted); font-size:.9rem; }.error { margin:1rem 0; color:var(--iw-error, #b84836); }.logout { display:flex; margin:1.5rem auto 0; border-color:var(--iw-control-border); background:transparent; color:var(--iw-text); }
@media (max-width: 42rem) { .profile-form form { grid-template-columns:1fr; }.profile-card { align-items:flex-start; }.profile-state { text-align:left; } }
</style>
