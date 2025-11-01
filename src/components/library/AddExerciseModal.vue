<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useExercisesStore } from '../../stores/useExercisesStore'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'created'])

const exercisesStore = useExercisesStore()

const form = reactive({
  title: '',
  cues: '',
  videoUrl: '',
  error: '',
  isSubmitting: false,
})

const reset = () => {
  form.title = ''
  form.cues = ''
  form.videoUrl = ''
  form.error = ''
  form.isSubmitting = false
  draftExerciseId.value = null
  proposalId.value = ''
  aiState.value = 'idle'
  aiDetails.value = null
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      reset()
    }
  },
)

const close = () => {
  if (form.isSubmitting) return
  emit('close')
}

const draftExerciseId = ref(null)
const proposalId = ref('')
const aiState = ref('idle') // idle | loading | pending | applied | error
const aiActionLoading = ref(false)
const aiDetails = ref(null)

const proposals = computed(() =>
  draftExerciseId.value ? exercisesStore.proposalsByExercise(draftExerciseId.value) : [],
)

const activeProposal = computed(() => {
  if (proposalId.value) {
    return proposals.value.find((proposal) => proposal._id === proposalId.value) || null
  }
  return proposals.value.find((proposal) => proposal.status === 'pending') || null
})

const activeDetails = computed(() =>
  aiState.value === 'applied' ? null : aiDetails.value || activeProposal.value || null,
)

const handleSubmit = async () => {
  if (!form.title.trim()) {
    form.error = 'Title is required.'
    return
  }
  if (aiState.value === 'pending') {
    form.error = 'Please accept or decline the AI suggestion before saving.'
    return
  }
  form.isSubmitting = true
  form.error = ''
  try {
    const payload = {
      title: form.title.trim(),
      cues: form.cues.trim(),
      videoUrl: form.videoUrl.trim() ? form.videoUrl.trim() : null,
    }

    let exerciseId = draftExerciseId.value
    if (exerciseId) {
      await exercisesStore.saveExercise({ exercise: exerciseId, ...payload })
    } else {
      exerciseId = await exercisesStore.createExercise(payload)
    }
    await exercisesStore.fetchExercises({ includeDeprecated: true })
    emit('created', exerciseId)
    close()
  } catch (error) {
    form.error = error.message
  } finally {
    form.isSubmitting = false
  }
}

const runAiAugmentation = async () => {
  if (!form.title.trim()) {
    form.error = 'Add a title before requesting AI help.'
    return
  }
  aiState.value = 'loading'
  form.error = ''
  try {
    if (!draftExerciseId.value) {
      draftExerciseId.value = await exercisesStore.createDraft(form.title.trim())
    }
    const result = await exercisesStore.requestProposal(draftExerciseId.value)
    proposalId.value = result.proposal
    aiDetails.value = result.details || null
    await exercisesStore.fetchProposals({ exerciseId: draftExerciseId.value })
    const details = activeDetails.value
    if (details) {
      form.cues = details.cues || form.cues
      if (details.videoUrl !== undefined && details.videoUrl !== null) {
        form.videoUrl = details.videoUrl
      }
      aiState.value = 'pending'
    } else {
      aiState.value = 'error'
      form.error = 'No proposal returned from AI.'
    }
  } catch (error) {
    aiState.value = 'error'
    form.error = error.message
  }
}

const acceptProposal = async () => {
  if (!activeProposal.value) return
  try {
    aiActionLoading.value = true
    await exercisesStore.applyProposal(activeProposal.value._id)
    aiState.value = 'applied'
    proposalId.value = ''
    aiDetails.value = null
    await exercisesStore.fetchProposals({ exerciseId: draftExerciseId.value })
  } catch (error) {
    form.error = error.message
  } finally {
    aiActionLoading.value = false
  }
}

const rejectProposal = async () => {
  if (!activeProposal.value) return
  try {
    aiActionLoading.value = true
    await exercisesStore.discardProposal(activeProposal.value._id)
    aiState.value = 'idle'
    proposalId.value = ''
    aiDetails.value = null
    await exercisesStore.fetchProposals({ exerciseId: draftExerciseId.value })
  } catch (error) {
    form.error = error.message
  } finally {
    aiActionLoading.value = false
  }
}

const resetAi = () => {
  aiState.value = 'idle'
  aiDetails.value = null
  proposalId.value = ''
}
</script>

