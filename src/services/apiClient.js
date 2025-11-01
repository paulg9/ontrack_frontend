import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error || error.message || 'Unexpected error occurred'
    return Promise.reject(new Error(message))
  },
)

export const post = async (path, payload) => {
  const { data } = await apiClient.post(path, payload)
  return data
}

