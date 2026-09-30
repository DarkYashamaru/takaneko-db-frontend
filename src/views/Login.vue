<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SiteHeader from '@/components/SiteHeader.vue'
import { loginAdmin } from '@/services/adminAuth'

const route = useRoute()
const router = useRouter()
const password = ref('')
const error = ref('')
const submitting = ref(false)

function destination() {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect
    : '/dashboard'
}

async function submit() {
  if (submitting.value) return
  error.value = ''
  submitting.value = true
  try {
    await loginAdmin(password.value)
    password.value = ''
    await router.replace(destination())
  } catch (cause) {
    error.value = cause.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-layout">
    <SiteHeader />

    <main class="login-page">
      <section class="login-card" aria-labelledby="login-title">
        <header class="login-card__header">
          <p class="eyebrow">PRIVATE ACCESS</p>
          <h1 id="login-title">Administrator login</h1>
          <p class="login-description">
            Sign in to manage personal Takaneko tools.
          </p>
        </header>

        <form
          class="login-form"
          :aria-busy="submitting"
          @submit.prevent="submit"
        >
          <div class="form-field">
            <label for="admin-password">Password</label>

            <input
              id="admin-password"
              v-model="password"
              name="password"
              type="password"
              autocomplete="current-password"
              placeholder="Enter your password"
              required
              :disabled="submitting"
              :aria-invalid="error ? 'true' : undefined"
              :aria-describedby="error ? 'login-error' : undefined"
            >

            <p
              v-if="error"
              id="login-error"
              class="form-error"
              role="alert"
            >
              {{ error }}
            </p>
          </div>

          <button class="login-button" type="submit" :disabled="submitting">
            {{ submitting ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* Let the header determine its own height. */
.login-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100svh;
}

.login-page {
  display: grid;
  flex: 1;
  place-items: center;
  padding: clamp(1.5rem, 5vw, 4rem) 1rem;
}

.login-card,
.login-card * {
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  max-width: 28rem;
  min-width: 0;
  padding: clamp(1.5rem, 5vw, 2.5rem);
  border: 1px solid var(--iw-border);
  border-radius: var(--iw-radius-md);
  background: var(--iw-surface);
  color: var(--iw-text);
  box-shadow: var(--iw-shadow-md);
}

/* Heading: compact title group with a quieter description. */
.login-card__header {
  margin-bottom: 2rem;
}

.eyebrow {
  margin: 0 0 0.75rem;
  color: var(--iw-accent);
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.14em;
}

.login-card__header h1 {
  margin: 0;
  font-size: clamp(1.65rem, 5vw, 2rem);
  line-height: 1.2;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.login-description {
  margin: 0.875rem 0 0;
  color: var(--iw-text-muted);
  font-size: 0.95rem;
  line-height: 1.65;
}

/* Form: keep related elements together. */
.login-form {
  display: grid;
  gap: 1.5rem;
}

.form-field {
  display: grid;
  gap: 0.625rem;
}

.form-field label {
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.5;
}

.form-field input {
  display: block;
  width: 100%;
  min-width: 0;
  min-height: 3rem;
  padding: 0.75rem 0.875rem;
  border: 1px solid var(--iw-control-border);
  border-radius: var(--iw-radius-sm);
  background: var(--iw-surface-soft);
  color: var(--iw-text);
  font: inherit;
  font-size: 1rem;
}

.form-field input::placeholder {
  color: var(--iw-text-muted);
  opacity: 1;
}

.form-field input[aria-invalid="true"] {
  border-color: var(--iw-danger);
}

.form-field input:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.form-error {
  margin: 0;
  color: var(--iw-danger);
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

/* Action: full-width and visually separate from the field. */
.login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 3rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--iw-accent);
  border-radius: var(--iw-radius-sm);
  background: var(--iw-accent);
  color: var(--iw-on-accent);
  font: inherit;
  font-weight: 700;
  line-height: 1.5;
  cursor: pointer;
}

.login-button:hover:not(:disabled) {
  border-color: var(--iw-accent-hover);
  background: var(--iw-accent-hover);
}

.login-button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.form-field input:focus-visible,
.login-button:focus-visible {
  outline: 2px solid var(--iw-accent);
  outline-offset: 3px;
}

/* Keep the form reachable on short screens and with a keyboard open. */
@media (max-height: 600px) {
  .login-page {
    align-items: start;
  }
}
</style>