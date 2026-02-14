<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { idols, getIdolFaceImageBySlug } from '@/data/idols'
import { MEDIA_BASE } from '@/config/urls'

const router = useRouter()

// FORM STATE
const since = ref(null)
const until = ref(null)
const selectedFaces = ref([])
const platform = ref('')
const postedBy = ref('')

// Temporary static list (replace later with API data)
const slugs = [
  { label: 'Momona', value: 'matsumoto-momona' },
  { label: 'Momoko', value: 'hashimoto-momoko' },
  { label: 'Himeri', value: 'momiyama-himeri' },
  { label: 'Mikuru', value: 'hoshitani-mikuru' },
  { label: 'Hina', value: 'hinahata-hina' },
  { label: 'Su', value: 'suzumi-su' },
  { label: 'Nao', value: 'kizuki-nao' },
  { label: 'Saara', value: 'hazuki-saara' },
  { label: 'Erisa', value: 'higashiyama-erisa' },
  { label: 'Riri', value: 'haruno-riri' }
]

const platforms = [
  { label: 'Twitter', value: 'twitter' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'TikTok', value: 'tiktok' }
]

function formatDate(date) {
  return date?.toISOString().split('T')[0]
}

function submitSearch() {
  const query = {}

  if (postedBy.value) {
  query.idol = postedBy.value
  }

  if (selectedFaces.value.length) {
    query.face = selectedFaces.value
  }

  if (since.value) {
    query.since = formatDate(since.value)
  }

  if (until.value) {
    query.until = formatDate(until.value)
  }

  if (platform.value) {
    query.platform = platform.value
  }

  router.push({
    path: '/search',
    query
  })
}

</script>

<template>
  <main class="container">
    <h1>Advanced Search</h1>

    <!-- Date Range -->
    <section class="filter-group">
      <label>Date range</label>

      <div class="date-row">
        <div class="date-field">
          <span>Start date</span>
          <VueDatePicker
            v-model="since"
            dark
            :enable-time-picker="false"
            format="yyyy-MM-dd"
            :max-date="until"
          />
        </div>

        <div class="date-field">
          <span>End date</span>
          <VueDatePicker
            v-model="until"
            dark
            :enable-time-picker="false"
            format="yyyy-MM-dd"
            :min-date="since"
          />
        </div>
      </div>
    </section>

    <!-- Idol Post filter -->
    <section class="filter-group">
      <label>Posted by</label>

      <div class="radio-group">
        <label>
          <input
            type="radio"
            value=""
            v-model="postedBy"
          />
          Anyone
        </label>

        <label
          v-for="idol in slugs"
          :key="idol.value"
        >
          <input
            type="radio"
            :value="idol.value"
            v-model="postedBy"
          />
          {{ idol.label }}
        </label>
      </div>
    </section>
    <!-- Face Filter -->
    <section class="filter-group">
      <label>Faces</label>

      <div class="face-grid">
        <label
          v-for="idol in idols"
          :key="idol.slug"
          class="face-card"
          :class="{ active: selectedFaces.includes(idol.slug) }"
        >
          <input
            type="checkbox"
            :value="idol.slug"
            v-model="selectedFaces"
            hidden
          />

          <img
            :src="`${MEDIA_BASE}${getIdolFaceImageBySlug(idol.slug)}`"
            :alt="idol.name"
          />

          <span>{{ idol.name }}</span>
        </label>
      </div>
    </section>

    <!-- Platform Filter -->
    <section class="filter-group">
      <label>Platform</label>
      <select v-model="platform">
        <option value="">All</option>
        <option
          v-for="p in platforms"
          :key="p.value"
          :value="p.value"
        >
          {{ p.label }}
        </option>
      </select>
    </section>

    <!-- Submit -->
    <button class="search-btn" @click="submitSearch">
      Search
    </button>
  </main>
</template>

<style scoped>
.container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1.5rem;
  background: #111;
  border-radius: 12px;
  color: #fff;
  font-family: system-ui, sans-serif;
}

h1 {
  margin-bottom: 1.5rem;
}

.filter-group {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

input[type="date"],
select {
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #333;
  background: #1a1a1a;
  color: #fff;
}

.search-btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  background: #4f46e5;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.search-btn:hover {
  background: #6366f1;
}

.date-row {
  display: flex;
  gap: 1rem;
}

.date-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.face-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.75rem;
  width: 100%;
}


.face-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;

  padding: 0.5rem;
  border-radius: 12px;
  cursor: pointer;

  background: #1a1a1a;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  aspect-ratio: 1 / 1.2;
}

.face-card img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.face-card span {
  font-size: 0.75rem;
  text-align: center;
}

.face-card:hover {
  background: #222;
}

.face-card.active {
  border: 1px solid #6366f1;
  background: #1f1f2f;
}

.face-card.active img {
  transform: scale(1.05);
}


</style>