<script setup>
import { computed, onMounted, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import { resolveShareLink } from '../services/userService'
import { getSharedCheckIns } from '../services/checkInService'
import { getSharedSummaryMetrics } from '../services/feedbackService'

const route = useRoute()

const state = reactive({
  token: route.params.token || '',
  loading: false,
  error: '',
  shareInfo: null,
  summary: null,
  checkins: [],
})

const ownerDisplay = computed(() => {
  if (!state.shareInfo) return 'Athlete'
  return state.shareInfo.ownerUsername || 'Athlete'
})

const loadData = async () => {
  if (!state.token) {
    state.error = 'Missing share token.'
    state.shareInfo = null
    state.summary = null
    state.checkins = []
    return
  }
  state.loading = true
  state.error = ''
  try {
    const resolved = await resolveShareLink(state.token)
    const info = resolved?.results?.[0]
    if (!info || info.expired) {
      throw new Error(info?.expired ? 'Share link has expired.' : 'Share link not found.')
    }
    state.shareInfo = info

    const [summaryRow] = await getSharedSummaryMetrics(state.token)
    state.summary = summaryRow || null

    const checkins = await getSharedCheckIns(state.token)
    state.checkins = Array.isArray(checkins)
      ? [...checkins].sort((a, b) => (a.date > b.date ? -1 : 1))
      : []
  } catch (error) {
    state.error = error.message || 'Unable to load shared progress.'
    state.shareInfo = null
    state.summary = null
    state.checkins = []
  } finally {
    state.loading = false
  }
}

watch(
  () => route.params.token,
  (nextToken) => {
    state.token = nextToken || ''
    loadData()
  },
)

onMounted(loadData)
</script>

<template>
  <section class="share-view">
    <header>
      <h1>{{ ownerDisplay }}’s rehab progress</h1>
      <p v-if="state.shareInfo">
        Share link valid until {{ state.shareInfo.expiresAt?.replace('T', ' ') ?? 'expiry unknown' }}.
      </p>
    </header>

    <article v-if="state.error" class="card error-card">
      <p>{{ state.error }}</p>
    </article>

    <article v-else-if="state.loading" class="card loading-card">
      <p>Loading shared progress…</p>
    </article>

    <article v-else-if="state.summary" class="card summary-card">
      <h2>Current streak</h2>
      <p class="primary">{{ state.summary.streakCount ?? 0 }} days</p>
      <h3>7-day completion</h3>
      <p class="secondary">{{ Math.round((state.summary.completion7d ?? 0) * 100) }}%</p>
    </article>

    <article v-if="!state.loading && !state.error" class="card checkins-card">
      <h2>Recent check-ins</h2>
      <ul v-if="state.checkins.length" class="checkins-list">
        <li v-for="checkin in state.checkins" :key="checkin._id || checkin.date">
          <header>
            <strong>{{ checkin.date }}</strong>
            <span class="tag">{{ checkin.completedItems?.length ? 'Completed' : 'Missed' }}</span>
          </header>
          <p>
            <strong>Strain:</strong> {{ checkin.strain_0_10 }} ·
            <strong>Pain:</strong> {{ checkin.pain_0_10 }}
          </p>
          <p v-if="checkin.comment" class="comment">“{{ checkin.comment }}”</p>
        </li>
      </ul>
      <p v-else class="empty">No shared check-ins yet.</p>
    </article>
  </section>
</template>

<style scoped>
.share-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1rem 3rem;
}

header h1 {
  margin: 0;
}

header p {
  margin: 0.5rem 0 0;
  color: #5b708f;
}

.card {
  background: #fff;
  border-radius: 1.25rem;
  padding: 1.75rem;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.error-card {
  border: 1px solid rgba(220, 38, 38, 0.4);
  color: #991b1b;
  background: #fff5f5;
}

.loading-card {
  display: flex;
  justify-content: center;
  align-items: center;
  color: #5b708f;
}

.summary-card {
  display: grid;
  gap: 0.75rem;
}

.summary-card h2,
.summary-card h3 {
  margin: 0;
}

.primary {
  font-size: 2.5rem;
  font-weight: 700;
}

.secondary {
  font-size: 1.75rem;
  font-weight: 600;
  color: #2563eb;
}

.checkins-card {
  display: grid;
  gap: 1rem;
}

.checkins-list {
  list-style: none;
  display: grid;
  gap: 1rem;
  margin: 0;
  padding: 0;
}

.checkins-list li {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 1rem;
  padding: 1rem;
  display: grid;
  gap: 0.5rem;
}

.checkins-list header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tag {
  background: #dcfce7;
  color: #15803d;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  text-transform: uppercase;
}

.comment {
  margin: 0;
  color: #475569;
  font-style: italic;
}

.empty {
  margin: 0;
  color: #5b708f;
  text-align: center;
}
</style>

