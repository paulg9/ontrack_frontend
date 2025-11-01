import { defineStore } from 'pinia'
import {
  getUserByToken,
  isAdmin as fetchIsAdmin,
  isSignedIn,
  loginUser,
  logoutUser,
  registerUser,
} from '../services/userService'

const DEFAULT_ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || 'admin'
const DEFAULT_ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

const STORAGE_KEY = 'ontrack.session'

const loadPersisted = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.warn('Failed to parse stored session', error)
    return null
  }
}

const persist = (payload) => {
  try {
    if (!payload) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    }
  } catch (error) {
    console.warn('Failed to persist session', error)
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    userId: null,
    username: '',
    isAdmin: false,
    loading: false,
    error: '',
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token && state.userId),
  },
  actions: {
    async resolveToken(token, fallbackUsername = '') {
      const userRows = await getUserByToken(token)
      const userId = userRows?.[0]?.user
      if (!userId) {
        throw new Error('Unable to resolve user from token')
      }
      const adminRows = await fetchIsAdmin(userId)
      const isAdmin = Boolean(adminRows?.[0]?.isAdmin)
      const usernameToStore = fallbackUsername || this.username || ''
      this.setSession({ token, userId, username: usernameToStore, isAdmin })
    },
    setSession({ token, userId, username, isAdmin }) {
      this.token = token
      this.userId = userId
      this.username = username
      this.isAdmin = Boolean(isAdmin)
      persist({ token: this.token, username: this.username })
    },
    clearSession() {
      this.token = null
      this.userId = null
      this.username = ''
      this.isAdmin = false
      persist(null)
    },
    async restoreSession() {
      this.loading = true
      this.error = ''
      try {
        const stored = loadPersisted()
        if (stored?.token) {
          try {
            const signInRows = await isSignedIn(stored.token)
            const signedIn = signInRows?.[0]?.signedIn
            if (signedIn) {
              await this.resolveToken(stored.token, stored.username)
              return
            }
            this.clearSession()
          } catch (error) {
            console.error('Failed to restore persisted session', error)
            this.clearSession()
          }
        }

        if (this.isAuthenticated) {
          return
        }

        const adminUser = DEFAULT_ADMIN_USERNAME
        const adminPassword = DEFAULT_ADMIN_PASSWORD
        if (!adminUser || !adminPassword) {
          return
        }

        try {
          const { token } = await loginUser({ username: adminUser, password: adminPassword })
          await this.resolveToken(token, adminUser)
          return
        } catch (loginError) {
          try {
            await registerUser({ username: adminUser, password: adminPassword, isAdmin: true })
            const { token } = await loginUser({
              username: adminUser,
              password: adminPassword,
            })
            await this.resolveToken(token, adminUser)
          } catch (bootstrapError) {
            console.warn('Auto admin bootstrap failed', bootstrapError)
            this.clearSession()
          }
        }
      } finally {
        this.loading = false
      }
    },
    async login({ username, password }) {
      this.loading = true
      this.error = ''
      try {
        const { token } = await loginUser({ username, password })
        await this.resolveToken(token, username)
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    async register({ username, password, isAdmin = false }) {
      this.loading = true
      this.error = ''
      try {
        await registerUser({ username, password, isAdmin })
        await this.login({ username, password })
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    async logout() {
      if (!this.token) {
        this.clearSession()
        return
      }
      this.loading = true
      this.error = ''
      try {
        await logoutUser(this.token)
      } catch (error) {
        console.warn('Logout error', error)
      } finally {
        this.loading = false
        this.clearSession()
      }
    },
  },
})

