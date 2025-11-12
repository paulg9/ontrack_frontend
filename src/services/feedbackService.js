import { post } from './apiClient'

const extractResults = (response) => response?.results ?? []

export const recomputeSummary = (payload) => post('/Feedback/recompute', payload)

export const recordMessage = (payload) => post('/Feedback/recordMessage', payload)

export const sendReminder = (payload) => post('/Feedback/sendReminder', payload)

export const getSummaryMetrics = async (payload) => {
  const data = await post('/Feedback/_getSummaryMetrics', payload)
  return extractResults(data)
}

export const hasSentReminderToday = async (payload) => {
  const data = await post('/Feedback/_hasSentReminderToday', payload)
  return extractResults(data)
}

export const listMessages = async (payload) => {
  const data = await post('/Feedback/_listMessages', payload)
  return extractResults(data)
}

export const recordCompletion = (payload) => post('/Feedback/recordCompletion', payload)

export const getSharedSummaryMetrics = async (shareToken) => {
  const data = await post('/Feedback/_getSummaryMetrics', { shareToken })
  return extractResults(data)
}

