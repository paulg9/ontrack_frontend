import { post } from './apiClient'

export const recomputeSummary = (payload) => post('/Feedback/recompute', payload)

export const recordMessage = (payload) => post('/Feedback/recordMessage', payload)

export const sendReminder = (owner) => post('/Feedback/sendReminder', { owner })

export const getSummaryMetrics = (owner) =>
  post('/Feedback/_getSummaryMetrics', { owner })

export const hasSentReminderToday = (owner, date) =>
  post('/Feedback/_hasSentReminderToday', { owner, date })

export const listMessages = (owner) => post('/Feedback/_listMessages', { owner })

export const recordCompletion = (payload) => post('/Feedback/recordCompletion', payload)

