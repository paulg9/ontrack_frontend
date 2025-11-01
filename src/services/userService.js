import { post } from './apiClient'

export const registerUser = (payload) => post('/UserAccount/register', payload)

export const loginUser = (payload) => post('/UserAccount/login', payload)

export const logoutUser = (token) => post('/UserAccount/logout', { token })

export const getUserByToken = (token) => post('/UserAccount/_getUserByToken', { token })

export const isAdmin = (user) => post('/UserAccount/_isAdmin', { user })

export const isSignedIn = (token) => post('/UserAccount/_isSignedIn', { token })

export const setReminderTime = (payload) => post('/UserAccount/setReminderTime', payload)

export const createShareLink = (payload) => post('/UserAccount/createShareLink', payload)

export const revokeShareLink = (payload) => post('/UserAccount/revokeShareLink', payload)

export const listShareLinks = (owner) => post('/UserAccount/_listShareLinks', { owner })

export const resolveShareLink = (token) => post('/UserAccount/_resolveShareLink', { token })

