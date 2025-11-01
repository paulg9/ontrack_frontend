import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  addPlanItem,
  createPlan,
  getActivePlanByOwner,
  removePlanItem,
} from '../services/planService'
import { useAuthStore } from './useAuthStore'

export const usePlanStore = defineStore('plan', () => {
  const authStore = useAuthStore()
  const planId = ref(null)
  const items = ref([])
  const loading = ref(false)
  const error = ref('')

  const ownerId = computed(() => authStore.userId)

  const reset = () => {
    planId.value = null
    items.value = []
  }

  const loadActivePlan = async () => {
    if (!ownerId.value) {
      reset()
      return
    }
    loading.value = true
    error.value = ''
    try {
      const rows = await getActivePlanByOwner(ownerId.value)
      const activePlan = rows?.[0]
      if (activePlan) {
        planId.value = activePlan._id
        items.value = activePlan.items || []
      } else {
        const { plan } = await createPlan({ actor: ownerId.value, owner: ownerId.value })
        planId.value = plan
        items.value = []
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const ensureInitialized = async () => {
    if (!ownerId.value) {
      throw new Error('Please sign in to load your plan.')
    }
    if (!planId.value) {
      await loadActivePlan()
    }
  }

  const addItem = async (payload) => {
    await ensureInitialized()
    const body = { ...payload, plan: planId.value, actor: ownerId.value }
    loading.value = true
    error.value = ''
    try {
      await addPlanItem(body)
      await loadActivePlan()
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeItemByExercise = async (exerciseId) => {
    if (!planId.value) return
    loading.value = true
    error.value = ''
    try {
      await removePlanItem({ actor: ownerId.value, plan: planId.value, exercise: exerciseId })
      await loadActivePlan()
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    planId,
    items,
    loading,
    error,
    ownerId,
    ensureInitialized,
    loadActivePlan,
    addItem,
    removeItemByExercise,
    reset,
  }
})

