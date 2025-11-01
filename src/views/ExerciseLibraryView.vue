<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useExercisesStore } from '../stores/useExercisesStore'
import { useAuthStore } from '../stores/useAuthStore'
import AddExerciseModal from '../components/library/AddExerciseModal.vue'
import ExerciseAdminActions from '../components/library/ExerciseAdminActions.vue'

const exercisesStore = useExercisesStore()
const authStore = useAuthStore()

const showAddModal = ref(false)

const isAdmin = computed(() => authStore.isAdmin)
const isAuthenticated = computed(() => authStore.isAuthenticated)

const exercises = computed(() => exercisesStore.exercises)

const pendingCount = computed(
  () => exercisesStore.proposals.filter((proposal) => proposal.status === 'pending').length,
)

const loadExercises = async () => {
  await exercisesStore.fetchExercises({ includeDeprecated: true })
  if (isAdmin.value) {
    await exercisesStore.fetchProposals()
  }
}

onMounted(async () => {
  if (isAuthenticated.value) {
    await loadExercises()
  }
})

watch(isAuthenticated, async (next) => {
  if (next) {
    await loadExercises()
  }
})

const handleCreated = async () => {
  await loadExercises()
}

const openModal = () => {
  showAddModal.value = true
}

const closeModal = () => {
  showAddModal.value = false
}
</script>

<template>
  <section class="library-view">
    <header>
      <div>
        <h1>Exercise library</h1>
        <p>Manage the movements available for rehab plans.</p>
      </div>
      <button v-if="isAdmin" type="button" @click="openModal">Add exercise</button>
    </header>

    <p v-if="!isAuthenticated" class="helper">Sign in to browse the exercise library.</p>

    <p v-else-if="!isAdmin" class="helper">
      You can browse exercises below. Administrator access is required to add or edit entries.
    </p>

    <div v-if="isAuthenticated && exercises.length" class="grid">
      <article v-for="exercise in exercises" :key="exercise._id" class="card">
        <header>
          <h2>{{ exercise.title }}</h2>
          <span v-if="exercise.deprecated" class="badge">Deprecated</span>
        </header>
        <p class="cues">{{ exercise.cues || 'No cues recorded yet.' }}</p>
        <footer>
          <div class="links">
            <router-link :to="{ name: 'exercise-detail', params: { id: exercise._id } }">
              View details
            </router-link>
            <span class="video" v-if="exercise.videoUrl">Video attached</span>
            <ExerciseAdminActions
              v-if="isAdmin"
              :exercise-id="exercise._id"
              :deprecated="exercise.deprecated"
              @updated="handleCreated"
            />
          </div>
        </footer>
      </article>
    </div>

    <p v-else-if="isAuthenticated" class="empty">No exercises yet. Add one to get started.</p>

    <AddExerciseModal :open="showAddModal" @close="closeModal" @created="handleCreated" />

    <div v-if="isAdmin && pendingCount" class="pending-banner">
      {{ pendingCount }} proposal{{ pendingCount === 1 ? '' : 's' }} awaiting review. Open an
      exercise detail page to apply or discard updates.
    </div>
  </section>
</template>

<style scoped>
.library-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

header h1 {
  margin: 0;
}

.helper {
  color: #5b708f;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}

.card {
  background: var(--color-surface);
  border-radius: var(--radius-large);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: var(--shadow-soft);
}

.card header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.card h2 {
  margin: 0;
  font-size: 1.1rem;
}

.badge {
  align-self: flex-start;
  background: var(--color-danger-soft);
  color: var(--color-danger);
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.cues {
  margin: 0;
  color: #334155;
  min-height: 60px;
}


.links {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
}

.card footer a {
  font-weight: 600;
  color: var(--color-accent);
}

.video {
  font-size: 0.85rem;
  color: #51627a;
}

.empty {
  background: var(--color-surface);
  border-radius: var(--radius-large);
  padding: 2rem;
  text-align: center;
  color: #5b708f;
  box-shadow: var(--shadow-soft);
}

.pending-banner {
  margin-top: 1rem;
  background: #fffbe6;
  border: 1px solid #f5d776;
  border-radius: var(--radius-medium);
  padding: 0.75rem 1rem;
  color: #5c4c13;
  font-weight: 500;
}
</style>

