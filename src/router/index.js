import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/DailyPlanView.vue'),
  },
  {
    path: '/exercise/:id',
    name: 'exercise-detail',
    component: () => import('../views/ExerciseDetailView.vue'),
    props: true,
  },
  {
    path: '/check-in',
    name: 'check-in',
    component: () => import('../views/CheckInView.vue'),
  },
  {
    path: '/progress',
    name: 'progress',
    component: () => import('../views/ProgressView.vue'),
  },
  {
    path: '/progress/share/:token',
    name: 'progress-share',
    component: () => import('../views/ProgressShareView.vue'),
    props: true,
  },
  {
    path: '/reminders',
    name: 'reminders',
    component: () => import('../views/RemindersView.vue'),
  },
  {
    path: '/build-plan',
    name: 'build-plan',
    component: () => import('../views/BuildPlanView.vue'),
  },
  {
    path: '/exercise-library',
    name: 'exercise-library',
    component: () => import('../views/ExerciseLibraryView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

