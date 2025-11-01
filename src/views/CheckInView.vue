<script setup>
import { computed, onMounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCheckInsStore } from '../stores/useCheckInsStore'
import { usePlanStore } from '../stores/usePlanStore'
import { useExercisesStore } from '../stores/useExercisesStore'
import { useFeedbackStore } from '../stores/useFeedbackStore'
import { useAuthStore } from '../stores/useAuthStore'

const router = useRouter()
const checkInsStore = useCheckInsStore()
const planStore = usePlanStore()
const exercisesStore = useExercisesStore()
const authStore = useAuthStore()
const feedbackStore = useFeedbackStore()

const form = reactive({
  strain: 0,
  pain: 0,
  comment: '',
  completedItems: [],
})

const currentCheckIn = computed(() => checkInsStore.todayCheckIn)
const isAuthenticated = computed(() => authStore.isAuthenticated)

const planItems = computed(() =>
  planStore.items.map((item) => ({
    ...item,
    exercise: exercisesStore.findById(item.exercise),
  })),
)

const isEditing = computed(() => Boolean(currentCheckIn.value))

const hydrateForm = () => {
  if (!currentCheckIn.value) {
    form.strain = 0
    form.pain = 0
    form.comment = ''
    form.completedItems = []
    return
  }
  form.strain = currentCheckIn.value.strain_0_10
  form.pain = currentCheckIn.value.pain_0_10
  form.comment = currentCheckIn.value.comment || ''
  form.completedItems = [...(currentCheckIn.value.completedItems || [])]
}

const handleSubmit = async () => {
  try {
    if (!isAuthenticated.value) {
      throw new Error('Sign in to submit your check-in.')
    }
    const payload = {
      completedItems: form.completedItems,
      strain_0_10: form.strain,
      pain_0_10: form.pain,
      comment: form.comment,
    }
    if (isEditing.value) {
      await checkInsStore.amend(payload)
    } else {
      await checkInsStore.submit(payload)
    }
    const completedAll =
      planItems.value.length > 0 && form.completedItems.length === planItems.value.length
    await feedbackStore.recordCompletionStatus(completedAll)
    await router.push('/')
  } catch (error) {
    console.error(error)
  }
}

const toggleExercise = (exerciseId) => {
  if (!exerciseId) return
  const set = new Set(form.completedItems)
  if (set.has(exerciseId)) {
    set.delete(exerciseId)
  } else {
    set.add(exerciseId)
  }
  form.completedItems = Array.from(set)
}

const loadData = async () => {
  if (!isAuthenticated.value) return
  await Promise.all([
    planStore.loadActivePlan(),
    exercisesStore.fetchExercises(),
    checkInsStore.loadToday(),
  ])
  hydrateForm()
}

onMounted(loadData)

watch(isAuthenticated, async (next) => {
  if (next) {
    await loadData()
  } else {
    form.strain = 0
    form.pain = 0
    form.comment = ''
    form.completedItems = []
  }
})

watch(currentCheckIn, hydrateForm)
</script>

<template>
  <section class="checkin-view">
    <header>
      <h1>{{ isEditing ? 'Update today’s check-in' : 'Daily check-in' }}</h1>
      <p>Reflect on how today’s rehab went so we can track your progress.</p>
    </header>

    <div v-if="!isAuthenticated" class="card locked">
      <p>Please sign in to submit your daily check-in.</p>
    </div>

    <form v-else class="card" @submit.prevent="handleSubmit">
      <fieldset>
        <legend>How did your body feel today?</legend>
        <div class="slider-group">
          <label>
            Strain level: {{ form.strain }}
            <input
              v-model.number="form.strain"
              class="range"
              type="range"
              min="0"
              max="10"
              step="1"
            />
          </label>
          <label>
            Pain level: {{ form.pain }}
            <input
              v-model.number="form.pain"
              class="range"
              type="range"
              min="0"
              max="10"
              step="1"
            />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Which exercises did you complete?</legend>
        <p v-if="!planItems.length" class="hint">
          You don’t have any exercises in your plan yet.
        </p>
        <ul v-else class="exercise-list">
          <li v-for="item in planItems" :key="item.exercise?._id">
            <label>
              <input
                type="checkbox"
                :value="item.exercise?._id"
                :checked="form.completedItems.includes(item.exercise?._id)"
                @change="toggleExercise(item.exercise?._id)"
              />
              <span>{{ item.exercise?.title || 'Exercise' }}</span>
            </label>
          </li>
        </ul>
      </fieldset>

      <label class="note-field">
        Daily note (optional)
        <textarea v-model="form.comment" rows="6" placeholder="How did it feel today?" />
      </label>

      <footer>
        <button type="submit">{{ isEditing ? 'Save changes' : 'Submit check-in' }}</button>
      </footer>
    </form>
  </section>
</template>

<style scoped>
.checkin-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

header h1 {
  margin: 0;
  font-size: 2rem;
}

header p {
  margin: 0.5rem 0 0;
  color: #51627a;
}

.card {
  background: #fff;
  border-radius: 1.25rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.card.locked {
  align-items: center;
  justify-content: center;
  min-height: 240px;
  color: #5b708f;
}

fieldset {
  border: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

legend {
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.slider-group {
  display: grid;
  gap: 1.25rem;
}

.range {
  width: 100%;
  appearance: none;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--color-accent), rgba(0, 123, 255, 0.6));
  outline: none;
  transition: box-shadow 0.2s ease;
}

.range::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  border: 3px solid var(--color-accent);
  box-shadow: 0 6px 12px rgba(0, 123, 255, 0.35);
  transition: transform 0.15s ease;
}

.range::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  border: 3px solid var(--color-accent);
  box-shadow: 0 6px 12px rgba(0, 123, 255, 0.35);
  transition: transform 0.15s ease;
}

.range:focus {
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
}

.range:active::-webkit-slider-thumb,
.range:active::-moz-range-thumb {
  transform: scale(1.05);
}

.exercise-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.exercise-list li {
  background: #f3f5fb;
  border-radius: 0.85rem;
  padding: 0.75rem 1rem;
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

.exercise-list label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
}

.note-field textarea {
  margin-top: 0.5rem;
  resize: vertical;
  min-height: 140px;
}

footer {
  display: flex;
  justify-content: flex-end;
}

.hint {
  color: #5b708f;
}
</style>

