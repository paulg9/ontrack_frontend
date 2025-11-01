<script setup>
import { computed, onMounted, reactive, watch } from 'vue'
import { useFeedbackStore } from '../stores/useFeedbackStore'
import { useAuthStore } from '../stores/useAuthStore'

const feedbackStore = useFeedbackStore()
const authStore = useAuthStore()

const form = reactive({
  kind: 'reminder',
  text: '',
  error: '',
  isSubmitting: false,
})

const isAuthenticated = computed(() => authStore.isAuthenticated)

const submitManualReminder = async () => {
  if (!form.text.trim()) return
  form.isSubmitting = true
  form.error = ''
  try {
    await feedbackStore.recordReminder({ kind: form.kind, text: form.text.trim() })
    form.text = ''
  } catch (error) {
    form.error = error.message
  } finally {
    form.isSubmitting = false
  }
}

const triggerSystemReminder = async () => {
  try {
    await feedbackStore.triggerReminder()
  } catch (error) {
    console.error(error)
  }
}

onMounted(async () => {
  if (isAuthenticated.value) {
    await feedbackStore.loadMessages()
  }
})

watch(isAuthenticated, async (next) => {
  if (next) {
    await feedbackStore.loadMessages()
  }
})
</script>

<template>
  <section class="reminders-view">
    <header>
      <h1>Reminders & nudges</h1>
      <p>Messages that keep you accountable appear here.</p>
    </header>

    <article v-if="!isAuthenticated" class="card locked">
      <p>Sign in to view and record reminders.</p>
    </article>

    <article v-else class="card">
      <h2>Send yourself a reminder</h2>
      <form @submit.prevent="submitManualReminder" class="form">
        <label>
          Type
          <select v-model="form.kind">
            <option value="reminder">Reminder</option>
            <option value="motivation">Motivation</option>
            <option value="summary">Summary</option>
          </select>
        </label>
        <label>
          Message
          <textarea
            v-model="form.text"
            rows="5"
            placeholder="Don’t forget your evening stretch."
          />
        </label>
        <button type="submit" :disabled="form.isSubmitting">
          {{ form.isSubmitting ? 'Sending…' : 'Record message' }}
        </button>
        <p v-if="form.error" class="error">{{ form.error }}</p>
      </form>
    </article>

    <article v-if="isAuthenticated" class="card">
      <div class="card-header">
        <h2>Recent reminders</h2>
        <button type="button" class="secondary" @click="triggerSystemReminder">
          Trigger system reminder
        </button>
      </div>
      <ul v-if="feedbackStore.reminders.length" class="reminder-list">
        <li v-for="reminder in feedbackStore.reminders" :key="reminder._id">
          <span class="kind">{{ reminder.kind }}</span>
          <p>{{ reminder.text }}</p>
          <time>{{ (reminder.timestamp || reminder.createdAt)?.slice(0, 16).replace('T', ' ') ?? 'Just now' }}</time>
        </li>
      </ul>
      <p v-else class="empty">No reminders yet. Record one to get started.</p>
    </article>
  </section>
</template>

<style scoped>
.locked {
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #5b708f;
}
.reminders-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

header h1 {
  margin: 0;
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

.form {
  display: grid;
  gap: 1rem;
}

.form textarea {
  resize: vertical;
}

.error {
  color: var(--color-danger);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.secondary {
  background: var(--color-success);
  color: #fff;
  border: none;
  box-shadow: 0 12px 24px rgba(10, 173, 61, 0.25);
}

.reminder-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 1rem;
}

.reminder-list li {
  background: var(--color-accent-soft);
  border-radius: 1rem;
  padding: 1rem;
  display: grid;
  gap: 0.35rem;
}

.kind {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: var(--color-accent);
  font-weight: 600;
}

time {
  font-size: 0.8rem;
  color: #64768d;
}

.empty {
  color: #5b708f;
}
</style>

