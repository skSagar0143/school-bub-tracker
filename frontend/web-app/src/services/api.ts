import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/v1'

type RetryConfig = InternalAxiosRequestConfig & { _authRetry?: boolean }

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('bus_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshInFlight: Promise<string> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined
    const url = original?.url || ''
    const isAuthRequest = ['/auth/login', '/auth/register', '/auth/refresh'].some((path) => url.includes(path))

    if (error.response?.status !== 401 || !original || original._authRetry || isAuthRequest) {
      return Promise.reject(error)
    }

    const refreshToken = sessionStorage.getItem('bus_refresh_token')
    if (!refreshToken) {
      clearSession()
      return Promise.reject(error)
    }

    original._authRetry = true
    try {
      if (!refreshInFlight) {
        refreshInFlight = axios.post(`${baseURL}/auth/refresh`, { refreshToken })
          .then((response) => {
            const data = response.data as { accessToken: string; refreshToken: string }
            sessionStorage.setItem('bus_access_token', data.accessToken)
            sessionStorage.setItem('bus_refresh_token', data.refreshToken)
            return data.accessToken
          })
          .finally(() => { refreshInFlight = null })
      }
      const newAccessToken = await refreshInFlight
      original.headers.Authorization = `Bearer ${newAccessToken}`
      return api(original)
    } catch (refreshError) {
      clearSession()
      return Promise.reject(refreshError)
    }
  },
)

export function clearSession() {
  sessionStorage.removeItem('bus_access_token')
  sessionStorage.removeItem('bus_refresh_token')
  window.dispatchEvent(new Event('bus-auth-expired'))
}
