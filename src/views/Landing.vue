<script setup lang="ts">
import WeLoveYouMikurun from '@/components/WeLoveYouMikurun.vue';
import AdvancedSearch from '../components/AdvancedSearch.vue';
import FeaturedTimeline from '../components/FeaturedTimeline.vue';
import HeroSection from '../components/HeroSection.vue';
import IdolGrid from '../components/IdolGrid.vue';
import MemoriesView from '@/components/MemoriesView.vue';
import SiteHeader from '@/components/SiteHeader.vue';

</script>

<template>
    <SiteHeader/>
    <HeroSection/>
    <MemoriesView/>
    <WeLoveYouMikurun/>
    <FeaturedTimeline/>
    <IdolGrid/>
    <AdvancedSearch/>
</template>