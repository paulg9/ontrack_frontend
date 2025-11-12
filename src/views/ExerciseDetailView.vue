<script setup>
import { computed, onMounted, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useExercisesStore } from '../stores/useExercisesStore'
import { useAuthStore } from '../stores/useAuthStore'

const route = useRoute()
const exercisesStore = useExercisesStore()
const authStore = useAuthStore()
const proposalForm = reactive({ isSubmitting: false, error: '' })

const exerciseId = computed(() => route.params.id)

const exercise = computed(() => exercisesStore.findById(exerciseId.value))

const isAdmin = computed(() => authStore.isAdmin)

const proposals = computed(() =>
  exercisesStore.proposalsByExercise(exerciseId.value).sort((a, b) =>
    (a.createdAt || '').localeCompare(b.createdAt || ''),
  ),
)

const pendingProposals = computed(() =>
  proposals.value.filter((proposal) => proposal.status === 'pending'),
)

const appliedProposals = computed(() =>
  proposals.value.filter((proposal) => proposal.status === 'applied'),
)

const discardedProposals = computed(() =>
  proposals.value.filter((proposal) => proposal.status === 'discarded'),
)

const hasVideo = computed(() => Boolean(exercise.value?.videoUrl))

const loadData = async () => {
  if (!exercisesStore.exercises.length) {
    await exercisesStore.fetchExercises({ includeDeprecated: true })
  }
  await exercisesStore.fetchProposals({ exerciseId: exerciseId.value })
}

const submitProposal = async () => {
  if (!isAdmin.value) return
  proposalForm.isSubmitting = true
  proposalForm.error = ''
  try {
    await exercisesStore.requestProposal(exerciseId.value)
  } catch (error) {
    proposalForm.error = error.message
  } finally {
    proposalForm.isSubmitting = false
  }
}

onMounted(loadData)

watch(
  () => exerciseId.value,
  async () => {
    await loadData()
  },
)
</script>

<template>
  <section class="exercise-view" v-if="exercise">
    <header class="header">
      <div>
        <h1>{{ exercise.title }}</h1>
        <p class="meta" :class="exercise.deprecated ? 'deprecated' : 'active'">
          {{ exercise.deprecated ? 'Deprecated' : 'Active' }}
        </p>
      </div>
    </header>

    <div class="content">
      <article class="details">
        <section>
          <h2>Cues</h2>
          <p class="cues">{{ exercise.cues || 'No cues provided yet.' }}</p>
        </section>

        <section v-if="hasVideo">
          <h2>Demo Video</h2>
          <div class="video-wrapper">
            <iframe
              :src="exercise.videoUrl"
              title="Exercise demo video"
              frameborder="0"
              allowfullscreen
            />
          </div>
        </section>
      </article>

      <aside v-if="isAdmin" class="proposals">
        <h2>AI Detail Proposals</h2>

        <form class="proposal-form" @submit.prevent="submitProposal">
          <button type="submit" :disabled="proposalForm.isSubmitting">
            {{ proposalForm.isSubmitting ? 'Requesting…' : 'Request new suggestion' }}
          </button>
          <p v-if="proposalForm.error" class="error">{{ proposalForm.error }}</p>
        </form>

        <section v-if="pendingProposals.length" class="proposal-group">
          <h3>Pending</h3>
          <ul>
            <li v-for="proposal in pendingProposals" :key="proposal._id">
              <ProposalCard :proposal="proposal" state="pending" :show-actions="isAdmin" />
            </li>
          </ul>
        </section>

        <section v-if="appliedProposals.length" class="proposal-group">
          <h3>Applied</h3>
          <ul>
            <li v-for="proposal in appliedProposals" :key="proposal._id">
              <ProposalCard :proposal="proposal" state="applied" :show-actions="false" />
            </li>
          </ul>
        </section>

        <section v-if="discardedProposals.length" class="proposal-group">
          <h3>Discarded</h3>
          <ul>
            <li v-for="proposal in discardedProposals" :key="proposal._id">
              <ProposalCard :proposal="proposal" state="discarded" :show-actions="false" />
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </section>

  <section v-else class="missing">
    <h1>Exercise not found</h1>
    <p>
      We couldn’t locate that exercise.
      <router-link to="/">Return to plan</router-link>
    </p>
  </section>
</template>

<script>
import ProposalCard from '../components/proposals/ProposalCard.vue'

export default {
  components: {
    ProposalCard,
  },
}
</script>

<style scoped>
.exercise-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.header h1 {
  margin: 0;
  font-size: 2.25rem;
}

.meta {
  margin: 0.5rem 0 0;
  color: #5b708f;
}

.deprecated {
  color: var(--color-danger);
}

.active {
  color: var(--color-success);
}

.content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.details,
.proposals {
  background: #fff;
  border-radius: 1.25rem;
  padding: 1.75rem;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.details section + section {
  margin-top: 1.5rem;
}

.video-wrapper {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 1rem;
  overflow: hidden;
  background: #000;
}

iframe {
  width: 100%;
  height: 100%;
  border: 0;
}

.proposal-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.helper-text {
  margin: 0;
  color: #5b708f;
}

.proposal-group ul {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.error {
  color: #d14343;
}

.missing {
  text-align: center;
  padding: 4rem 2rem;
  background: #fff;
  border-radius: 1.5rem;
}

@media (max-width: 1000px) {
  .content {
    grid-template-columns: 1fr;
  }
}
</style>

