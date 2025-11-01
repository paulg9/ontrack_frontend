<script setup>
import { computed, ref } from 'vue'
import { useExercisesStore } from '../../stores/useExercisesStore'

const props = defineProps({
  proposal: {
    type: Object,
    required: true,
  },
  state: {
    type: String,
    default: 'pending',
  },
  showActions: {
    type: Boolean,
    default: true,
  },
})

const store = useExercisesStore()
const isProcessing = ref(false)
const error = ref('')

const details = computed(() => ({
  cues: props.proposal.cues,
  videoUrl: props.proposal.videoUrl,
  confidence: props.proposal.confidence_0_1,
}))

const handleAction = async (action) => {
  isProcessing.value = true
  error.value = ''
  try {
    if (action === 'apply') {
      await store.applyProposal(props.proposal._id)
    } else if (action === 'discard') {
      await store.discardProposal(props.proposal._id)
    }
  } catch (err) {
    error.value = err.message
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <article class="proposal-card" :data-state="state">
    <header>
      <span class="state">{{ state }}</span>
      <span v-if="details.confidence !== undefined" class="confidence">
        Confidence: {{ Math.round(details.confidence * 100) }}%
      </span>
    </header>

    <dl>
      <div v-if="details.cues">
        <dt>Cues</dt>
        <dd>{{ details.cues }}</dd>
      </div>
      <div v-if="details.videoUrl">
        <dt>Video URL</dt>
        <dd>
          <a :href="details.videoUrl" target="_blank" rel="noreferrer">Open link</a>
        </dd>
      </div>
    </dl>

    <footer v-if="state === 'pending' && showActions">
      <button type="button" :disabled="isProcessing" @click="handleAction('apply')">
        Apply
      </button>
      <button
        type="button"
        class="secondary"
        :disabled="isProcessing"
        @click="handleAction('discard')"
      >
        Discard
      </button>
    </footer>

    <p v-if="error" class="error">{{ error }}</p>
  </article>
</template>

<style scoped>
.proposal-card {
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1rem;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
}

.proposal-card[data-state='pending'] {
  border-left: 4px solid var(--color-accent);
}

.proposal-card[data-state='applied'] {
  border-left: 4px solid var(--color-success);
}

.proposal-card[data-state='discarded'] {
  border-left: 4px solid var(--color-danger);
}

header {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #51627a;
}

.state {
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.confidence {
  font-weight: 500;
}

dl {
  margin: 0;
  display: grid;
  gap: 0.5rem;
}

dt {
  font-weight: 600;
  color: #334155;
}

dd {
  margin: 0.1rem 0 0;
  color: #4b5563;
}

footer {
  display: flex;
  gap: 0.75rem;
}

.secondary {
  background: #fff;
  color: #1f2933;
  border: 1px solid #c9d3ea;
}

.error {
  color: #d14343;
  margin: 0;
}
</style>

