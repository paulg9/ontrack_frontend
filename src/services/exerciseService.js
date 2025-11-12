import { post } from './apiClient'

const extractResults = (response) => response?.results ?? []

export const listExercises = async (payload) => {
  const data = await post('/ExerciseLibrary/_listExercises', payload)
  return extractResults(data)
}

export const getExerciseById = async (payload) => {
  const data = await post('/ExerciseLibrary/_getExerciseById', payload)
  return extractResults(data)
}

export const addExercise = (payload) => post('/ExerciseLibrary/addExercise', payload)

export const addExerciseDraft = (payload) =>
  post('/ExerciseLibrary/addExerciseDraft', payload)

export const updateExercise = (payload) => post('/ExerciseLibrary/updateExercise', payload)

export const deprecateExercise = (payload) =>
  post('/ExerciseLibrary/deprecateExercise', payload)

export const listProposals = async (payload = {}) => {
  const data = await post('/ExerciseLibrary/_listProposals', payload)
  return extractResults(data)
}

export const getProposalsForExercise = async (payload) => {
  const data = await post('/ExerciseLibrary/_getProposalsForExercise', payload)
  return extractResults(data)
}

export const proposeDetails = (payload) => post('/ExerciseLibrary/proposeDetails', payload)

export const applyDetails = (payload) => post('/ExerciseLibrary/applyDetails', payload)

export const discardDetails = (payload) => post('/ExerciseLibrary/discardDetails', payload)

