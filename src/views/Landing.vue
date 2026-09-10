<script setup lang="ts">
import WeLoveYouMikurun from '@/components/WeLoveYouMikurun.vue';
import AdvancedSearch from '../components/AdvancedSearch.vue';
import FeaturedTimeline from '../components/FeaturedTimeline.vue';
import HeroSection from '../components/HeroSection.vue';
import IdolGrid from '../components/IdolGrid.vue';
import MemoriesView from '@/components/MemoriesView.vue';
import SiteHeader from '@/components/SiteHeader.vue';
import { t } from '@/i18n';

</script>

<template>
    <SiteHeader/>
    <HeroSection/>
    <MemoriesView/>
    <WeLoveYouMikurun/>
    <FeaturedTimeline/>
    <IdolGrid/>
    <section class="takaneko-tv-link">
      <p>TAKANEKO TV</p>
      <h2>{{ t('takanekoTv.title') }}</h2>
      <span>{{ t('takanekoTv.intro') }}</span>
      <RouterLink to="/takaneko-tv">{{ t('takanekoTv.open') }} <span aria-hidden="true">→</span></RouterLink>
    </section>
    <section class="takaneko-tv-link takaneko-showrooms-link">
      <p>TAKANEKO SHOWROOMS</p>
      <h2>{{ t('showrooms.title') }}</h2>
      <span>{{ t('showrooms.intro') }}</span>
      <RouterLink to="/takaneko-showrooms">{{ t('showrooms.open') }} <span aria-hidden="true">→</span></RouterLink>
    </section>
    <AdvancedSearch/>
</template>
<style scoped>
.takaneko-tv-link, .takaneko-showrooms-link { padding: clamp(2rem, 5vw, 4rem) 1rem; background: linear-gradient(135deg, #26101a, #080808); color: #fff; text-align: center; }
.takaneko-tv-link p, .takaneko-showrooms-link p { margin: 0; color: #ee8ca9; font-weight: 700; letter-spacing: .12em; }
.takaneko-tv-link h2, .takaneko-showrooms-link h2 { margin: .45rem 0 .6rem; font-size: clamp(1.55rem, 4vw, 2.3rem); }
.takaneko-tv-link > span, .takaneko-showrooms-link > span { display: block; max-width: 620px; margin: 0 auto 1.25rem; color: #ded4d7; line-height: 1.55; }
.takaneko-tv-link a, .takaneko-showrooms-link a { display: inline-block; padding: .7rem 1rem; border-radius: .4rem; background: #fff; color: #231018; font-weight: 700; text-decoration: none; }
.takaneko-tv-link a:hover, .takaneko-tv-link a:focus-visible, .takaneko-showrooms-link a:hover, .takaneko-showrooms-link a:focus-visible { background: #f1bdcc; }
.takaneko-showrooms-link { background: linear-gradient(135deg, #11231f, #080808); }
</style>
