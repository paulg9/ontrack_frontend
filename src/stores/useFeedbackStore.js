import { defineStore } from 'pinia'
import {
  getSummaryMetrics,
  hasSentReminderToday,
  listMessages,
  recordCompletion,
  recordMessage,
  recomputeSummary,
  sendReminder,
} from '../services/feedbackService'
import { createShareLink, listShareLinks, revokeShareLink } from '../services/userService'
import { useAuthStore } from './useAuthStore'

export const useFeedbackStore = defineStore('feedback', {
  state: () => ({
    summary: null,
    reminders: [],
    loading: false,
    error: '',
    shareLinks: [],
    reminderStatus: null,
  }),
  actions: {
    async refreshSummary() {
      const auth = useAuthStore()
      if (!auth.userId) {
        this.summary = null
        return
      }
      this.loading = true
      this.error = ''
      try {
        const [row] = await getSummaryMetrics(auth.userId)
        this.summary = row || null
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    async loadMessages() {
      const auth = useAuthStore()
      if (!auth.userId) {
        this.reminders = []
        return
      }
      this.loading = true
      this.error = ''
      try {
        const rows = await listMessages(auth.userId)
        this.reminders = rows || []
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    async recompute(payload) {
      const auth = useAuthStore()
      if (!auth.userId) throw new Error('Sign in required')
      this.loading = true
      this.error = ''
      try {
        const result = await recomputeSummary({ owner: auth.userId, ...payload })
        this.summary = {
          streakCount: result.newStreakCount,
          completion7d: result.newCompletion7d,
        }
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    async recordReminder(payload) {
      const auth = useAuthStore()
      if (!auth.userId) throw new Error('Sign in required')
      this.loading = true
      this.error = ''
      try {
        const result = await recordMessage({ owner: auth.userId, ...payload })
        this.reminders.unshift({
          _id: result.messageId,
          owner: auth.userId,
          timestamp: new Date().toISOString(),
          ...payload,
        })
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    async triggerReminder() {
      const auth = useAuthStore()
      if (!auth.userId) throw new Error('Sign in required')
      this.loading = true
      this.error = ''
      try {
        await sendReminder(auth.userId)
        this.reminderStatus = 'sent'
        await this.loadMessages()
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    async checkReminderStatus(dateISO) {
      const auth = useAuthStore()
      if (!auth.userId) return
      try {
        const [row] = await hasSentReminderToday(auth.userId, dateISO)
        this.reminderStatus = row?.sent ? 'sent' : 'not-sent'
      } catch (error) {
        this.error = error.message
      }
    },
    async createShareLink(ttlSeconds = 604800) {
      const auth = useAuthStore()
      if (!auth.userId) throw new Error('Sign in required')
      this.loading = true
      this.error = ''
      try {
        const result = await createShareLink({ owner: auth.userId, ttlSeconds })
        await this.loadShareLinks()
        return result.token
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    async revokeShareLink(token) {
      const auth = useAuthStore()
      if (!auth.userId) return
      const targetToken = token || this.shareLinks?.[0]?.token
      if (!targetToken) return
      this.loading = true
      this.error = ''
      try {
        await revokeShareLink({ owner: auth.userId, token: targetToken })
        await this.loadShareLinks()
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    async loadShareLinks() {
      const auth = useAuthStore()
      if (!auth.userId) {
        this.shareLinks = []
        return
      }
      this.loading = true
      this.error = ''
      try {
        const rows = await listShareLinks(auth.userId)
        this.shareLinks = rows || []
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    async recordCompletionStatus(completedAll) {
      const auth = useAuthStore()
      if (!auth.userId) return
      try {
        const date = new Date().toISOString().slice(0, 10)
        const result = await recordCompletion({ owner: auth.userId, date, completedAll })
        if (result) {
          this.summary = {
            streakCount: result.streakCount ?? this.summary?.streakCount ?? 0,
            completion7d: result.completion7d ?? this.summary?.completion7d ?? 0,
          }
        } else {
          await this.refreshSummary()
        }
      } catch (error) {
        this.error = error.message
      }
    },
  },
})

