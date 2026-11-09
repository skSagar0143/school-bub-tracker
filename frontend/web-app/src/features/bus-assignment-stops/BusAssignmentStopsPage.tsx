import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../pages/LegacyPages'
import type { Bus, BusAssignment, RouteStop, School, SchoolRoute } from '../../pages/LegacyPages'
import { RefreshCw, Save, MapPinned } from 'lucide-react'
import { SearchInput, SelectInput } from '../../components/ui/FormControls'

type Props = { token: string; setError: (value: string) => void; setNotice: (value: string) => void }

export function BusAssignmentStopsPage({ token, setError, setNotice }: Props) {
  const [assignments, setAssignments] = useState<BusAssignment[]>([])
  const [buses, setBuses] = useState<Bus[]>([])
  const [routes, setRoutes] = useState<SchoolRoute[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [routeStops, setRouteStops] = useState<RouteStop[]>([])
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | ''>('')
  const [selectedStopIds, setSelectedStopIds] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [assignmentRows, busRows, routeRows, stopRows, schoolRows] = await Promise.all([
        api<BusAssignment[]>('/bus-assignment', token),
        api<Bus[]>('/bus', token),
        api<SchoolRoute[]>('/route', token),
        api<RouteStop[]>('/route-stop', token),
        api<School[]>('/school', token).catch(() => [] as School[]),
      ])
      setAssignments(assignmentRows)
      setBuses(busRows)
      setRoutes(routeRows)
      setRouteStops(stopRows)
      setSchools(schoolRows)
      setSelectedAssignmentId(current => {
        if (current && assignmentRows.some(item => item.id === current && item.status === 'ACTIVE')) return current
        return assignmentRows.find(item => item.status === 'ACTIVE')?.id ?? ''
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load bus assignment stops.')
    } finally {
      setLoading(false)
    }
  }, [token, setError])

  useEffect(() => { void load() }, [load])

  const selectedAssignment = assignments.find(item => item.id === Number(selectedAssignmentId))
  const selectedRoute = routes.find(item => item.id === selectedAssignment?.routeId)
  const availableStops = useMemo(() => routeStops
    .filter(stop => stop.routeId === selectedAssignment?.routeId && stop.status === 'ACTIVE')
    .sort((a, b) => a.stopOrder - b.stopOrder), [routeStops, selectedAssignment])
  const visibleStops = availableStops.filter(stop =>
    [stop.stopName, stop.stopAddress, String(stop.stopOrder)].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    let cancelled = false
    async function loadMappedStops() {
      if (!selectedAssignmentId) { setSelectedStopIds([]); return }
      try {
        const mapped = await api<RouteStop[]>(`/bus-assignment-stops/assignment/${selectedAssignmentId}`, token)
        if (!cancelled) setSelectedStopIds(mapped.map(stop => stop.id))
      } catch (err) {
        if (!cancelled) {
          setSelectedStopIds([])
          setError(err instanceof Error ? err.message : 'Unable to load mapped stops.')
        }
      }
    }
    void loadMappedStops()
    return () => { cancelled = true }
  }, [selectedAssignmentId, token, setError])

  function toggleStop(stopId: number) {
    setSelectedStopIds(current => current.includes(stopId)
      ? current.filter(id => id !== stopId)
      : [...current, stopId])
  }

  async function saveMapping() {
    if (!selectedAssignmentId) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const saved = await api<RouteStop[]>(`/bus-assignment-stops/assignment/${selectedAssignmentId}`, token, {
        method: 'PUT',
        body: JSON.stringify({ routeStopIds: selectedStopIds }),
      })
      setSelectedStopIds(saved.map(stop => stop.id))
      setNotice('Stops mapped to this bus assignment successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save bus stop mapping.')
    } finally {
      setSaving(false)
    }
  }

  const busLabel = (id: number) => {
    const bus = buses.find(item => item.id === id)
    return bus ? `${bus.busNumber} · ${bus.registrationNumber}` : 'Bus unavailable'
  }
  const schoolLabel = (id: number) => schools.find(item => item.id === id)?.name || '—'
  const activeAssignments = assignments.filter(item => item.status === 'ACTIVE')

  return <>
    <div className="page-intro">
      <div><h2>Bus assignment stop mapping</h2><p>Select the route stops that this particular bus will serve. Other buses assigned to the same route can have a different stop selection.</p></div>
      <div className="page-header-actions"><button type="button" className="button secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={14}/> Refresh</button></div>
    </div>

    <section className="panel form-panel">
      <div className="form-grid">
        <label className="field field-wide"><span>Active bus assignment *</span>
          <SelectInput value={selectedAssignmentId} onChange={event => { setSelectedAssignmentId(event.target.value ? Number(event.target.value) : ''); setSearch('') }}>
            <option value="">Select bus assignment</option>
            {activeAssignments.map(item => {
              const route = routes.find(routeItem => routeItem.id === item.routeId)
              return <option key={item.id} value={item.id}>{busLabel(item.busId)} — {route?.routeName || 'Route unavailable'} — {schoolLabel(item.schoolId)}</option>
            })}
          </SelectInput>
        </label>
      </div>
      {selectedAssignment && <div className="student-subtext">
        <strong>{busLabel(selectedAssignment.busId)}</strong> is assigned to <strong>{selectedRoute?.routeName || 'the selected route'}</strong>.
        Choose only the stops this bus will actually serve.
      </div>}
    </section>

    <section className="panel">
      <div className="panel-heading student-list-heading">
        <div><span className="section-kicker">STOP CONFIGURATION</span><h3>Available route stops <small className="count-label">{selectedStopIds.length} selected / {availableStops.length}</small></h3></div>
        <div className="table-header-tools">
          <SearchInput className="student-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search route stops…"/>
          <button type="button" className="button primary" onClick={() => void saveMapping()} disabled={!selectedAssignment || saving || loading}><Save size={14}/>{saving ? 'Saving…' : 'Save stop mapping'}</button>
        </div>
      </div>
      {!selectedAssignmentId ? <div className="empty-cell">Select an active bus assignment to configure its stops.</div> :
        <div className="table-wrap"><table><thead><tr><th>Select</th><th>Stop order</th><th>Stop name</th><th>Address</th><th>Pickup</th><th>Drop-off</th><th>ETA</th></tr></thead><tbody>
          {visibleStops.map(stop => <tr key={stop.id}>
            <td><input type="checkbox" aria-label={`Select ${stop.stopName}`} checked={selectedStopIds.includes(stop.id)} onChange={() => toggleStop(stop.id)}/></td>
            <td>{stop.stopOrder}</td><td><strong>{stop.stopName}</strong></td><td>{stop.stopAddress || '—'}</td>
            <td><span className={`status-pill ${stop.pickupAllowed ? 'active' : 'inactive'}`}>{stop.pickupAllowed ? 'Allowed' : 'Not allowed'}</span></td>
            <td><span className={`status-pill ${stop.dropAllowed ? 'active' : 'inactive'}`}>{stop.dropAllowed ? 'Allowed' : 'Not allowed'}</span></td>
            <td>{stop.estimatedArrivalTime?.slice(0, 5) || '—'}</td>
          </tr>)}
          {loading && <tr><td colSpan={7} className="empty-cell">Loading route stops…</td></tr>}
          {!loading && visibleStops.length === 0 && <tr><td colSpan={7} className="empty-cell">{search ? 'No route stops match your search.' : 'No active stops exist for this assignment route. Add route stops first.'}</td></tr>}
        </tbody></table></div>}
    </section>
    <p className="footnote"><MapPinned size={14}/> Mapping is specific to this bus assignment. A route stop can be served by multiple buses, and each bus can serve a different subset of the same route.</p>
  </>
}
