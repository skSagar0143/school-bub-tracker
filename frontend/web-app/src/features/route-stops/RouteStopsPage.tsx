import type { FormEvent } from 'react'
import { api } from '../../pages/LegacyPages'
import { useCallback, useEffect, useState } from 'react'
import type { SchoolRoute, RouteStop, RouteStopForm } from '../../pages/LegacyPages'
import { emptyRouteStop, downloadExcelReport, downloadPdfReport } from '../../pages/LegacyPages'
import { MapPinned, MoreVertical, RefreshCw } from 'lucide-react'
import { TextInput, TimeInput, NumberInput, SearchInput, SelectInput, TextArea } from '../../components/ui/FormControls'

export function RouteStopsPage({ token, setError, setNotice }: { token: string; setError: (value: string) => void; setNotice: (value: string) => void }) {
  const [stops, setStops] = useState<RouteStop[]>([])
  const [routes, setRoutes] = useState<SchoolRoute[]>([])
  const [form, setForm] = useState<RouteStopForm>(emptyRouteStop)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [stopRows, routeRows] = await Promise.all([
        api<RouteStop[]>('/route-stop', token),
        api<SchoolRoute[]>('/route', token),
      ])
      setStops(stopRows)
      setRoutes(routeRows)
      setForm(current => current.routeId || !routeRows.length ? current : { ...current, routeId: routeRows[0].id })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load route stops.')
    } finally {
      setLoading(false)
    }
  }, [token, setError])

  useEffect(() => { void load() }, [load])

  const filteredStops = stops.filter(stop => {
    const route = routes.find(item => item.id === stop.routeId)
    return [stop.stopName, stop.stopAddress, route?.routeName, route?.routeCode, String(stop.stopOrder)]
      .filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase())
  })

  function openCreateForm() {
    setEditingId(null)
    setForm({ ...emptyRouteStop, routeId: routes[0]?.id || 0, stopOrder: 1 })
    setShowForm(true)
  }

  function editStop(stop: RouteStop) {
    setEditingId(stop.id)
    setForm({
      routeId: stop.routeId, stopName: stop.stopName, stopAddress: stop.stopAddress || '',
      stopOrder: stop.stopOrder, latitude: stop.latitude, longitude: stop.longitude,
      estimatedArrivalTime: stop.estimatedArrivalTime ? stop.estimatedArrivalTime.slice(0, 5) : '',
      pickupAllowed: stop.pickupAllowed, dropAllowed: stop.dropAllowed,
    })
    setShowForm(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setError(''); setNotice('')
    try {
      const payload = {
        ...form,
        routeId: Number(form.routeId),
        stopOrder: Number(form.stopOrder),
        stopAddress: form.stopAddress || null,
        latitude: form.latitude === null || form.latitude === ('' as unknown as number) ? null : Number(form.latitude),
        longitude: form.longitude === null || form.longitude === ('' as unknown as number) ? null : Number(form.longitude),
        estimatedArrivalTime: form.estimatedArrivalTime ? (form.estimatedArrivalTime.length === 5 ? form.estimatedArrivalTime + ':00' : form.estimatedArrivalTime) : null,
      }
      await api<RouteStop>(editingId ? `/route-stop/${editingId}` : '/route-stop', token, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })
      setNotice(editingId ? 'Route stop updated successfully.' : 'Route stop created successfully.')
      setShowForm(false); setEditingId(null); setForm(emptyRouteStop)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save route stop.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteStop(stop: RouteStop) {
    if (!window.confirm(`Deactivate stop "${stop.stopName}"? Historical transport records will be preserved.`)) return
    setError(''); setNotice('')
    try {
      await api<void>(`/route-stop/${stop.id}`, token, { method: 'DELETE' })
      setNotice('Route stop deactivated successfully.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to deactivate route stop.')
    }
  }

  const routeLabel = (routeId: number) => {
    const route = routes.find(item => item.id === routeId)
    return route ? `${route.routeName} (${route.routeCode})` : '—'
  }

  return <>
    {!showForm && <div className="page-intro">
      <div><h2>Route stop management</h2><p>Manage pickup and drop-off points, stop sequence and expected arrival times for each route.</p></div>
      <div className="page-header-actions">
        <button className="button primary" onClick={openCreateForm}><MapPinned size={15} /> Add Stop</button>
        <button className="button secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={14} /> Refresh</button>
      </div>
    </div>}
    {showForm && <div className="record-page-header"><button type="button" className="breadcrumb-back" onClick={() => { setShowForm(false); setEditingId(null) }}>Route Stops</button><span>/</span><strong>{editingId ? 'Update stop' : 'Add stop'}</strong></div>}

    {showForm && <section className="panel form-panel">
      <form onSubmit={submit}>
        <div className="form-grid">
          <label className="field"><span>Route *</span><SelectInput required value={form.routeId || ''} onChange={e => setForm({ ...form, routeId: Number(e.target.value) })}><option value="">Select route</option>{routes.filter(route => route.status === 'ACTIVE').map(route => <option key={route.id} value={route.id}>{route.routeName} ({route.routeCode})</option>)}</SelectInput></label>
          <label className="field"><span>Stop name *</span><TextInput required maxLength={150} value={form.stopName} onChange={e => setForm({ ...form, stopName: e.target.value })} placeholder="e.g. Noida Sector 15 Metro Station" /></label>
          <label className="field"><span>Stop order *</span><NumberInput required type="number" min="1" step="1" value={form.stopOrder} onChange={e => setForm({ ...form, stopOrder: Number(e.target.value) })} /></label>
          <label className="field"><span>Estimated arrival time</span><TimeInput value={form.estimatedArrivalTime || ''} onChange={value => setForm({ ...form, estimatedArrivalTime: value })} /></label>
          <label className="field"><span>Latitude</span><NumberInput type="number" min="-90" max="90" step="any" value={form.latitude ?? ''} onChange={e => setForm({ ...form, latitude: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 28.5852" /></label>
          <label className="field"><span>Longitude</span><NumberInput type="number" min="-180" max="180" step="any" value={form.longitude ?? ''} onChange={e => setForm({ ...form, longitude: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 77.3119" /></label>
          <label className="field field-wide"><span>Stop address</span><TextArea rows={2} maxLength={500} value={form.stopAddress || ''} onChange={e => setForm({ ...form, stopAddress: e.target.value })} placeholder="Enter the complete pickup/drop-off address" /></label>
          <label className="field"><span>Pickup allowed</span><SelectInput value={String(form.pickupAllowed)} onChange={e => setForm({ ...form, pickupAllowed: e.target.value === 'true' })}><option value="true">Yes</option><option value="false">No</option></SelectInput></label>
          <label className="field"><span>Drop-off allowed</span><SelectInput value={String(form.dropAllowed)} onChange={e => setForm({ ...form, dropAllowed: e.target.value === 'true' })}><option value="true">Yes</option><option value="false">No</option></SelectInput></label>
        </div>
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</button>
          <button className="button primary" disabled={busy || !routes.some(route => route.status === 'ACTIVE')}>{busy ? 'Saving…' : editingId ? 'Update stop' : 'Save stop'}</button>
        </div>
        {!routes.some(route => route.status === 'ACTIVE') && <p className="student-subtext">Create an active route before adding route stops.</p>}
      </form>
    </section>}

    {!showForm && <>
      <section className="panel">
        <div className="panel-heading student-list-heading">
          <div><span className="section-kicker">ROUTE CONFIGURATION</span><h3>All route stops <small className="count-label">{filteredStops.length}</small></h3></div>
          <div className="table-header-tools">
            <SearchInput className="student-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stop, route or address…" />
            <button type="button" className="button secondary report-button" onClick={() => downloadExcelReport('route-stops-report.xls', 'Route Stops Report', ['Route', 'Stop name', 'Stop order', 'Address', 'Arrival time', 'Pickup allowed', 'Drop-off allowed', 'Latitude', 'Longitude', 'Status'], filteredStops.map(stop => [routeLabel(stop.routeId), stop.stopName, stop.stopOrder, stop.stopAddress || '', stop.estimatedArrivalTime || '', stop.pickupAllowed ? 'Yes' : 'No', stop.dropAllowed ? 'Yes' : 'No', stop.latitude ?? '', stop.longitude ?? '', stop.status]))}>Export Excel</button>
            <button type="button" className="button secondary report-button" onClick={() => downloadPdfReport('Route Stops Report', ['Route', 'Stop name', 'Order', 'Arrival', 'Pickup', 'Drop-off', 'Status'], filteredStops.map(stop => [routeLabel(stop.routeId), stop.stopName, stop.stopOrder, stop.estimatedArrivalTime || '', stop.pickupAllowed ? 'Yes' : 'No', stop.dropAllowed ? 'Yes' : 'No', stop.status]))}>Export PDF</button>
          </div>
        </div>
        <div className="table-wrap"><table>
          <thead><tr><th className="row-actions-heading" aria-label="Row actions"></th><th>Stop</th><th>Route</th><th>Order</th><th>Address</th><th>Arrival time</th><th>Pickup</th><th>Drop-off</th><th>Status</th></tr></thead>
          <tbody>
            {filteredStops.map(stop => <tr key={stop.id}>
              <td className="row-actions-cell"><div className="row-action-menu"><button type="button" className="row-action-trigger" aria-label={`Actions for ${stop.stopName}`} aria-haspopup="true" aria-expanded={openActionMenuId === stop.id} onClick={() => setOpenActionMenuId(current => current === stop.id ? null : stop.id)}><MoreVertical size={18} /></button>{openActionMenuId === stop.id && <div className="row-action-dropdown" role="menu"><button type="button" role="menuitem" onClick={() => { setOpenActionMenuId(null); editStop(stop) }}>Edit stop</button>{stop.status === 'ACTIVE' && <button type="button" role="menuitem" className="danger" onClick={() => { setOpenActionMenuId(null); void deleteStop(stop) }}>Delete stop</button>}</div>}</div></td>
              <td><strong>{stop.stopName}</strong></td>
              <td>{routeLabel(stop.routeId)}</td>
              <td>{stop.stopOrder}</td>
              <td>{stop.stopAddress || '—'}</td>
              <td>{stop.estimatedArrivalTime ? stop.estimatedArrivalTime.slice(0, 5) : '—'}</td>
              <td><span className={`status-pill ${stop.pickupAllowed ? 'active' : 'inactive'}`}>{stop.pickupAllowed ? 'Allowed' : 'No'}</span></td>
              <td><span className={`status-pill ${stop.dropAllowed ? 'active' : 'inactive'}`}>{stop.dropAllowed ? 'Allowed' : 'No'}</span></td>
              <td><span className={`status-pill ${stop.status === 'ACTIVE' ? 'active' : 'inactive'}`}>{stop.status}</span></td>
            </tr>)}
            {loading && <tr><td colSpan={9} className="empty-cell">Loading route stops…</td></tr>}
            {!loading && filteredStops.length === 0 && <tr><td colSpan={9} className="empty-cell">{search ? 'No route stops match your search.' : 'No route stops found. Add the first stop to a route.'}</td></tr>}
          </tbody>
        </table></div>
      </section>
      <p className="footnote">Stops are displayed by their configured sequence within each route. Deleting a stop deactivates it and preserves historical records.</p>
    </>}
  </>
}
