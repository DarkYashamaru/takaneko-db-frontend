<script setup>
import { MEDIA_BASE } from '@/config/urls'
import { t } from '@/i18n'

const heroUrl = `${MEDIA_BASE}/media/mikurun.jpg`
</script>

<template>
  <section class="hero">
    <img
      :src="heroUrl"
      :alt="t('hero.imageAlt')"
      class="hero-image"
    />

    <div class="hero-overlay">
      <h1 class="hero-title">高嶺のなでしこ</h1>
      <h2 class="hero-subtitle">
        {{ t('hero.subtitle') }}
      </h2>
    </div>
  </section>
</template>

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
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;

  /*
   * This particular image is 2000x1333 and gets heavily cropped
   * vertically on wide desktop screens.
   *
   * Bias the crop toward the top so we keep the idols' faces visible
   * and sacrifice more of the lower part of the image instead.
   */
  object-position: 50% 15%;
}

/*
 * On narrower screens the image already composes well naturally,
 * so move the focal point progressively back toward the center.
 */
@media (max-width: 1200px) {
  .hero-image {
    object-position: 50% 25%;
  }
}

@media (max-width: 768px) {
  .hero-image {
    object-position: center;
  }
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