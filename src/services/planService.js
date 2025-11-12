import { post } from './apiClient'

const extractResults = (response) => response?.results ?? []

export const createPlan = (payload) => post('/RehabPlan/createPlan', payload)

export const addPlanItem = (payload) => post('/RehabPlan/addPlanItem', payload)

export const removePlanItem = (payload) => post('/RehabPlan/removePlanItem', payload)

export const archivePlan = (payload) => post('/RehabPlan/archivePlan', payload)

export const getActivePlanByOwner = async (payload) => {
  const data = await post('/RehabPlan/_getActivePlanByOwner', payload)
  return extractResults(data)
}

