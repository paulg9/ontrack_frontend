import { post } from './apiClient'

export const submitCheckIn = (payload) => post('/CheckIn/submit', payload)

export const amendCheckIn = (payload) => post('/CheckIn/amend', payload)

export const getCheckInByOwnerAndDate = (owner, date) =>
  post('/CheckIn/_getCheckInByOwnerAndDate', { owner, date })

export const getCheckInsByOwner = (owner) =>
  post('/CheckIn/_getCheckInsByOwner', { owner })

export const getCheckInById = (checkin) => post('/CheckIn/_getCheckInById', { checkin })

export const hasCheckIn = (owner, date) => post('/CheckIn/_hasCheckIn', { owner, date })

