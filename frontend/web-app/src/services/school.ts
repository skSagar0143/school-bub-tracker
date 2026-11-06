import { api } from './api'

export type SchoolStatus = 'ACTIVE' | 'INACTIVE'

export type School = {
  id: number
  name: string
  code: string
  email: string | null
  phone: string | null
  website: string | null
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  pincode: string
  country: string
  status: SchoolStatus
  createdAt: string
  updatedAt: string
}

export type SchoolPayload = Omit<School, 'id' | 'status' | 'createdAt' | 'updatedAt'>

export async function getSchools() {
  const { data } = await api.get<School[]>('/schools')
  return data
}

export async function createSchool(payload: SchoolPayload) {
  const { data } = await api.post<School>('/schools', payload)
  return data
}

export async function updateSchool(id: number, payload: SchoolPayload) {
  const { data } = await api.put<School>(`/schools/${id}`, payload)
  return data
}

export async function updateSchoolStatus(id: number, status: SchoolStatus) {
  const { data } = await api.patch<School>(`/schools/${id}/status`, { status })
  return data
}
