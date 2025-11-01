import { post } from './apiClient'

export const listExercises = (includeDeprecated = false) =>
  post('/ExerciseLibrary/_listExercises', { includeDeprecated })

export const getExerciseById = (exercise) =>
  post('/ExerciseLibrary/_getExerciseById', { exercise })

export const addExercise = (payload) =>
  post('/ExerciseLibrary/addExercise', { ...payload, actorIsAdmin: true })

export const addExerciseDraft = (title) =>
  post('/ExerciseLibrary/addExerciseDraft', { title, actorIsAdmin: true })

export const updateExercise = (payload) =>
  post('/ExerciseLibrary/updateExercise', { ...payload, actorIsAdmin: true })

export const deprecateExercise = (exercise) =>
  post('/ExerciseLibrary/deprecateExercise', { exercise, actorIsAdmin: true })

export const listProposals = (status) =>
  post('/ExerciseLibrary/_listProposals', status ? { status } : {})

export const getProposalsForExercise = (exercise) =>
  post('/ExerciseLibrary/_getProposalsForExercise', { exercise })

export const proposeDetails = (exercise) =>
  post('/ExerciseLibrary/proposeDetails', { exercise, actorIsAdmin: true })

export const applyDetails = (proposal) =>
  post('/ExerciseLibrary/applyDetails', { proposal, actorIsAdmin: true })

export const discardDetails = (proposal) =>
  post('/ExerciseLibrary/discardDetails', { proposal, actorIsAdmin: true })

