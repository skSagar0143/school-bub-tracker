import { api, clearSession } from './api'

export type AuthUser = {
  id: string
  fullName: string
  email: string
  role: string
  createdAt: string
}

export type AuthResponse = {
  tokenType: string
  accessToken: string
  refreshToken: string
  expiresInSeconds: number
  user: AuthUser
}

function saveSession(result: AuthResponse) {
  sessionStorage.setItem('bus_access_token', result.accessToken)
  sessionStorage.setItem('bus_refresh_token', result.refreshToken)
  return result.user
}

export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
  return saveSession(data)
}

export async function register(fullName: string, email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/register', { fullName, email, password })
  return saveSession(data)
}

export async function getCurrentUser() {
  const { data } = await api.get<AuthUser>('/auth/me')
  return data
}

export async function logout() {
  const refreshToken = sessionStorage.getItem('bus_refresh_token')
  try {
    await api.post('/auth/logout', { refreshToken })
  } finally {
    clearSession()
  }
}
