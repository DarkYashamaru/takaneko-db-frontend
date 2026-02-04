<script setup>
import { MEDIA_BASE } from '@/config/urls'

const heroUrl = `${MEDIA_BASE}/media/hero.jpg`
</script>

<template>
  <section class="hero">
    <img
      :src="heroUrl"
      alt="Takane no Nadeshiko"
      class="hero-image"
    />

    <div class="hero-overlay">
      <h1 class="hero-title">高嶺のなでしこ</h1>
      <h2 class="hero-subtitle">
        Archivo histórico no oficial de Takane No Nadeshiko
      </h2>
    </div>
  </section>
</template>

<!-- <script>
export default {
  name: 'HeroSection'
}
</script> -->

<style scoped>
.hero {
  position: relative;
  width: 100%;
  height: 70vh;
  min-height: 480px;
  overflow: hidden;
  background-color: #0f1114;
}

/* Background image */
.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

/* Overlay for text */
.hero-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  background: linear-gradient(
    to bottom,
    rgba(10, 12, 15, 0.45),
    rgba(10, 12, 15, 0.85)
  );

  text-align: center;
  padding: 1rem;
}

/* Title */
.hero-title {
  font-size: clamp(2.2rem, 5vw, 3.5rem);
  font-weight: 600;
  letter-spacing: 0.1em;
  color: #e6e6e6;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.6),
    0 0 12px rgba(255, 255, 255, 0.08);
  margin-bottom: 0.5rem;
}

/* Subtitle */
.hero-subtitle {
  font-size: 1rem;
  color: #c9c9c9;
  max-width: 420px;
  line-height: 1.6;
}
</style>
