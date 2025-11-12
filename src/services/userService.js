import { post } from './apiClient'

const extractResults = (response) => response?.results ?? []

export const registerUser = (payload) => post('/UserAccount/register', payload)

export const loginUser = (payload) => post('/UserAccount/login', payload)

export const logoutUser = (session) => post('/UserAccount/logout', { session })

export const getUserBySession = async (session) => {
  const data = await post('/UserAccount/_getUserByToken', { session })
  return extractResults(data)
}

export const isAdmin = async (session) => {
  const data = await post('/UserAccount/_isAdmin', { session })
  return extractResults(data)
}

export const isSignedIn = async (session) => {
  const data = await post('/UserAccount/_isSignedIn', { session })
  return extractResults(data)
}

export const setReminderTime = (payload) => post('/UserAccount/setReminderTime', payload)

export const createShareLink = (payload) => post('/UserAccount/createShareLink', payload)

export const revokeShareLink = (payload) => post('/UserAccount/revokeShareLink', payload)

export const listShareLinks = async (session) => {
  const data = await post('/UserAccount/_listShareLinks', { session })
  return extractResults(data)
}

export const resolveShareLink = (token) => post('/UserAccount/_resolveShareLink', { token })

