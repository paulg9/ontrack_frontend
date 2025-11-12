import { post } from './apiClient'

const extractResults = (response) => response?.results ?? []

export const submitCheckIn = (payload) => post('/CheckIn/submit', payload)

export const amendCheckIn = (payload) => post('/CheckIn/amend', payload)

export const getCheckInByOwnerAndDate = async (payload) => {
  const data = await post('/CheckIn/_getCheckInByOwnerAndDate', payload)
  return extractResults(data)
}

export const getCheckInsByOwner = async (payload) => {
  const data = await post('/CheckIn/_getCheckInsByOwner', payload)
  return extractResults(data)
}

export const getCheckInById = async (payload) => {
  const data = await post('/CheckIn/_getCheckInById', payload)
  return extractResults(data)
}

export const hasCheckIn = async (payload) => {
  const data = await post('/CheckIn/_hasCheckIn', payload)
  return extractResults(data)
}

export const getSharedCheckIns = async (shareToken) => {
  const data = await post('/CheckIn/_getCheckInsByOwner', { shareToken })
  return extractResults(data)
}

