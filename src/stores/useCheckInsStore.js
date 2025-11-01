import { defineStore } from 'pinia'
import {
  amendCheckIn,
  getCheckInByOwnerAndDate,
  getCheckInsByOwner,
  hasCheckIn,
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
      if (!auth.userId) {
        this.today = null
        return
      }
      this.loading = true
      this.error = ''
      try {
        const [row] = await getCheckInByOwnerAndDate(auth.userId, todayISO())
        this.today = row || null
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    async submit(payload) {
      const auth = useAuthStore()
      if (!auth.userId) throw new Error('Sign in required to submit a check-in.')
      const body = {
        actor: auth.userId,
        owner: auth.userId,
        date: todayISO(),
        ...payload,
      }
      this.loading = true
      this.error = ''
      try {
        const result = await submitCheckIn(body)
        this.today = { _id: result.checkin, ...body }
        return result.checkin
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    async amend(update) {
      if (!this.today?._id) return
      this.loading = true
      this.error = ''
      try {
        await amendCheckIn({ actor: this.today.owner, checkin: this.today._id, ...update })
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
      if (!auth.userId) {
        this.history = []
        return
      }
      this.loading = true
      this.error = ''
      try {
        const rows = await getCheckInsByOwner(auth.userId)
        this.history = rows || []
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
  },
})

