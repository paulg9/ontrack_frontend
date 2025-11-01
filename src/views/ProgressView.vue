<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useCheckInsStore } from '../stores/useCheckInsStore'
import { useFeedbackStore } from '../stores/useFeedbackStore'
import { useAuthStore } from '../stores/useAuthStore'

const checkInsStore = useCheckInsStore()
const feedbackStore = useFeedbackStore()
const authStore = useAuthStore()

const selectedDate = ref('')

const isAuthenticated = computed(() => authStore.isAuthenticated)

const sortedHistory = computed(() =>
  [...checkInsStore.history].sort((a, b) => (a.date > b.date ? -1 : 1)),
)

const selectedEntry = computed(() =>
  sortedHistory.value.find((entry) => entry.date === selectedDate.value) || null,
)

const streakCount = computed(() => feedbackStore.summary?.streakCount || 0)
const completion7d = computed(() => feedbackStore.summary?.completion7d || 0)

const completionTrend = computed(() => {
  return sortedHistory.value.slice(0, 7).map((entry) => ({
    date: entry.date,
    ratio:
      entry.completedItems?.length && entry.completedItems?.length > 0
        ? 1
        : 0,
    strain: entry.strain_0_10,
    pain: entry.pain_0_10,
  }))
})

const shareLinks = computed(() => feedbackStore.shareLinks || [])

const activeShareLink = computed(() =>
  shareLinks.value.find((link) => !link.expired) || shareLinks.value[0] || null,
)

const shareUrl = computed(() =>
  activeShareLink.value
    ? `${window.location.origin}/progress/share/${activeShareLink.value.token}`
    : '',
)

const generateShareLink = async () => {
  await feedbackStore.createShareLink()
}

const revokeShareLink = async (token) => {
  await feedbackStore.revokeShareLink(token)
}

const copyToClipboard = async (token) => {
  try {
    const url = `${window.location.origin}/progress/share/${token}`
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      window.alert('Share link copied to clipboard.')
    } else {
      window.prompt('Copy this share link:', url)
    }
  } catch (error) {
    console.error('Failed to copy share link', error)
  }
}

const loadData = async () => {
  if (!isAuthenticated.value) return
  await Promise.all([
    checkInsStore.loadHistory(),
    feedbackStore.refreshSummary(),
    feedbackStore.loadShareLinks(),
  ])
  if (sortedHistory.value.length) {
    selectedDate.value = sortedHistory.value[0].date
  }
}

onMounted(loadData)

watch(isAuthenticated, async (next) => {
  if (next) {
    await loadData()
  } else {
    selectedDate.value = ''
  }
})
</script>

