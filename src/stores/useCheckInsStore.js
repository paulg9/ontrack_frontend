import { defineStore } from 'pinia'
import {
  amendCheckIn,
  getCheckInByOwnerAndDate,
  getCheckInsByOwner,
  submitCheckIn,
} from '../services/checkInService'
import { useAuthStore } from './useAuthStore'

const todayISO = () => new Date().toISOString().slice(0, 10)

export const useCheckInsStore = defineStore('checkins', {
  state: () => ({
    loading: false,
    error: '',
    today: null,
    history: [],
  }),
  getters: {
    todayCheckIn(state) {
      return state.today
    },
  },
  actions: {
    async loadToday() {
      const auth = useAuthStore()
      if (!auth.token) {
        this.today = null
        return
      }
      this.loading = true
      this.error = ''
      try {
        const [row] = await getCheckInByOwnerAndDate({
          session: auth.token,
          date: todayISO(),
        })
        this.today = row || null
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    async submit(payload) {
      const auth = useAuthStore()
      if (!auth.token || !auth.userId) throw new Error('Sign in required to submit a check-in.')
      const body = {
        session: auth.token,
        date: todayISO(),
        ...payload,
      }
      this.loading = true
      this.error = ''
      try {
        const result = await submitCheckIn(body)
        this.today = { _id: result.checkin, owner: auth.userId, ...payload, date: body.date }
        return result.checkin
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    async amend(update) {
      const auth = useAuthStore()
      if (!auth.token || !this.today?._id) return
      this.loading = true
      this.error = ''
      try {
        await amendCheckIn({ session: auth.token, checkin: this.today._id, ...update })
        this.today = { ...this.today, ...update }
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    async loadHistory() {
      const auth = useAuthStore()
      if (!auth.token) {
        this.history = []
        return
      }
      this.loading = true
      this.error = ''
      try {
        const rows = await getCheckInsByOwner({ session: auth.token })
        this.history = rows || []
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
  },
})

