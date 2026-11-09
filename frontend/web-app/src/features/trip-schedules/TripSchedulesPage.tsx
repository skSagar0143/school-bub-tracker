import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarClock, MoreVertical, RefreshCw } from 'lucide-react'
import { DateInput, SearchInput, SelectInput, TextArea, TextInput } from '../../components/ui/FormControls'
import {
  api,
  downloadExcelReport,
  downloadPdfReport,
} from '../../pages/LegacyPages'
import type {
  Bus,
  BusAssignment,
  School,
  SchoolRoute,
} from '../../pages/LegacyPages'

type TripType = 'PICKUP' | 'DROP'
type TripSchedule = {
  id: number
  schoolId: number
  busAssignmentId: number
  tripType: TripType
  startTime: string
  effectiveFrom: string
  effectiveUntil: string | null
  operatingDays: string
  status: 'ACTIVE' | 'INACTIVE'
  remarks: string | null
  createdAt: string
  updatedAt: string
}
type TripScheduleForm = {
  schoolId: number
  busAssignmentId: number
  tripType: TripType
  startTime: string
  effectiveFrom: string
  effectiveUntil: string
  operatingDays: string[]
  remarks: string
}
type Props = {
  token: string
  setError: (value: string) => void
  setNotice: (value: string) => void
}

const WEEKDAYS = [
  { value: 'MON', label: 'Monday' },
  { value: 'TUE', label: 'Tuesday' },
  { value: 'WED', label: 'Wednesday' },
  { value: 'THU', label: 'Thursday' },
  { value: 'FRI', label: 'Friday' },
  { value: 'SAT', label: 'Saturday' },
  { value: 'SUN', label: 'Sunday' },
]
const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const emptyForm = (schoolId = 0): TripScheduleForm => ({
  schoolId,
  busAssignmentId: 0,
  tripType: 'PICKUP',
  startTime: '07:00',
  effectiveFrom: today(),
  effectiveUntil: '',
  operatingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
  remarks: '',
})