<template>
  <transition name="fade">
    <div v-if="open" class="modal-overlay" @click.self="close">
      <div class="modal">
        <header>
          <h2>Add a new exercise</h2>
          <button type="button" class="icon" @click="close">✕</button>
        </header>

        <form @submit.prevent="handleSubmit">
          <label>
            Title
            <input v-model="form.title" type="text" placeholder="Single-leg bridge" required />
          </label>

          <label>
            Cues (shown to athletes)
            <textarea v-model="form.cues" rows="4" placeholder="Drive through your heel, keep hips level." />
          </label>

          <label>
            Video URL (optional)
            <input v-model="form.videoUrl" type="url" placeholder="https://..." />
          </label>

          <div v-if="aiState !== 'applied'" class="ai-controls">
            <div class="ai-row">
              <div class="ai-text">
                <span class="ai-title">AI assistance</span>
                <p>Let OnTrack draft cues, frequency, and video suggestions for you.</p>
              </div>
              <button
                type="button"
                class="outline"
                :disabled="aiState === 'loading'"
                @click="runAiAugmentation"
              >
                {{ aiState === 'loading' ? 'Requesting…' : 'Fill with AI' }}
              </button>
            </div>
            <p v-if="aiState === 'pending'" class="proposal-status">
              AI proposal pending review. Accept to apply or decline to revert.
            </p>
            <p v-else-if="aiState === 'applied'" class="proposal-status applied">
              Proposal applied to this exercise.
            </p>
            <p v-else-if="aiState === 'error'" class="proposal-status error">
              Something went wrong generating a proposal. Try again.
            </p>

            <div v-if="activeDetails" class="proposal-details">
              <p><strong>Confidence:</strong> {{ Math.round((activeDetails.confidence_0_1 || 0) * 100) }}%</p>
              <p><strong>Cues:</strong> {{ activeDetails.cues || '—' }}</p>
              <p v-if="activeDetails.videoUrl"><strong>Video:</strong> {{ activeDetails.videoUrl }}</p>
            </div>

            <div v-if="aiState === 'pending' && activeProposal" class="proposal-actions">
              <span>Apply AI suggestion?</span>
              <div class="buttons">
                <button
                  type="button"
                  class="outline"
                  :disabled="aiActionLoading"
                  @click="acceptProposal"
                >
                  {{ aiActionLoading ? 'Applying…' : 'Accept' }}
                </button>
                <button
                  type="button"
                  class="secondary"
                  :disabled="aiActionLoading"
                  @click="rejectProposal"
                >
                  {{ aiActionLoading ? 'Working…' : 'Decline' }}
                </button>
              </div>
            </div>
          </div>

          <div v-else class="ai-success">
            <p>AI details applied. Review the fields above or request a fresh suggestion.</p>
            <button type="button" class="outline" @click="resetAi">
              Try again
            </button>
          </div>

          <p v-if="form.error" class="error">{{ form.error }}</p>

          <footer>
            <button type="submit" :disabled="form.isSubmitting || aiState === 'pending'">
              {{ form.isSubmitting ? 'Saving…' : 'Save exercise' }}
            </button>
            <button type="button" class="secondary" :disabled="form.isSubmitting" @click="close">
              Cancel
            </button>
          </footer>
        </form>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  z-index: 100;
  overflow-y: auto;
}

.modal {
  background: var(--color-surface);
  border-radius: var(--radius-large);
  padding: 2rem;
  width: min(520px, 100%);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: var(--shadow-soft);
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

header h2 {
  margin: 0;
}

.icon {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--color-text-secondary);
}

form {
  display: grid;
  gap: 1rem;
}

textarea {
  resize: vertical;
}

.ai-controls {
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-medium);
  padding: 1rem 1.25rem;
  background: var(--color-accent-soft);
  display: grid;
  gap: 0.75rem;
}

.ai-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.ai-text {
  display: grid;
  gap: 0.25rem;
  max-width: 360px;
}

.ai-title {
  font-weight: 600;
}

.ai-controls .outline {
  width: fit-content;
}

.outline {
  background: #fff;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 0.45rem 1.1rem;
}

.proposal-status {
  margin: 0.5rem 0 0;
  color: #51627a;
}

.proposal-status.applied {
  color: var(--color-success);
  font-weight: 600;
}

.proposal-status.error {
  color: var(--color-danger);
}

.proposal-actions {
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-medium);
  padding: 1rem;
  background: #fff;
  display: grid;
  gap: 0.75rem;
}

.proposal-actions .buttons {
  display: flex;
  gap: 0.75rem;
}

.proposal-details {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  display: grid;
  gap: 0.25rem;
}

.ai-success {
  border: 1px solid var(--color-success);
  border-radius: var(--radius-medium);
  padding: 1rem 1.25rem;
  background: var(--color-success-soft);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.ai-success p {
  margin: 0;
  color: var(--color-success);
  font-weight: 600;
}

.error {
  margin: 0;
  color: var(--color-danger);
}

footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.secondary {
  background: #fff;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}
</style>

