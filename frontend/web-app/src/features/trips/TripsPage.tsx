import { useCallback, useEffect, useMemo, useState } from 'react'
import { BusFront, CalendarClock, MoreVertical, RefreshCw, Route as RouteIcon } from 'lucide-react'
import { DateInput, SearchInput } from '../../components/ui/FormControls'
import { api, downloadExcelReport, downloadPdfReport } from '../../pages/LegacyPages'
import type { Bus, BusAssignment, School, SchoolDriver, SchoolRoute } from '../../pages/LegacyPages'

type TripStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
type TripStopStatus = 'PENDING' | 'ARRIVED' | 'DEPARTED' | 'SKIPPED'
type TripStudentStatus = 'WAITING' | 'BOARDED' | 'DROPPED' | 'ABSENT'
type TripStop = {
  id: number; routeStopId: number; stopName: string; stopAddress: string | null; stopOrder: number
  latitude: number | null; longitude: number | null; estimatedArrivalTime: string | null
  status: TripStopStatus; arrivedAt: string | null; departedAt: string | null; remarks: string | null
}
type TripStudent = {
  id: number; studentTransportAssignmentId: number; studentId: number; studentName: string
  admissionNumber: string; className: string | null; section: string | null
  stopId: number; stopName: string; status: TripStudentStatus
  boardedAt: string | null; droppedAt: string | null; remarks: string | null
}
type Trip = {
  id: number; schoolId: number; tripScheduleId: number; busAssignmentId: number; busId: number
  routeId: number; driverAssignmentId: number | null; driverId: number | null
  tripDate: string; tripType: 'PICKUP' | 'DROP'; scheduledStartTime: string
  actualStartAt: string | null; actualEndAt: string | null; status: TripStatus
  remarks: string | null; stops: TripStop[]; students: TripStudent[]
}
type Props = { token: string; setError: (value: string) => void; setNotice: (value: string) => void }
const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function TripsPage({ token, setError, setNotice }: Props) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [buses, setBuses] = useState<Bus[]>([])
  const [routes, setRoutes] = useState<SchoolRoute[]>([])
  const [drivers, setDrivers] = useState<SchoolDriver[]>([])
  const [schoolId, setSchoolId] = useState(0)
  const [tripDate, setTripDate] = useState(today())
  const [search, setSearch] = useState('')
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null)
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [updating, setUpdating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [schoolRows, assignmentRows, busRows, routeRows, driverRows] = await Promise.all([
        api<School[]>('/school', token),
        api<BusAssignment[]>('/bus-assignment', token),
        api<Bus[]>('/bus', token),
        api<SchoolRoute[]>('/route', token),
        api<SchoolDriver[]>('/driver', token),
      ])
      const assignmentSchoolIds = [...new Set(assignmentRows.map(item => item.schoolId))]
      if (assignmentSchoolIds.length > 1) {
        throw new Error('The bus-assignment API returned records from multiple schools. School-scoped access is required.')
      }
      const resolvedSchoolId = assignmentSchoolIds[0] ?? (schoolRows.length === 1 ? schoolRows[0].id : 0)
      if (!resolvedSchoolId) throw new Error('Unable to determine the school for this account.')
      const tripRows = await api<Trip[]>(`/api/trips/school/${resolvedSchoolId}?date=${tripDate}`, token)
      setSchools(schoolRows)
      setBuses(busRows.filter(item => item.schoolId === resolvedSchoolId))
      setRoutes(routeRows.filter(item => item.schoolId === resolvedSchoolId))
      setDrivers(driverRows.filter(item => item.schoolId === resolvedSchoolId))
      setSchoolId(resolvedSchoolId)
      setTrips(tripRows)
      if (selectedTripId && !tripRows.some(item => item.id === selectedTripId)) setSelectedTripId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load trips.')
    } finally {
      setLoading(false)
    }
  }, [token, tripDate, setError])

  useEffect(() => { void load() }, [load])

  const busLabel = (id: number) => {
    const bus = buses.find(item => item.id === id)
    return bus ? `${bus.busNumber} · ${bus.registrationNumber}` : 'Unavailable bus'
  }
  const routeLabel = (id: number) => routes.find(item => item.id === id)?.routeName || 'Unavailable route'
  const driverLabel = (id: number | null) => {
    if (!id) return 'Driver not assigned'
    const driver = drivers.find(item => item.id === id)
    return driver ? `${driver.firstName} ${driver.lastName || ''}`.trim() : 'Unavailable driver'
  }
  const schoolName = schools.find(item => item.id === schoolId)?.name || 'Your school'
  const filteredTrips = useMemo(() => trips.filter(item => [
    busLabel(item.busId), routeLabel(item.routeId), driverLabel(item.driverId),
    item.tripType, item.status, item.tripDate, item.scheduledStartTime,
  ].join(' ').toLowerCase().includes(search.toLowerCase())), [trips, buses, routes, drivers, search])
  const selectedTrip = trips.find(item => item.id === selectedTripId) || null
  const [clockNow, setClockNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  const getTripProgress = (trip: Trip) => {
    const completedStopCount = trip.stops.filter(stop => ['DEPARTED', 'SKIPPED'].includes(stop.status)).length
    const completedStudentCount = trip.students.filter(student =>
      ['PICKUP'.includes(trip.tripType) ? 'BOARDED' : 'DROPPED', 'ABSENT'].includes(student.status),
    ).length
    const currentStop = trip.stops.find(stop => stop.status === 'ARRIVED') || null
    const nextStop = trip.stops.find(stop => stop.status === 'PENDING') || null
    const startedAt = trip.actualStartAt ? new Date(trip.actualStartAt).getTime() : null
    const endedAt = trip.actualEndAt ? new Date(trip.actualEndAt).getTime() : null
    const elapsedMinutes = startedAt ? Math.max(0, Math.floor(((endedAt || clockNow) - startedAt) / 60000)) : 0
    const hours = Math.floor(elapsedMinutes / 60)
    const minutes = elapsedMinutes % 60
    const progress = trip.stops.length ? Math.round(completedStopCount / trip.stops.length * 100) : 0
    return {
      completedStopCount, remainingStops: Math.max(0, trip.stops.length - completedStopCount),
      completedStudentCount, remainingStudents: Math.max(0, trip.students.length - completedStudentCount),
      currentStop, nextStop, elapsed: hours ? `${hours}h ${minutes}m` : `${minutes}m`, progress,
    }
  }

  const canOperateStop = (trip: Trip, stop: TripStop) => {
    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') return false
    return trip.stops
      .filter(item => item.stopOrder < stop.stopOrder)
      .every(item => item.status === 'DEPARTED' || item.status === 'SKIPPED')
  }

  const canUpdateStudent = (trip: Trip, student: TripStudent) =>
    trip.status === 'IN_PROGRESS' &&
    trip.stops.some(stop => stop.id === student.stopId && stop.status === 'ARRIVED') &&
    student.status === 'WAITING'

  const getTripReadiness = (trip: Trip) => {
    const bus = buses.find(item => item.id === trip.busId)
    const route = routes.find(item => item.id === trip.routeId)
    const driver = trip.driverId ? drivers.find(item => item.id === trip.driverId) : null
    const stopIds = new Set(trip.stops.map(stop => stop.id))
    const checks = [
      { label: 'Assigned bus is available and active', passed: Boolean(bus && bus.status === 'ACTIVE') },
      { label: 'Assigned route is available and active', passed: Boolean(route && route.status === 'ACTIVE') },
      { label: 'An active driver is assigned', passed: Boolean(driver && driver.status === 'ACTIVE') },
      { label: 'At least one trip stop is configured', passed: trip.stops.length > 0 },
      { label: 'Students are assigned to this trip', passed: trip.students.length > 0 },
      { label: 'Every student is linked to a trip stop', passed: trip.students.length > 0 && trip.students.every(student => stopIds.has(student.stopId)) },
    ]
    return { checks, ready: checks.every(check => check.passed), issueCount: checks.filter(check => !check.passed).length }
  }

  async function generate() {
    setGenerating(true); setError(''); setNotice('')
    try {
      const created = await api<Trip[]>('/api/trips/generate', token, {
        method: 'POST', body: JSON.stringify({ schoolId, tripDate }),
      })
      setNotice(created.length
        ? `Generated ${created.length} trip(s) for ${tripDate}.`
        : `No new trips generated for ${tripDate}. Existing trips are preserved, or no active schedules operate on this date.`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate trips.')
    } finally { setGenerating(false) }
  }

  async function updateTripStatus(trip: Trip, status: TripStatus) {
    setUpdating(true); setError(''); setNotice('')
    try {
      await api<Trip>(`/api/trips/${trip.id}/status`, token, {
        method: 'PATCH', body: JSON.stringify({ status }),
      })
      setNotice(`Trip marked ${status.toLowerCase().replace('_', ' ')}.`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update trip.')
    } finally { setUpdating(false) }
  }

  async function updateStopStatus(trip: Trip, stop: TripStop, status: TripStopStatus) {
    setUpdating(true); setError(''); setNotice('')
    try {
      await api<Trip>(`/api/trips/${trip.id}/stops/${stop.id}/status`, token, {
        method: 'PATCH', body: JSON.stringify({ status }),
      })
      setNotice(`${stop.stopName}: ${status.toLowerCase()}.`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update stop status.')
    } finally { setUpdating(false) }
  }

  async function updateStudentStatus(trip: Trip, student: TripStudent, status: TripStudentStatus) {
    setUpdating(true); setError(''); setNotice('')
    try {
      await api<Trip>(`/api/trips/${trip.id}/students/${student.id}/status`, token, {
        method: 'PATCH', body: JSON.stringify({ status }),
      })
      setNotice(`${student.studentName}: ${status.toLowerCase()}.`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update student status.')
    } finally { setUpdating(false) }
  }

  const statusClass = (status: string) => status === 'COMPLETED' || status === 'BOARDED' || status === 'DROPPED' || status === 'DEPARTED'
    ? 'active' : status === 'CANCELLED' || status === 'ABSENT' || status === 'SKIPPED' ? 'inactive' : 'pending'

  return <>
    <div className="page-intro">
      <div>
        <h2>Trip management</h2>
        <p>Generate and operate dated bus journeys for {schoolName}. Trip stops and students are snapshots of the assignments on generation day.</p>
      </div>
      <div className="page-header-actions">
        <button className="button primary" onClick={() => void generate()} disabled={generating || loading || !schoolId}>
          <CalendarClock size={15}/>{generating ? 'Generating…' : 'Generate trips'}
        </button>
        <button className="button secondary" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>
    </div>

    <section className="panel">
      <div className="panel-heading student-list-heading">
        <div><span className="section-kicker">DAILY OPERATIONS</span><h3>Trips for selected date <small className="count-label">{filteredTrips.length}</small></h3></div>
        <div className="table-header-tools">
          <label className="field compact-field"><span>Trip date</span><DateInput value={tripDate} onChange={value => { setTripDate(value); setSelectedTripId(null) }} required /></label>
          <SearchInput className="student-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search bus, route, driver…"/>
          <button type="button" className="button secondary report-button" onClick={() => downloadExcelReport(
            'daily-trips.xls', 'Daily Trips Report',
            ['Date', 'Bus', 'Route', 'Journey', 'Start time', 'Driver', 'Students', 'Stops', 'Status'],
            filteredTrips.map(item => [item.tripDate, busLabel(item.busId), routeLabel(item.routeId), item.tripType, item.scheduledStartTime.slice(0, 5), driverLabel(item.driverId), item.students.length, item.stops.length, item.status]),
          )}>Export Excel</button>
          <button type="button" className="button secondary report-button" onClick={() => downloadPdfReport(
            'Daily Trips Report',
            ['Date', 'Bus', 'Route', 'Journey', 'Start', 'Driver', 'Students', 'Status'],
            filteredTrips.map(item => [item.tripDate, busLabel(item.busId), routeLabel(item.routeId), item.tripType, item.scheduledStartTime.slice(0, 5), driverLabel(item.driverId), item.students.length, item.status]),
          )}>Export PDF</button>
        </div>
      </div>
      <div className="table-wrap">
        <table><thead><tr>
          <th className="row-actions-heading" aria-label="Row actions"></th>
          <th>Bus</th><th>Route</th><th>Journey</th><th>Scheduled</th><th>Driver</th><th>Students</th><th>Stops</th><th>Readiness</th><th>Status</th>
        </tr></thead><tbody>
          {filteredTrips.map(item => <tr key={item.id}>
            <td className="row-actions-cell"><div className="row-action-menu">
              <button type="button" className="row-action-trigger" aria-label="Trip actions" aria-haspopup="true" aria-expanded={openActionMenuId === item.id} onClick={() => setOpenActionMenuId(current => current === item.id ? null : item.id)}><MoreVertical size={18}/></button>
              {openActionMenuId === item.id && <div className="row-action-dropdown" role="menu">
                <button type="button" role="menuitem" onClick={() => { setSelectedTripId(item.id); setOpenActionMenuId(null) }}>View trip details</button>
                {item.status === 'SCHEDULED' && <button type="button" role="menuitem" disabled={updating || !getTripReadiness(item).ready} title={!getTripReadiness(item).ready ? 'Open trip details to review readiness issues' : 'Start trip'} onClick={() => { setOpenActionMenuId(null); void updateTripStatus(item, 'IN_PROGRESS') }}>Start trip</button>}
                {item.status === 'IN_PROGRESS' && <button type="button" role="menuitem" disabled={updating} onClick={() => { setOpenActionMenuId(null); void updateTripStatus(item, 'COMPLETED') }}>Complete trip</button>}
                {(item.status === 'SCHEDULED' || item.status === 'IN_PROGRESS') && <button type="button" role="menuitem" className="danger" disabled={updating} onClick={() => { setOpenActionMenuId(null); if (window.confirm('Cancel this trip?')) void updateTripStatus(item, 'CANCELLED') }}>Cancel trip</button>}
              </div>}
            </div></td>
            <td><strong>{busLabel(item.busId)}</strong></td><td>{routeLabel(item.routeId)}</td>
            <td><span className={`status-pill ${item.tripType === 'PICKUP' ? 'active' : 'inactive'}`}>{item.tripType === 'PICKUP' ? 'Morning pickup' : 'Afternoon drop'}</span></td>
            <td>{item.scheduledStartTime.slice(0, 5)}</td><td>{driverLabel(item.driverId)}</td>
            <td>{item.students.length}</td><td>{item.stops.length}</td>
            <td><span className={`status-pill ${getTripReadiness(item).ready ? 'active' : 'pending'}`}>{getTripReadiness(item).ready ? 'Ready' : `${getTripReadiness(item).issueCount} issue(s)`}</span></td>
            <td><span className={`status-pill ${statusClass(item.status)}`}>{item.status.replace('_', ' ')}</span></td>
          </tr>)}
          {loading && <tr><td colSpan={10} className="empty-cell">Loading trips…</td></tr>}
          {!loading && filteredTrips.length === 0 && <tr><td colSpan={10} className="empty-cell">{search ? 'No trips match your search.' : 'No trips exist for this date. Generate trips from active trip schedules.'}</td></tr>}
        </tbody></table>
      </div>
    </section>

    {selectedTrip && <section className="panel trip-detail-panel">
      <div className="panel-heading student-list-heading">
        <div><span className="section-kicker">TRIP DETAILS</span><h3>{busLabel(selectedTrip.busId)} · {selectedTrip.tripType === 'PICKUP' ? 'Morning pickup' : 'Afternoon drop'}</h3><p>{routeLabel(selectedTrip.routeId)} · {selectedTrip.tripDate} · {driverLabel(selectedTrip.driverId)}</p></div>
        <button type="button" className="button secondary" onClick={() => setSelectedTripId(null)}>Close details</button>
      </div>
      {(() => {
        const progress = getTripProgress(selectedTrip)
        return <div className="trip-progress-panel">
          <div className="trip-progress-heading">
            <div><span className="section-kicker">LIVE JOURNEY</span><h4>Trip progress</h4></div>
            <strong>{progress.progress}%</strong>
          </div>
          <div className="trip-progress-track"><span style={{ width: `${progress.progress}%` }} /></div>
          <div className="trip-progress-metrics">
            <div><strong>{progress.completedStopCount}/{selectedTrip.stops.length}</strong><span>Stops completed</span></div>
            <div><strong>{progress.remainingStops}</strong><span>Stops remaining</span></div>
            <div><strong>{progress.completedStudentCount}/{selectedTrip.students.length}</strong><span>Students processed</span></div>
            <div><strong>{progress.remainingStudents}</strong><span>Students waiting</span></div>
            <div><strong>{progress.elapsed}</strong><span>Elapsed time</span></div>
          </div>
          <div className="trip-progress-route">
            <div><span>Current stop</span><strong>{progress.currentStop?.stopName || (selectedTrip.status === 'SCHEDULED' ? 'Not started' : 'Between stops')}</strong></div>
            <div><span>Next stop</span><strong>{progress.nextStop?.stopName || (progress.remainingStops === 0 ? 'All stops completed' : 'No pending stop')}</strong></div>
          </div>
        </div>
      })()}
      {(() => {
        const readiness = getTripReadiness(selectedTrip)
        return <div className={`trip-readiness ${readiness.ready ? 'is-ready' : 'has-issues'}`}>
          <div className="trip-readiness-heading">
            <div><span className="section-kicker">START CHECKLIST</span><h4>Operational readiness</h4></div>
            <span className={`status-pill ${readiness.ready ? 'active' : 'pending'}`}>{readiness.ready ? 'Ready to start' : `${readiness.issueCount} item(s) need attention`}</span>
          </div>
          <div className="trip-readiness-list">
            {readiness.checks.map(check => <div key={check.label} className={check.passed ? 'check-passed' : 'check-failed'}>
              <span className="trip-readiness-icon">{check.passed ? '✓' : '!'}</span><span>{check.label}</span>
              <strong>{check.passed ? 'Passed' : 'Required'}</strong>
            </div>)}
          </div>
          {!readiness.ready && <p className="trip-readiness-note">Resolve the required items in Bus Assignment, Driver Assignment, Route Stops, or Student Transport Assignment, then refresh this page. Starting is disabled until every check passes.</p>}
        </div>
      })()}
      <div className="trip-detail-grid">
        <div>
          <h4><RouteIcon size={16}/> Trip stops ({selectedTrip.stops.length})</h4>
          <div className="table-wrap"><table><thead><tr><th>Stop</th><th>ETA</th><th>Status</th><th>Action</th></tr></thead><tbody>
            {selectedTrip.stops.map(stop => <tr key={stop.id}>
              <td><strong>{stop.stopOrder}. {stop.stopName}</strong><small className="table-subtext">{stop.stopAddress || ''}</small></td>
              <td>{stop.estimatedArrivalTime?.slice(0, 5) || '—'}</td>
              <td><span className={`status-pill ${statusClass(stop.status)}`}>{stop.status}</span></td>
              <td>{selectedTrip.status !== 'COMPLETED' && selectedTrip.status !== 'CANCELLED' && <div className="inline-actions">
                {stop.status === 'PENDING' && <><button className="button secondary small" disabled={updating || !canOperateStop(selectedTrip, stop)} onClick={() => void updateStopStatus(selectedTrip, stop, 'ARRIVED')}>Arrived</button><button className="button secondary small" disabled={updating || !canOperateStop(selectedTrip, stop)} onClick={() => void updateStopStatus(selectedTrip, stop, 'SKIPPED')}>Skip</button></>}
                {stop.status === 'ARRIVED' && <button className="button secondary small" disabled={updating || !selectedTrip.students.filter(student => student.stopId === stop.id).every(student => student.status === (selectedTrip.tripType === 'PICKUP' ? 'BOARDED' : 'DROPPED') || student.status === 'ABSENT')} onClick={() => void updateStopStatus(selectedTrip, stop, 'DEPARTED')}>Departed</button>}
              </div>}</td>
            </tr>)}
            {selectedTrip.stops.length === 0 && <tr><td colSpan={4} className="empty-cell">No stops were snapshotted.</td></tr>}
          </tbody></table></div>
        </div>
        <div>
          <h4><BusFront size={16}/> Students ({selectedTrip.students.length})</h4>
          <div className="table-wrap"><table><thead><tr><th>Student</th><th>Pickup / drop stop</th><th>Status</th><th>Action</th></tr></thead><tbody>
            {selectedTrip.students.map(student => <tr key={student.id}>
              <td><strong>{student.studentName}</strong><small className="table-subtext">{student.admissionNumber} · {student.className || '—'} {student.section || ''}</small></td>
              <td>{student.stopName}</td>
              <td><span className={`status-pill ${statusClass(student.status)}`}>{student.status}</span></td>
              <td>{selectedTrip.status !== 'COMPLETED' && selectedTrip.status !== 'CANCELLED' && <div className="inline-actions">
                {student.status === 'WAITING' && <><button className="button secondary small" disabled={updating || !canUpdateStudent(selectedTrip, student)} onClick={() => void updateStudentStatus(selectedTrip, student, selectedTrip.tripType === 'PICKUP' ? 'BOARDED' : 'DROPPED')}>{selectedTrip.tripType === 'PICKUP' ? 'Boarded' : 'Dropped'}</button><button className="button secondary small" disabled={updating || !canUpdateStudent(selectedTrip, student)} onClick={() => void updateStudentStatus(selectedTrip, student, 'ABSENT')}>Absent</button></>}
              </div>}</td>
            </tr>)}
            {selectedTrip.students.length === 0 && <tr><td colSpan={4} className="empty-cell">No students were assigned to this trip.</td></tr>}
          </tbody></table></div>
        </div>
      </div>
    </section>}

    <p className="footnote">Trips are generated from active schedules for the selected date. Stops and student assignments are stored as trip snapshots; update their operational status here rather than changing the original route or student assignments.</p>
  </>
}