export function TripSchedulesPage({ token, setError, setNotice }: Props) {
  const [schedules, setSchedules] = useState<TripSchedule[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [busAssignments, setBusAssignments] = useState<BusAssignment[]>([])
  const [buses, setBuses] = useState<Bus[]>([])
  const [routes, setRoutes] = useState<SchoolRoute[]>([])
  const [schoolId, setSchoolId] = useState(0)
  const [form, setForm] = useState<TripScheduleForm>(emptyForm())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [schoolRows, assignmentRows, busRows, routeRows] = await Promise.all([
        api<School[]>('/school', token),
        api<BusAssignment[]>('/bus-assignment', token),
        api<Bus[]>('/bus', token),
        api<SchoolRoute[]>('/route', token),
      ])

      // This screen is for a school administrator. Never silently mix records
      // from multiple schools if the APIs return an unscoped result.
      const assignmentSchoolIds = [...new Set(assignmentRows.map(item => item.schoolId))]
      if (assignmentSchoolIds.length > 1) {
        throw new Error('The bus-assignment API returned records for multiple schools. School-scoped access must be applied before managing trip schedules.')
      }
      const resolvedSchoolId = assignmentSchoolIds[0] ?? (
        schoolRows.length === 1 ? schoolRows[0].id : 0
      )
      if (!resolvedSchoolId) {
        throw new Error('Unable to determine the school for this account. Please ensure the signed-in school administrator is linked to one school.')
      }

      const scheduleRows = await api<TripSchedule[]>(
        `/api/trip-schedules/school/${resolvedSchoolId}`,
        token,
      )
      setSchools(schoolRows)
      setBusAssignments(assignmentRows.filter(item => item.schoolId === resolvedSchoolId))
      setBuses(busRows.filter(item => item.schoolId === resolvedSchoolId))
      setRoutes(routeRows.filter(item => item.schoolId === resolvedSchoolId))
      setSchedules(scheduleRows)
      setSchoolId(resolvedSchoolId)
      setForm(current => current.schoolId ? current : emptyForm(resolvedSchoolId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load trip schedules.')
    } finally {
      setLoading(false)
    }
  }, [token, setError])

  useEffect(() => { void load() }, [load])

  const activeAssignments = useMemo(
    () => busAssignments.filter(item => item.status === 'ACTIVE'),
    [busAssignments],
  )

  const assignmentLabel = (assignmentId: number) => {
    const assignment = busAssignments.find(item => item.id === assignmentId)
    if (!assignment) return 'Unavailable bus assignment'
    const bus = buses.find(item => item.id === assignment.busId)
    const route = routes.find(item => item.id === assignment.routeId)
    return `${bus?.busNumber || 'Bus'} · ${route?.routeName || 'Route'}`
  }
  const schoolName = schools.find(item => item.id === schoolId)?.name || 'Your school'

  const filteredSchedules = schedules.filter(item => [
    assignmentLabel(item.busAssignmentId),
    item.tripType,
    item.startTime,
    item.effectiveFrom,
    item.effectiveUntil || 'Ongoing',
    item.operatingDays,
    item.status,
    item.remarks || '',
  ].join(' ').toLowerCase().includes(search.toLowerCase()))

  const availableAssignments = activeAssignments.filter(item => {
    if (item.startDate > form.effectiveFrom) return false
    if (item.endDate && (!form.effectiveUntil || item.endDate < form.effectiveUntil)) return false
    return true
  })

  function createForm() {
    setEditingId(null)
    setForm(emptyForm(schoolId))
    setShowForm(true)
    setError('')
    setNotice('')
  }

  function editSchedule(item: TripSchedule) {
    setEditingId(item.id)
    setForm({
      schoolId: item.schoolId,
      busAssignmentId: item.busAssignmentId,
      tripType: item.tripType,
      startTime: item.startTime.slice(0, 5),
      effectiveFrom: item.effectiveFrom,
      effectiveUntil: item.effectiveUntil || '',
      operatingDays: item.operatingDays.split(',').map(day => day.trim()).filter(Boolean),
      remarks: item.remarks || '',
    })
    setShowForm(true)
    setError('')
    setNotice('')
  }

  function toggleDay(day: string) {
    setForm(current => ({
      ...current,
      operatingDays: current.operatingDays.includes(day)
        ? current.operatingDays.filter(value => value !== day)
        : WEEKDAYS.filter(value => current.operatingDays.includes(value.value) || value.value === day).map(value => value.value),
    }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (!form.busAssignmentId) throw new Error('Select a bus assignment.')
      if (!form.effectiveFrom) throw new Error('Select the effective-from date.')
      if (form.effectiveUntil && form.effectiveUntil < form.effectiveFrom) {
        throw new Error('Effective-until date cannot be before effective-from date.')
      }
      if (!form.operatingDays.length) throw new Error('Select at least one operating day.')

      const assignment = busAssignments.find(item => item.id === Number(form.busAssignmentId))
      if (!assignment || assignment.status !== 'ACTIVE' || assignment.schoolId !== schoolId) {
        throw new Error('Select an active bus assignment belonging to your school.')
      }
      if (assignment.startDate > form.effectiveFrom) {
        throw new Error('The schedule cannot start before the bus assignment starts.')
      }
      if (assignment.endDate && (!form.effectiveUntil || form.effectiveUntil > assignment.endDate)) {
        throw new Error('The schedule end date must be within the bus assignment period.')
      }

      const payload = {
        schoolId,
        busAssignmentId: Number(form.busAssignmentId),
        tripType: form.tripType,
        startTime: form.startTime.length === 5 ? `${form.startTime}:00` : form.startTime,
        effectiveFrom: form.effectiveFrom,
        effectiveUntil: form.effectiveUntil || null,
        operatingDays: WEEKDAYS.filter(day => form.operatingDays.includes(day.value)).map(day => day.value).join(','),
        status: 'ACTIVE',
        remarks: form.remarks.trim() || null,
      }
      await api<TripSchedule>(
        editingId ? `/api/trip-schedules/${editingId}` : '/api/trip-schedules',
        token,
        { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) },
      )
      setNotice(editingId ? 'Trip schedule updated successfully.' : 'Trip schedule created successfully.')
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm(schoolId))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save trip schedule.')
    } finally {
      setBusy(false)
    }
  }

  async function deactivate(item: TripSchedule) {
    if (!window.confirm(`Deactivate the ${item.tripType.toLowerCase()} schedule for ${assignmentLabel(item.busAssignmentId)}?`)) return
    setError('')
    setNotice('')
    try {
      await api<void>(`/api/trip-schedules/${item.id}`, token, { method: 'DELETE' })
      setNotice('Trip schedule deactivated. Its history has been preserved.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to deactivate trip schedule.')
    }
  }

  const weekdayLabel = (days: string) => days.split(',').map(code =>
    WEEKDAYS.find(day => day.value === code.trim())?.label.slice(0, 3) || code,
  ).join(', ')

  return <>
    {!showForm && <div className="page-intro">
      <div>
        <h2>Trip schedule management</h2>
        <p>Configure recurring pickup and drop journeys for each bus assignment at {schoolName}.</p>
      </div>
      <div className="page-header-actions">
        <button className="button primary" onClick={createForm} disabled={!activeAssignments.length}>
          <CalendarClock size={15} /> Add Schedule
        </button>
        <button className="button secondary" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
    </div>}

    {showForm && <div className="record-page-header">
      <button type="button" className="breadcrumb-back" onClick={() => { setShowForm(false); setEditingId(null) }}>Trip Schedules</button>
      <span>/</span><strong>{editingId ? 'Update schedule' : 'Add schedule'}</strong>
    </div>}

    {showForm && <section className="panel form-panel">
      <form onSubmit={submit}>
        <div className="form-grid">
          <label className="field">
            <span>Bus assignment *</span>
            <SelectInput required value={form.busAssignmentId || ''} onChange={event => setForm({ ...form, busAssignmentId: Number(event.target.value) })}>
              <option value="">Select active bus assignment</option>
              {activeAssignments.map(item => {
                const bus = buses.find(row => row.id === item.busId)
                const route = routes.find(row => row.id === item.routeId)
                return <option key={item.id} value={item.id}>
                  {bus ? `${bus.busNumber} · ${bus.registrationNumber}` : `Bus assignment #${item.id}`} — {route?.routeName || 'Route'} ({item.startDate} to {item.endDate || 'Ongoing'})
                </option>
              })}
            </SelectInput>
          </label>
          <label className="field">
            <span>Journey type *</span>
            <SelectInput value={form.tripType} onChange={event => setForm({ ...form, tripType: event.target.value as TripType })}>
              <option value="PICKUP">Morning pickup — Home to school</option>
              <option value="DROP">Afternoon drop — School to home</option>
            </SelectInput>
          </label>
          <label className="field">
            <span>Start time *</span>
            <TextInput required type="time" value={form.startTime} onChange={event => setForm({ ...form, startTime: event.target.value })} />
          </label>
          <label className="field">
            <span>Effective from *</span>
            <DateInput value={form.effectiveFrom} onChange={value => setForm({ ...form, effectiveFrom: value })} required />
          </label>
          <label className="field">
            <span>Effective until</span>
            <DateInput value={form.effectiveUntil} onChange={value => setForm({ ...form, effectiveUntil: value })} placeholder="No end date" />
          </label>
          <label className="field field-wide">
            <span>Operating days *</span>
            <div className="weekday-options">
              {WEEKDAYS.map(day => <label key={day.value} className="weekday-option">
                <input type="checkbox" checked={form.operatingDays.includes(day.value)} onChange={() => toggleDay(day.value)} />
                <span>{day.label}</span>
              </label>)}
            </div>
          </label>
          <label className="field field-wide">
            <span>Remarks</span>
            <TextArea rows={2} maxLength={500} value={form.remarks} onChange={event => setForm({ ...form, remarks: event.target.value })} placeholder="Optional schedule notes" />
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</button>
          <button className="button primary" disabled={busy || !activeAssignments.length || !form.operatingDays.length}>
            {busy ? 'Saving…' : editingId ? 'Update schedule' : 'Save schedule'}
          </button>
        </div>
        {!activeAssignments.length && <p className="student-subtext">Create an active bus assignment before adding a trip schedule.</p>}
        {form.busAssignmentId > 0 && !availableAssignments.some(item => item.id === form.busAssignmentId) && <p className="student-subtext">The selected bus assignment does not cover the complete schedule date range. Adjust the dates or choose another assignment.</p>}
      </form>
    </section>}

    {!showForm && <section className="panel">
      <div className="panel-heading student-list-heading">
        <div><span className="section-kicker">DAILY OPERATIONS</span><h3>Trip schedules <small className="count-label">{filteredSchedules.length}</small></h3></div>
        <div className="table-header-tools">
          <SearchInput className="student-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search bus, route or journey…" />
          <button type="button" className="button secondary report-button" onClick={() => downloadExcelReport(
            'trip-schedules.xls', 'Trip Schedules Report',
            ['Bus assignment', 'Journey', 'Start time', 'Operating days', 'Effective from', 'Effective until', 'Status', 'Remarks'],
            filteredSchedules.map(item => [assignmentLabel(item.busAssignmentId), item.tripType, item.startTime, weekdayLabel(item.operatingDays), item.effectiveFrom, item.effectiveUntil || 'Ongoing', item.status, item.remarks || '']),
          )}>Export Excel</button>
          <button type="button" className="button secondary report-button" onClick={() => downloadPdfReport(
            'Trip Schedules Report',
            ['Bus assignment', 'Journey', 'Start time', 'Days', 'From', 'Until', 'Status'],
            filteredSchedules.map(item => [assignmentLabel(item.busAssignmentId), item.tripType, item.startTime, weekdayLabel(item.operatingDays), item.effectiveFrom, item.effectiveUntil || 'Ongoing', item.status]),
          )}>Export PDF</button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr>
            <th className="row-actions-heading" aria-label="Row actions"></th>
            <th>Bus / Route</th><th>Journey</th><th>Start time</th><th>Operating days</th><th>Effective from</th><th>Effective until</th><th>Status</th>
          </tr></thead>
          <tbody>
            {filteredSchedules.map(item => <tr key={item.id}>
              <td className="row-actions-cell">
                <div className="row-action-menu">
                  <button type="button" className="row-action-trigger" aria-label="Trip schedule actions" aria-haspopup="true" aria-expanded={openActionMenuId === item.id} onClick={() => setOpenActionMenuId(current => current === item.id ? null : item.id)}>
                    <MoreVertical size={18} />
                  </button>
                  {openActionMenuId === item.id && <div className="row-action-dropdown" role="menu">
                    <button type="button" role="menuitem" onClick={() => { setOpenActionMenuId(null); editSchedule(item) }}>Edit schedule</button>
                    {item.status === 'ACTIVE' && <button type="button" role="menuitem" className="danger" onClick={() => { setOpenActionMenuId(null); void deactivate(item) }}>Deactivate schedule</button>}
                  </div>}
                </div>
              </td>
              <td><strong>{assignmentLabel(item.busAssignmentId)}</strong></td>
              <td><span className={`status-pill ${item.tripType === 'PICKUP' ? 'active' : 'inactive'}`}>{item.tripType === 'PICKUP' ? 'Morning pickup' : 'Afternoon drop'}</span></td>
              <td>{item.startTime.slice(0, 5)}</td>
              <td>{weekdayLabel(item.operatingDays)}</td>
              <td>{item.effectiveFrom}</td>
              <td>{item.effectiveUntil || 'Ongoing'}</td>
              <td><span className={`status-pill ${item.status === 'ACTIVE' ? 'active' : 'inactive'}`}>{item.status}</span></td>
            </tr>)}
            {loading && <tr><td colSpan={8} className="empty-cell">Loading trip schedules…</td></tr>}
            {!loading && filteredSchedules.length === 0 && <tr><td colSpan={8} className="empty-cell">{search ? 'No schedules match your search.' : 'No trip schedules found. Add a schedule to configure recurring pickup or drop journeys.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </section>}

    {!showForm && <p className="footnote">A schedule is a recurring journey configuration, not an individual trip. Actual dated trips will be generated from active schedules in the next phase. Each bus assignment can have separate pickup and drop schedules.</p>}
  </>
}
