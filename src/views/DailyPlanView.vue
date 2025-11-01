<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePlanStore } from '../stores/usePlanStore'
import { useExercisesStore } from '../stores/useExercisesStore'
import { useCheckInsStore } from '../stores/useCheckInsStore'
import { useAuthStore } from '../stores/useAuthStore'
import { useFeedbackStore } from '../stores/useFeedbackStore'

const router = useRouter()
const planStore = usePlanStore()
const exercisesStore = useExercisesStore()
const checkInsStore = useCheckInsStore()
const authStore = useAuthStore()
const feedbackStore = useFeedbackStore()

const isLoading = computed(
  () => planStore.loading || exercisesStore.loading || checkInsStore.loading,
)

const isAuthenticated = computed(() => authStore.isAuthenticated)

const checkInComplete = computed(() => Boolean(checkInsStore.todayCheckIn))

const completedIds = computed(
  () => checkInsStore.todayCheckIn?.completedItems || [],
)

const planItems = computed(() => {
  return planStore.items.map((item) => ({
    ...item,
    exercise: exercisesStore.findById(item.exercise),
  }))
})

const percentComplete = computed(() => {
  if (!planItems.value.length) return 0
  const completeCount = planItems.value.filter((item) =>
    completedIds.value.includes(item.exercise?._id),
  ).length
  return Math.round((completeCount / planItems.value.length) * 100)
})

const toggleCompletion = async (exerciseId) => {
  try {
    if (!checkInsStore.todayCheckIn) {
      await router.push('/check-in')
      return
    }
    const current = new Set(completedIds.value)
    if (current.has(exerciseId)) {
      current.delete(exerciseId)
    } else {
      current.add(exerciseId)
    }
    const updatedItems = Array.from(current)
    await checkInsStore.amend({ completedItems: updatedItems })
    const completedAll =
      planItems.value.length > 0 && updatedItems.length === planItems.value.length
    await feedbackStore.recordCompletionStatus(completedAll)
  } catch (error) {
    console.error(error)
  }
}

const loadData = async () => {
  if (!isAuthenticated.value) return
  await Promise.all([
    exercisesStore.fetchExercises(),
    planStore.loadActivePlan(),
    checkInsStore.loadToday(),
  ])
}

onMounted(loadData)

watch(isAuthenticated, async (next) => {
  if (next) {
    await loadData()
  } else {
    planStore.reset()
    checkInsStore.today = null
  }
})
</script>

<template>
  <section class="plan-view">
    <header>
      <div>
        <h1>Today&apos;s Plan</h1>
        <p class="subtitle">Stay on track with your rehab routine.</p>
      </div>
      <div class="progress-card">
        <span class="label">Completion</span>
        <span class="value">{{ percentComplete }}%</span>
      </div>
    </header>

    <div v-if="!isAuthenticated" class="empty-state">
      <h2>Sign in to view your plan</h2>
      <p>Your personalized rehab plan appears here after you log in.</p>
    </div>

    <div v-else-if="isLoading" class="loading">
      Loading your plan...
    </div>

    <article v-else class="content">
      <div v-if="!planItems.length" class="empty-state">
        <h2>No exercises yet</h2>
        <p>Add exercises to your plan to see them here.</p>
        <router-link class="link" to="/build-plan">Build your plan</router-link>
      </div>

      <div v-else class="plan-list">
        <p v-if="!checkInComplete" class="checkin-callout">
          Complete your daily check-in to log today&apos;s progress.
          <router-link to="/check-in">Go to check-in</router-link>
        </p>
        <ul>
          <li v-for="item in planItems" :key="item.exercise?._id" class="plan-item">
            <div class="details">
              <h3>
                <router-link
                  v-if="item.exercise"
                  :to="{ name: 'exercise-detail', params: { id: item.exercise._id } }"
                >
                  {{ item.exercise.title }}
                </router-link>
                <span v-else>Exercise {{ item.exercise }}</span>
              </h3>
              <p class="metadata">
                {{ item.sets }} sets × {{ item.reps }} reps · Target {{ item.perWeek }}x/week
              </p>
              <p v-if="item.notes" class="notes">{{ item.notes }}</p>
            </div>
            <label class="checkbox">
              <input
                type="checkbox"
                :checked="completedIds.includes(item.exercise?._id)"
                :disabled="!checkInComplete"
                @change="toggleCompletion(item.exercise?._id)"
              />
              <span>Done</span>
            </label>
          </li>
        </ul>
      </div>
    </article>
  </section>
</template>

<style scoped>
.plan-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

h1 {
  margin: 0;
  font-size: 2rem;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #51627a;
}

.progress-card {
  background: #fff;
  border-radius: 1rem;
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.progress-card .label {
  font-size: 0.85rem;
  color: #5a6b85;
}

.progress-card .value {
  font-size: 1.8rem;
  font-weight: 700;
  margin-top: 0.25rem;
}

.loading {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
}

.content {
  background: #fff;
  border-radius: 1.25rem;
  padding: 1.5rem;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
}

.empty-state h2 {
  margin-top: 0;
}

.link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 1rem;
  border-radius: 999px;
  padding: 0.65rem 1.5rem;
  background: var(--color-accent);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 12px 26px rgba(0, 123, 255, 0.35);
}

.plan-list ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.plan-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  background: #f3f5fb;
}

.plan-item h3 {
  margin: 0 0 0.4rem;
}

.metadata {
  margin: 0;
  font-size: 0.95rem;
  color: #5b708f;
}

.notes {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  color: #3e4c63;
}

.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #1f2933;
}

.checkbox input {
  width: 1.2rem;
  height: 1.2rem;
}

.checkin-callout {
  margin: 0 0 1rem;
  padding: 1rem 1.25rem;
  background: var(--color-warning-soft);
  border: 1px solid var(--color-warning);
  border-radius: 1rem;
  color: #5d4c05;
}

.checkin-callout a {
  color: var(--color-accent);
  font-weight: 600;
}

@media (max-width: 720px) {
  .plan-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .checkbox {
    align-self: flex-end;
  }
}
</style>

