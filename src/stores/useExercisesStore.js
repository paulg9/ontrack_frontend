import { defineStore } from 'pinia'
import {
  addExercise,
  addExerciseDraft,
  applyDetails,
  deprecateExercise,
  discardDetails,
  getExerciseById,
  getProposalsForExercise,
  listExercises,
  listProposals,
  proposeDetails,
  updateExercise,
} from '../services/exerciseService'
import { useAuthStore } from './useAuthStore'

const normalize = (arr = []) => arr.map((item) => ({ ...item }))

export const useExercisesStore = defineStore('exercises', {
  state: () => ({
    exercises: [],
    proposals: [],
    loading: false,
    error: '',
    lastLoadedAt: null,
  }),
  getters: {
    activeExercises(state) {
      return state.exercises.filter((exercise) => !exercise.deprecated)
    },
    findById: (state) => (id) =>
      state.exercises.find((exercise) => exercise._id === id) || null,
    proposalsByExercise: (state) => (exerciseId) =>
      state.proposals.filter((proposal) => proposal.exercise === exerciseId),
  },
  actions: {
    ensureAdmin() {
      const auth = useAuthStore()
      if (!auth.token) {
        throw new Error('Sign in required for this action.')
      }
      if (!auth.isAdmin) {
        throw new Error('Administrator privileges required for this action.')
      }
      return auth
    },
    async fetchExercises(options = { includeDeprecated: false }) {
      const auth = useAuthStore()
      if (!auth.token) {
        this.exercises = []
        return
      }
      this.loading = true
      this.error = ''
      try {
        const rows = await listExercises({
          session: auth.token,
          includeDeprecated: options.includeDeprecated,
        })
        this.exercises = normalize(rows)
        this.lastLoadedAt = new Date().toISOString()
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    async refreshExercise(id) {
      const auth = useAuthStore()
      if (!auth.token) return
      try {
        const [record] = await getExerciseById({ session: auth.token, exercise: id })
        if (record) {
          const index = this.exercises.findIndex((item) => item._id === id)
          if (index >= 0) {
            this.exercises.splice(index, 1, record)
          } else {
            this.exercises.push(record)
          }
        }
      } catch (error) {
        this.error = error.message
      }
    },
    async createExercise(exercise) {
      try {
        const auth = this.ensureAdmin()
        const result = await addExercise({ session: auth.token, ...exercise })
        await this.refreshExercise(result.exercise)
        return result.exercise
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    async createDraft(title) {
      try {
        const auth = this.ensureAdmin()
        const result = await addExerciseDraft({ session: auth.token, title })
        return result.exercise
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    async saveExercise(update) {
      try {
        const auth = this.ensureAdmin()
        await updateExercise({ session: auth.token, ...update })
        await this.refreshExercise(update.exercise)
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    async fetchProposals({ status, exerciseId } = {}) {
      try {
        const auth = useAuthStore()
        if (!auth.token) {
          this.proposals = []
          return
        }
        if (exerciseId) {
          const rows = await getProposalsForExercise({
            session: auth.token,
            exercise: exerciseId,
          })
          this.proposals = [
            ...this.proposals.filter((p) => p.exercise !== exerciseId),
            ...normalize(rows),
          ]
        } else {
          this.proposals = normalize(
            await listProposals(
              status ? { session: auth.token, status } : { session: auth.token },
            ),
          )
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    async requestProposal(exerciseId) {
      try {
        const auth = this.ensureAdmin()
        const result = await proposeDetails({ session: auth.token, exercise: exerciseId })
        await this.fetchProposals({ exerciseId })
        return result
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    async applyProposal(proposalId) {
      try {
        const auth = this.ensureAdmin()
        await applyDetails({ session: auth.token, proposal: proposalId })
        await this.fetchProposals()
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    async discardProposal(proposalId) {
      try {
        const auth = this.ensureAdmin()
        await discardDetails({ session: auth.token, proposal: proposalId })
        await this.fetchProposals()
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    async deprecateExercise(exerciseId) {
      try {
        const auth = this.ensureAdmin()
        await deprecateExercise({ session: auth.token, exercise: exerciseId })
        await this.refreshExercise(exerciseId)
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
  },
})

