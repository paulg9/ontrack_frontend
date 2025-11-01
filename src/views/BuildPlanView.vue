<script setup>
import { computed, onMounted, reactive, watch } from 'vue'
import { usePlanStore } from '../stores/usePlanStore'
import { useExercisesStore } from '../stores/useExercisesStore'
import { useAuthStore } from '../stores/useAuthStore'

const planStore = usePlanStore()
const exercisesStore = useExercisesStore()
const authStore = useAuthStore()

const state = reactive({
  search: '',
  selectedExerciseId: '',
  form: {
    sets: 3,
    reps: 10,
    perWeek: 3,
    notes: '',
  },
  error: '',
  isSubmitting: false,
})

const isAuthenticated = computed(() => authStore.isAuthenticated)

const filteredExercises = computed(() => {
  const query = state.search.trim().toLowerCase()
  return exercisesStore.activeExercises.filter((exercise) =>
    query ? exercise.title.toLowerCase().includes(query) : true,
  )
})

const selectedExercise = computed(() =>
  exercisesStore.findById(state.selectedExerciseId) || null,
)

const planItems = computed(() => planStore.items)

const selectExercise = (exerciseId) => {
  state.selectedExerciseId = exerciseId
}

const addToPlan = async () => {
  if (!state.selectedExerciseId) {
    state.error = 'Choose an exercise first.'
    return
  }
  state.isSubmitting = true
  state.error = ''
  try {
    await planStore.addItem({
      exercise: state.selectedExerciseId,
      sets: Number(state.form.sets),
      reps: Number(state.form.reps),
      perWeek: Number(state.form.perWeek),
      notes: state.form.notes,
    })
    state.form.notes = ''
  } catch (error) {
    state.error = error.message
  } finally {
    state.isSubmitting = false
  }
}

const removeFromPlan = async (exerciseId) => {
  try {
    await planStore.removeItemByExercise(exerciseId)
  } catch (error) {
    console.error(error)
  }
}

const loadData = async () => {
  if (!isAuthenticated.value) return
  await Promise.all([
    planStore.loadActivePlan(),
    exercisesStore.fetchExercises({ includeDeprecated: false }),
  ])
}

onMounted(loadData)

watch(isAuthenticated, async (next) => {
  if (next) {
    await loadData()
  } else {
    planStore.reset()
    state.selectedExerciseId = ''
  }
})
</script>

<template>
  <section class="build-plan">
    <header>
      <h1>Build your plan</h1>
      <p>Search the exercise library and tailor your weekly routine.</p>
    </header>

    <div v-if="!isAuthenticated" class="locked">
      <p>Sign in to customize your plan.</p>
    </div>

    <div v-else class="layout">
      <article class="card library">
        <div class="search">
          <label>
            <span>Search exercises</span>
            <input v-model="state.search" type="search" placeholder="Find squat, hamstring, etc." />
          </label>
        </div>
        <ul class="exercise-list">
          <li
            v-for="exercise in filteredExercises"
            :key="exercise._id"
            :class="{ selected: state.selectedExerciseId === exercise._id }"
            @click="selectExercise(exercise._id)"
          >
            <h3>{{ exercise.title }}</h3>
            <p>{{ exercise.cues }}</p>
          </li>
        </ul>
      </article>

      <article class="card editor">
        <h2>Add to plan</h2>
        <p v-if="selectedExercise" class="selected-title">
          Selected: <strong>{{ selectedExercise.title }}</strong>
        </p>
        <p v-else class="hint">Choose an exercise to configure sets, reps, and notes.</p>
        <form @submit.prevent="addToPlan" class="form">
          <div class="field-group">
            <label>
              Sets
              <input v-model.number="state.form.sets" type="number" min="1" max="10" />
            </label>
            <label>
              Reps
              <input v-model.number="state.form.reps" type="number" min="1" max="50" />
            </label>
            <label>
              Per week
              <input v-model.number="state.form.perWeek" type="number" min="1" max="14" />
            </label>
          </div>
          <label>
            Notes (optional)
            <textarea v-model="state.form.notes" rows="3" />
          </label>
          <button type="submit" :disabled="state.isSubmitting">
            {{ state.isSubmitting ? 'Adding…' : 'Add to plan' }}
          </button>
          <p v-if="state.error" class="error">{{ state.error }}</p>
        </form>
      </article>

      <article class="card current-plan">
        <h2>Plan items</h2>
        <ul v-if="planItems.length" class="plan-list">
          <li v-for="item in planItems" :key="item.exercise">
            <div>
              <h3>{{ exercisesStore.findById(item.exercise)?.title || 'Exercise' }}</h3>
              <p>{{ item.sets }} sets × {{ item.reps }} reps · {{ item.perWeek }}×/week</p>
              <p v-if="item.notes" class="notes">{{ item.notes }}</p>
            </div>
            <button type="button" class="secondary" @click="removeFromPlan(item.exercise)">
              Remove
            </button>
          </li>
        </ul>
        <p v-else class="hint">No exercises added yet.</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.build-plan {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

header h1 {
  margin: 0;
}

.locked {
  background: var(--color-surface);
  border-radius: var(--radius-large);
  padding: 2.5rem;
  text-align: center;
  color: #5b708f;
  box-shadow: var(--shadow-soft);
}

.layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
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

.library {
  grid-row: span 2;
}

.search label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.exercise-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 1rem;
  max-height: 520px;
  overflow-y: auto;
}

.exercise-list li {
  padding: 1rem;
  border-radius: 1rem;
  background: #f3f5fb;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.exercise-list li.selected,
.exercise-list li:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}

.exercise-list li.selected {
  border-color: var(--color-accent);
  box-shadow: 0 14px 26px rgba(0, 123, 255, 0.25);
}

.form {
  display: grid;
  gap: 1rem;
}

.field-group {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.plan-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 1rem;
}

.plan-list li {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  background: #f3f5fb;
  border-radius: 1rem;
  padding: 1rem;
}

.notes {
  color: #51627a;
}


.secondary {
  background: #fff;
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}

.error {
  color: var(--color-danger);
}

.hint {
  color: #5b708f;
}

@media (max-width: 1080px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .library {
    grid-row: auto;
  }
}
</style>

