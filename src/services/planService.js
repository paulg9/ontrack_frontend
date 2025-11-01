import { post } from './apiClient'

export const createPlan = ({ actor, owner }) =>
  post('/RehabPlan/createPlan', { actor, owner })

export const addPlanItem = (payload) => post('/RehabPlan/addPlanItem', payload)

export const removePlanItem = ({ actor, plan, exercise }) =>
  post('/RehabPlan/removePlanItem', { actor, plan, exercise })

export const archivePlan = ({ actor, plan }) => post('/RehabPlan/archivePlan', { actor, plan })

export const getActivePlanByOwner = (owner) =>
  post('/RehabPlan/_getActivePlanByOwner', { owner })

