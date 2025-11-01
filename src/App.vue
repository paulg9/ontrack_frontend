<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/useAuthStore'
import { usePlanStore } from './stores/usePlanStore'
import { useCheckInsStore } from './stores/useCheckInsStore'
import { useFeedbackStore } from './stores/useFeedbackStore'
import { useExercisesStore } from './stores/useExercisesStore'

const isNavOpen = ref(false)
const showUserMenu = ref(false)
const showAuthModal = ref(false)
const authMode = ref('login')
const route = useRoute()

const authStore = useAuthStore()
const planStore = usePlanStore()
const checkInsStore = useCheckInsStore()
const feedbackStore = useFeedbackStore()
const exercisesStore = useExercisesStore()

const authForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  error: '',
  isSubmitting: false,
})

onMounted(() => {
  authStore.restoreSession()
})

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated) {
      planStore.reset()
      checkInsStore.$reset()
      feedbackStore.$reset()
      exercisesStore.$reset()
    }
  },
)

const navItems = computed(() => {
  const items = [
    { to: '/', label: 'Today' },
    { to: '/check-in', label: 'Check In' },
    { to: '/progress', label: 'Progress' },
    { to: '/reminders', label: 'Reminders' },
    { to: '/build-plan', label: 'Build Plan' },
  ]
  if (authStore.isAdmin) {
    items.push({ to: '/exercise-library', label: 'Exercise Library' })
  }
  return items
})

const isAuthenticated = computed(() => authStore.isAuthenticated)
const userInitial = computed(() => authStore.username?.[0]?.toUpperCase() || 'U')

const toggleNav = () => {
  isNavOpen.value = !isNavOpen.value
}

const closeOverlays = () => {
  isNavOpen.value = false
  showUserMenu.value = false
}

const openAuthModal = (mode = 'login') => {
  authMode.value = mode
  authForm.username = authStore.username || ''
  authForm.password = ''
  authForm.confirmPassword = ''
  authForm.error = ''
  showAuthModal.value = true
  showUserMenu.value = false
}

const closeAuthModal = () => {
  if (authForm.isSubmitting) return
  showAuthModal.value = false
}

const submitAuth = async () => {
  authForm.isSubmitting = true
  authForm.error = ''
  try {
    if (!authForm.username.trim() || !authForm.password) {
      throw new Error('Username and password are required.')
    }
    if (authMode.value === 'register' && authForm.password !== authForm.confirmPassword) {
      throw new Error('Passwords do not match.')
    }
    if (authMode.value === 'login') {
      await authStore.login({
        username: authForm.username.trim(),
        password: authForm.password,
      })
    } else {
      await authStore.register({
        username: authForm.username.trim(),
        password: authForm.password,
        isAdmin: false,
      })
    }
    showAuthModal.value = false
  } catch (error) {
    authForm.error = error.message
  } finally {
    authForm.isSubmitting = false
  }
}

