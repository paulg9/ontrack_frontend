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
      if (!auth.isAdmin) {
        throw new Error('Administrator privileges required for this action.')
      }
      return auth
    },
    async fetchExercises(options = { includeDeprecated: false }) {
      this.loading = true
      this.error = ''
      try {
        const rows = await listExercises(options.includeDeprecated)
        this.exercises = normalize(rows)
        this.lastLoadedAt = new Date().toISOString()
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    async refreshExercise(id) {
      try {
        const [record] = await getExerciseById(id)
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
        this.ensureAdmin()
        const result = await addExercise(exercise)
        await this.refreshExercise(result.exercise)
        return result.exercise
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    async createDraft(title) {
      try {
        this.ensureAdmin()
        const result = await addExerciseDraft(title)
        return result.exercise
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    async saveExercise(update) {
      try {
        this.ensureAdmin()
        await updateExercise(update)
        await this.refreshExercise(update.exercise)
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    async fetchProposals({ status, exerciseId } = {}) {
      try {
        if (exerciseId) {
          const rows = await getProposalsForExercise(exerciseId)
          this.proposals = [
            ...this.proposals.filter((p) => p.exercise !== exerciseId),
            ...normalize(rows),
          ]
        } else {
          this.proposals = normalize(await listProposals(status))
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    async requestProposal(exerciseId) {
      try {
        this.ensureAdmin()
        const result = await proposeDetails(exerciseId)
        await this.fetchProposals({ exerciseId })
        return result
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    async applyProposal(proposalId) {
      try {
        this.ensureAdmin()
        await applyDetails(proposalId)
        await this.fetchProposals()
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    async discardProposal(proposalId) {
      try {
        this.ensureAdmin()
        await discardDetails(proposalId)
        await this.fetchProposals()
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    async deprecateExercise(exerciseId) {
      try {
        this.ensureAdmin()
        await deprecateExercise(exerciseId)
        await this.refreshExercise(exerciseId)
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
  },
})

