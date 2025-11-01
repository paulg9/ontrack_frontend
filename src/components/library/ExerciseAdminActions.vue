<script setup>
import { ref } from 'vue'
import { useExercisesStore } from '../../stores/useExercisesStore'

const props = defineProps({
  exerciseId: {
    type: String,
    required: true,
  },
  deprecated: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['updated'])

const store = useExercisesStore()
const isProcessing = ref(false)
const error = ref('')

const confirmDeprecate = async () => {
  const shouldDeprecate = window.confirm(
    'Deprecating this exercise will hide it from plan builders. Continue?',
  )
  if (!shouldDeprecate) return

  isProcessing.value = true
  error.value = ''
  try {
    await store.deprecateExercise(props.exerciseId)
    emit('updated')
  } catch (err) {
    error.value = err.message
  } finally {
    isProcessing.value = false
  }
}

</script>

<template>
  <div class="admin-actions">
    <button
      v-if="!deprecated"
      type="button"
      class="danger"
      :disabled="isProcessing"
      @click="confirmDeprecate"
    >
      {{ isProcessing ? 'Deprecating…' : 'Deprecate' }}
    </button>
    <p v-else class="info">Deprecated exercise</p>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.admin-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.danger {
  background: var(--color-danger);
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 0.4rem 1rem;
  font-weight: 600;
}

.outline {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  border-radius: 999px;
  padding: 0.4rem 1rem;
  font-weight: 600;
}

.info {
  margin: 0;
  color: var(--color-danger);
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
}

.error {
  margin: 0;
  font-size: 0.85rem;
  color: #d14343;
}
</style>