<template>
  <section class="progress-view">
    <header>
      <div>
        <h1>Progress dashboard</h1>
        <p>Stay motivated with streaks, trends, and day-by-day insights.</p>
      </div>
      <div class="share-controls" v-if="isAuthenticated">
        <button type="button" @click="generateShareLink">Generate share link</button>
      </div>
    </header>

    <div v-if="!isAuthenticated" class="empty-state">
      <p>Sign in to unlock your streaks and trend insights.</p>
    </div>

    <div v-else class="grid">
      <article class="card summary">
        <h2>Current streak</h2>
        <p class="big-number">{{ streakCount }} days</p>
        <p class="subtext">Keep checking in to grow your streak.</p>
        <h3>7-day completion</h3>
        <p class="big-number">{{ Math.round(completion7d * 100) }}%</p>
      </article>

      <article class="card trend">
        <header>
          <h2>Last 7 days</h2>
        </header>
        <ul v-if="completionTrend.length" class="trend-list">
          <li v-for="item in completionTrend" :key="item.date">
            <span class="date">{{ item.date }}</span>
            <span class="ratio" :class="item.ratio ? 'complete' : 'missed'">
              {{ item.ratio ? 'Completed' : 'Missed' }}
            </span>
            <span class="stat">Strain {{ item.strain }}</span>
            <span class="stat">Pain {{ item.pain }}</span>
          </li>
        </ul>
        <p v-else class="empty">Complete your first check-in to unlock insights.</p>
      </article>

      <article class="card day-detail">
        <header>
          <h2>Day viewer</h2>
          <div class="select-wrapper">
            <select v-model="selectedDate">
              <option v-for="entry in sortedHistory" :key="entry._id" :value="entry.date">
                {{ entry.date }}
              </option>
            </select>
          </div>
        </header>
        <div v-if="selectedEntry" class="details">
          <p><strong>Exercises completed:</strong> {{ selectedEntry.completedItems?.length || 0 }}</p>
          <p><strong>Strain:</strong> {{ selectedEntry.strain_0_10 }}</p>
          <p><strong>Pain:</strong> {{ selectedEntry.pain_0_10 }}</p>
          <p><strong>Note:</strong> {{ selectedEntry.comment || '—' }}</p>
        </div>
        <p v-else class="empty">Pick a day to see more details.</p>
      </article>

      <article class="card share-card" v-if="shareLinks.length">
        <h2>Share links</h2>
        <p v-if="shareUrl" class="active-link">Active link: {{ shareUrl }}</p>
        <ul class="share-list">
          <li v-for="link in shareLinks" :key="link.shareLink">
            <div>
              <p class="token">{{ link.token }}</p>
              <p class="meta">
                Expires: {{ link.expiry || link.expiresAt }}
                <span v-if="link.expired" class="expired">(expired)</span>
              </p>
            </div>
            <div class="actions">
              <button type="button" class="outline" @click="copyToClipboard(link.token)">
                Copy
              </button>
              <button type="button" class="secondary" @click="revokeShareLink(link.token)">
                Revoke
              </button>
            </div>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>

<style scoped>
.progress-view {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

header {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

header h1 {
  margin: 0;
}

.share-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.empty-state {
  background: var(--color-surface);
  border-radius: var(--radius-large);
  padding: 2.5rem;
  text-align: center;
  color: #5b708f;
  box-shadow: var(--shadow-soft);
}

.secondary {
  background: #fff;
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}


.outline {
  border: 1px solid var(--color-accent);
  background: #fff;
  color: var(--color-accent);
  border-radius: 999px;
  padding: 0.4rem 1rem;
  font-weight: 600;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}
.share-card {
  grid-column: span 2;
  gap: 0.75rem;
}

.share-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.share-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  background: var(--color-accent-soft);
  border-radius: 0.9rem;
  padding: 0.75rem 1rem;
  flex-wrap: wrap;
}

.token {
  margin: 0;
  font-weight: 600;
  word-break: break-all;
}

.meta {
  margin: 0;
  font-size: 0.9rem;
  color: #5b708f;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.expired {
  color: var(--color-danger);
  margin-left: 0.25rem;
}

.active-link {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-accent);
}

.card {
  background: #fff;
  border-radius: 1.25rem;
  padding: 1.75rem;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.summary .big-number {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
}

.subtext {
  margin: 0;
  color: #51627a;
}

.trend-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.trend-list li {
  display: grid;
  grid-template-columns: repeat(4, auto);
  gap: 0.75rem;
  align-items: center;
  background: var(--color-accent-soft);
  border-radius: 0.85rem;
  padding: 0.75rem 1rem;
}

.date {
  font-weight: 600;
}

.ratio.complete {
  color: var(--color-success);
}

.ratio.missed {
  color: var(--color-danger);
}

.empty {
  margin: 0;
  color: #5b708f;
}

.select-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  background: var(--color-accent-soft);
  border-radius: 999px;
  padding: 0.4rem 0.75rem;
}

.select-wrapper::after {
  content: '▾';
  font-size: 0.85rem;
  color: var(--color-accent);
  margin-left: 0.5rem;
}

.select-wrapper select {
  appearance: none;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  padding: 0 1.75rem 0 0.25rem;
  cursor: pointer;
}

.select-wrapper select:focus {
  outline: none;
}

.details p {
  margin: 0;
}

.details p + p {
  margin-top: 0.5rem;
}

@media (max-width: 720px) {
  header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