const handleSignOut = async () => {
  await authStore.logout()
  closeOverlays()
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="header-left">
        <button class="menu-button" type="button" @click="toggleNav">☰</button>
        <router-link class="brand" to="/" @click="closeOverlays">OnTrack</router-link>
      </div>
      <div class="header-right">
        <div class="user-menu" @click.stop>
          <button
            v-if="isAuthenticated"
            class="avatar"
            type="button"
            @click="toggleUserMenu"
          >
            {{ userInitial }}
          </button>
          <button v-else class="auth-button" type="button" @click="openAuthModal('login')">
            Sign in
          </button>

          <transition name="fade-dropdown">
            <div v-if="showUserMenu" class="user-dropdown">
              <p class="user-line">
                Signed in as
                <strong>{{ authStore.username }}</strong>
              </p>
              <p class="user-line role">
                Role: {{ authStore.isAdmin ? 'Administrator' : 'Athlete' }}
              </p>
              <button type="button" class="signout" @click="handleSignOut">Sign out</button>
            </div>
          </transition>
        </div>
      </div>
    </header>

    <aside class="app-nav" :class="{ open: isNavOpen }">
      <nav>
        <ul>
          <li v-for="item in navItems" :key="item.to">
            <router-link
              :to="item.to"
              :class="{ active: route.path === item.to }"
              @click="closeOverlays"
            >
              {{ item.label }}
            </router-link>
          </li>
        </ul>
      </nav>
    </aside>

    <main class="app-main" @click="closeOverlays">
      <router-view />
    </main>

    <transition name="fade">
      <div v-if="showAuthModal" class="auth-overlay" @click.self="closeAuthModal">
        <div class="auth-modal">
          <header>
            <h2>{{ authMode === 'login' ? 'Sign in' : 'Create account' }}</h2>
            <button type="button" class="icon" @click="closeAuthModal">✕</button>
          </header>
          <form @submit.prevent="submitAuth">
            <label>
              Username
              <input v-model="authForm.username" type="text" autocomplete="username" required />
            </label>
            <label>
              Password
              <input v-model="authForm.password" type="password" autocomplete="current-password" required />
            </label>
            <label v-if="authMode === 'register'">
              Confirm password
              <input v-model="authForm.confirmPassword" type="password" autocomplete="new-password" required />
            </label>
            <p v-if="authForm.error" class="error">{{ authForm.error }}</p>
            <button type="submit" :disabled="authForm.isSubmitting">
              {{ authForm.isSubmitting ? 'Submitting…' : authMode === 'login' ? 'Sign in' : 'Create account' }}
            </button>
          </form>
          <footer>
            <button
              type="button"
              class="link"
              @click="openAuthModal(authMode === 'login' ? 'register' : 'login')"
            >
              {{ authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in' }}
            </button>
          </footer>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
  background: var(--color-bg-app);
  color: var(--color-text-primary);
}

.app-header {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: var(--color-text-primary);
  color: #fff;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brand {
  font-size: 1.25rem;
  font-weight: 600;
  color: inherit;
  text-decoration: none;
}

.menu-button {
  display: none;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: inherit;
  cursor: pointer;
}

.app-nav {
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  padding: 1.5rem 1rem;
}

.app-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.app-nav a {
  display: block;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  color: inherit;
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease;
}

.app-nav a:hover {
  background: var(--color-accent-soft);
}

.app-nav a.active {
  background: var(--color-accent);
  color: #fff;
}

.app-main {
  padding: 2rem;
}

.user-menu {
  position: relative;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.auth-button {
  border-radius: 999px;
  padding: 0.45rem 1.1rem;
  font-weight: 600;
  background: #fff;
  color: var(--color-text-primary);
  border: none;
  cursor: pointer;
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 200px;
  background: #fff;
  color: var(--color-text-primary);
  border-radius: var(--radius-medium);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.16);
  padding: 1rem;
  display: grid;
  gap: 0.5rem;
  z-index: 20;
}

.user-line {
  margin: 0;
  font-size: 0.95rem;
}

.role {
  color: #51627a;
}

.signout {
  border-radius: 999px;
  border: none;
  padding: 0.5rem 1rem;
  font-weight: 600;
  background: var(--color-danger);
  color: #fff;
  cursor: pointer;
}

.fade-dropdown-enter-active,
.fade-dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-dropdown-enter-from,
.fade-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.auth-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  z-index: 50;
}

.auth-modal {
  background: #fff;
  color: var(--color-text-primary);
  border-radius: var(--radius-large);
  width: min(420px, 100%);
  padding: 2rem;
  display: grid;
  gap: 1.25rem;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.22);
}

.auth-modal header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.auth-modal form {
  display: grid;
  gap: 1rem;
}

.auth-modal .icon {
  background: transparent;
  border: none;
  color: #51627a;
  font-size: 1.2rem;
  cursor: pointer;
}

.auth-modal .error {
  margin: 0;
  color: var(--color-danger);
}

.auth-modal footer {
  display: flex;
  justify-content: flex-end;
}

.auth-modal .link {
  background: none;
  border: none;
  color: var(--color-accent);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

@media (max-width: 900px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .menu-button {
    display: inline-flex;
  }

  .app-nav {
    position: absolute;
    z-index: 10;
    top: 64px;
    left: 0;
    bottom: 0;
    width: 220px;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.2);
  }

  .app-nav.open {
    transform: translateX(0);
  }

  .app-main {
    padding: 1.5rem;
  }
}
</style>
