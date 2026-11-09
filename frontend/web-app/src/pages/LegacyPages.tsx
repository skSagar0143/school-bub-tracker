
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/sm'

export type UserRole = 'SCHOOL_ADMIN' | 'DRIVER' | 'STUDENT' | 'PARENT'
export type ThemeMode = 'system' | 'dark' | 'light'
export type LoginUser = { id: string; fullName: string; email: string; role: UserRole; enabled: boolean }
export type LoginResponse = { tokenType: string; accessToken: string; refreshToken: string; expiresInSeconds: number; user: LoginUser }
export type Menu = { id: number; name: string; path: string | null; icon: string | null; sequences: number; subMenus: Menu[] }
export type MenuResponse = { role: UserRole; defaultPath: string; menus: Menu[] }
export type Driver = { id: string; fullName: string; email: string; role: UserRole; enabled: boolean; createdAt: string; updatedAt: string }
export type School = {
  id: number; name: string; code: string; email: string | null; phone: string | null; website: string | null
  addressLine1: string; addressLine2: string | null; city: string; state: string; pincode: string; country: string
  status: 'ACTIVE' | 'INACTIVE'; createdAt: string; updatedAt: string
}
export type SchoolForm = Omit<School, 'id' | 'status' | 'createdAt' | 'updatedAt'>
export type DriverForm = { fullName: string; email: string; password: string }
export type Student = {
  id: number; schoolId: number; firstName: string; lastName: string | null; admissionNumber: string
  dateOfBirth: string | null; gender: string | null; className: string; section: string | null; rollNumber: string | null
  parentName: string; parentPhone: string; parentEmail: string | null; emergencyContact: string | null
  address: string | null; status: 'ACTIVE' | 'INACTIVE'; createdAt: string; updatedAt: string
}
export type StudentForm = Omit<Student, 'id' | 'status' | 'createdAt' | 'updatedAt'>
export type Bus = {
  id: number; schoolId: number; busNumber: string; registrationNumber: string; model: string | null
  capacity: number; busType: string | null; fuelType: string | null; manufactureYear: number | null
  insuranceNumber: string | null; insuranceExpiryDate: string | null; fitnessExpiryDate: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'; createdAt: string; updatedAt: string
}
export type BusForm = Omit<Bus, 'id' | 'status' | 'createdAt' | 'updatedAt'>
export type SchoolRoute = {
  id: number; schoolId: number; routeCode: string; routeName: string; description: string | null
  startingPoint: string; endingPoint: string; estimatedDistance: number | null; estimatedDuration: number | null
  startTime: string | null; endTime: string | null; status: 'ACTIVE' | 'INACTIVE'; createdAt: string; updatedAt: string
}
export type SchoolRouteForm = Omit<SchoolRoute, 'id' | 'status' | 'createdAt' | 'updatedAt'>
export type RouteStop = {
  id: number; routeId: number; stopName: string; stopAddress: string | null; stopOrder: number
  latitude: number | null; longitude: number | null; estimatedArrivalTime: string | null
  pickupAllowed: boolean; dropAllowed: boolean; status: 'ACTIVE' | 'INACTIVE'
  createdAt: string; updatedAt: string
}
export type RouteStopForm = Omit<RouteStop, 'id' | 'status' | 'createdAt' | 'updatedAt'>
export type BusAssignment = {
  id: number; schoolId: number; busId: number; routeId: number; startDate: string; endDate: string | null
  status: 'ACTIVE' | 'INACTIVE'; remarks: string | null; createdAt: string; updatedAt: string
}
export type BusAssignmentForm = Omit<BusAssignment, 'id' | 'status' | 'createdAt' | 'updatedAt'>
export type DriverAssignment = {
  id: number; schoolId: number; busId: number; driverId: number; startDate: string; endDate: string | null
  status: 'ACTIVE' | 'INACTIVE'; remarks: string | null; createdAt: string; updatedAt: string
}
export type DriverAssignmentForm = Omit<DriverAssignment, 'id' | 'status' | 'createdAt' | 'updatedAt'>
export type StudentTransportAssignment = {
  id: number; schoolId: number; studentId: number; routeId: number; pickupStopId: number; dropStopId: number
  morningBusAssignmentId: number | null; afternoonBusAssignmentId: number | null
  requiresPickup: boolean; requiresDrop: boolean
  startDate: string; endDate: string | null; status: 'ACTIVE' | 'INACTIVE'; remarks: string | null
  createdAt: string; updatedAt: string
}
export type StudentTransportAssignmentForm = Omit<StudentTransportAssignment, 'id' | 'status' | 'createdAt' | 'updatedAt'>
export const emptyStudentTransportAssignment: StudentTransportAssignmentForm = {
  schoolId: 0, studentId: 0, routeId: 0, pickupStopId: 0, dropStopId: 0, morningBusAssignmentId: null, afternoonBusAssignmentId: null, requiresPickup: true, requiresDrop: true, startDate: '', endDate: '', remarks: '',
}
export const emptyBusAssignment: BusAssignmentForm = { schoolId: 0, busId: 0, routeId: 0, startDate: '', endDate: '', remarks: '' }
export const emptyDriverAssignment: DriverAssignmentForm = { schoolId: 0, busId: 0, driverId: 0, startDate: '', endDate: '', remarks: '' }
export const emptyRouteStop: RouteStopForm = {
  routeId: 0, stopName: '', stopAddress: '', stopOrder: 1, latitude: null, longitude: null,
  estimatedArrivalTime: '', pickupAllowed: true, dropAllowed: true,
}
export const emptySchoolRoute: SchoolRouteForm = {
  schoolId: 0, routeCode: '', routeName: '', description: '', startingPoint: '', endingPoint: '',
  estimatedDistance: null, estimatedDuration: null, startTime: '', endTime: '',
}
export const emptyBus: BusForm = {
  schoolId: 0, busNumber: '', registrationNumber: '', model: '', capacity: 40,
  busType: 'NON_AC', fuelType: 'DIESEL', manufactureYear: new Date().getFullYear(),
  insuranceNumber: '', insuranceExpiryDate: '', fitnessExpiryDate: '',
}
export const emptyStudent: StudentForm = {
  schoolId: 0, firstName: '', lastName: '', admissionNumber: '', dateOfBirth: '', gender: '',
  className: '', section: '', rollNumber: '', parentName: '', parentPhone: '',
  parentEmail: '', emergencyContact: '', address: '',
}
export const emptySchool: SchoolForm = { name: '', code: '', email: '', phone: '', website: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India' }

export function escapeReportCell(value: unknown): string {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function downloadExcelReport(filename: string, title: string, headers: string[], rows: (string | number)[][]) {
  const table = `<html><head><meta charset="utf-8"></head><body><h2>${escapeReportCell(title)}</h2><table border="1"><thead><tr>${headers.map(header => `<th>${escapeReportCell(header)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${escapeReportCell(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`
  const blob = new Blob(['\\ufeff', table], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.xls') ? filename : `${filename}.xls`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function downloadPdfReport(title: string, headers: string[], rows: (string | number)[][]) {
  const popup = window.open('', '_blank')
  if (!popup) {
    window.alert('Please allow pop-ups to generate the PDF report.')
    return
  }
  const table = `<table><thead><tr>${headers.map(header => `<th>${escapeReportCell(header)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${escapeReportCell(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeReportCell(title)}</title><style>body{font:12px Arial,sans-serif;padding:24px;color:#111}h1{font-size:20px;margin:0 0 18px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #bbb;padding:7px;text-align:left}th{background:#eee}tr{page-break-inside:avoid}@page{size:landscape;margin:12mm}@media print{body{padding:0}}</style></head><body><h1>${escapeReportCell(title)}</h1><p>Generated: ${new Date().toLocaleString()}</p>${table}<script>window.onload=()=>window.print()</script></body></html>`)
  popup.document.close()
}

export async function api<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try { const body = await response.json(); message = body.message || message } catch { /* keep fallback */ }
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  const responseText = await response.text()
  if (!responseText) return undefined as T
  try { return JSON.parse(responseText) as T } catch { return responseText as T }
}









export type SchoolDriver = {
  id: number; schoolId: number; driverCode: string; firstName: string; lastName: string
  dateOfBirth: string | null; gender: string | null; phone: string; alternatePhone: string | null
  email: string | null; address: string | null; city: string | null; state: string | null; pincode: string | null
  licenseNumber: string; licenseType: string | null; licenseExpiryDate: string | null; joiningDate: string | null
  emergencyContactName: string | null; emergencyContactPhone: string | null
  status: 'ACTIVE' | 'INACTIVE'; createdAt: string; updatedAt: string
}
export type SchoolDriverForm = Omit<SchoolDriver, 'id' | 'status' | 'createdAt' | 'updatedAt'>
export const emptySchoolDriver: SchoolDriverForm = {
  schoolId: 0, driverCode: '', firstName: '', lastName: '', dateOfBirth: '', gender: '',
  phone: '', alternatePhone: '', email: '', address: '', city: '', state: '', pincode: '',
  licenseNumber: '', licenseType: '', licenseExpiryDate: '', joiningDate: '',
  emergencyContactName: '', emergencyContactPhone: '',
}








export function Detail({ label, value }: { label: string; value: string | null | undefined }) { return <div className="detail"><span>{label}</span><strong>{value || 'Not provided'}</strong></div> }














export function withStudentMenu(items: Menu[], role?: UserRole): Menu[] {
  if (role !== 'SCHOOL_ADMIN') return items
  const normalized = items.map(menu => {
    const name = menu.name.trim().toLowerCase()
    if (name === 'students') return { ...menu, path: '/students', subMenus: [] }
    if (name === 'drivers' || name === 'driver') return { ...menu, path: '/drivers', subMenus: [] }
    if (name === 'bus' || name === 'buses' || name === 'busses') return { ...menu, path: '/bus', subMenus: [] }
    if (name === 'routes' || name === 'route') return { ...menu, path: '/routes', subMenus: [] }
    if (name === 'route stops' || name === 'route stop' || name === 'routestops') return { ...menu, path: '/route-stops', subMenus: [] }
    if (name === 'route assignment' || name === 'route assignments') return { ...menu, path: menu.path || '/route-assignments', subMenus: [] }
    if (name === 'bus assignment' || name === 'bus assignments') return { ...menu, path: menu.path || '/bus-assignments', subMenus: [] }
    if (name === 'driver assignment' || name === 'driver assignments') return { ...menu, path: menu.path || '/driver-assignments', subMenus: [] }
    if (name === 'student transport assignment' || name === 'student transport assignments' || name === 'student assignments') return { ...menu, path: menu.path || '/student-transport-assignments', subMenus: [] }
    if (name === 'trip schedule' || name === 'trip schedules' || name === 'schedules') return { ...menu, path: menu.path || '/trip-schedules', subMenus: [] }
    if (name === 'trip' || name === 'trips' || name === 'trip management' || name === 'trip managements') return { ...menu, path: menu.path || '/trips', subMenus: [] }
    return menu
  })
  return normalized
}
export function flattenMenus(items: Menu[]): Menu[] { return items.flatMap(item => [item, ...flattenMenus(item.subMenus || [])]) }
export function pageTitle(path: string) { return path.split('/').filter(Boolean).map(part => part.replace(/-/g, ' ').replace(/^\w/, char => char.toUpperCase())).join(' / ') || 'Dashboard' }
export function iconFor(icon: string | null) { const icons: Record<string, string> = { 'layout-dashboard': '▦', school: '⌂', 'steering-wheel': '◉', users: '♙', route: '↗', 'map-pinned': '⌖', 'calendar-clock': '◷', bell: '♧' }; return icons[icon || ''] || '•' }
