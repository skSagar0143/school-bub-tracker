import type { FormEvent } from 'react'
import { api } from '../../pages/LegacyPages'
import { useCallback, useEffect, useState } from 'react'
import type { School, SchoolRoute, SchoolRouteForm } from '../../pages/LegacyPages'
import { emptySchoolRoute, downloadExcelReport, downloadPdfReport } from '../../pages/LegacyPages'
import { MoreVertical, RefreshCw, Route } from 'lucide-react'
import { TextInput, NumberInput, SearchInput, SelectInput, TextArea } from '../../components/ui/FormControls'

export function RoutesPage({ token, setError, setNotice }: { token: string; setError: (value: string) => void; setNotice: (value: string) => void }) {
  const [routes, setRoutes] = useState<SchoolRoute[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [form, setForm] = useState<SchoolRouteForm>(emptySchoolRoute)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [routeRows, schoolRows] = await Promise.all([
        api<SchoolRoute[]>('/route', token),
        api<School[]>('/school', token).catch(() => [] as School[]),
      ])
      setRoutes(routeRows)
      setSchools(schoolRows)
      setForm(current => current.schoolId || !schoolRows.length ? current : { ...current, schoolId: schoolRows[0].id })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load routes.')
    } finally {
      setLoading(false)
    }
  }, [token, setError])

  useEffect(() => { void load() }, [load])

  const filteredRoutes = routes.filter(route =>
    [route.routeCode, route.routeName, route.startingPoint, route.endingPoint, route.description]
      .filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase())
  )

  function openCreateForm() {
    setEditingId(null)
    setForm({ ...emptySchoolRoute, schoolId: schools[0]?.id || 0 })
    setShowForm(true)
  }

  function editRoute(route: SchoolRoute) {
    setEditingId(route.id)
    setForm({
      schoolId: route.schoolId, routeCode: route.routeCode, routeName: route.routeName,
      description: route.description || '', startingPoint: route.startingPoint, endingPoint: route.endingPoint,
      estimatedDistance: route.estimatedDistance, estimatedDuration: route.estimatedDuration,
      startTime: route.startTime || '', endTime: route.endTime || '',
    })
    setShowForm(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setError(''); setNotice('')
    try {
      const payload = {
        ...form,
        schoolId: Number(form.schoolId),
        description: form.description || null,
        estimatedDistance: form.estimatedDistance === null || form.estimatedDistance === undefined || form.estimatedDistance === ('' as unknown as number) ? null : Number(form.estimatedDistance),
        estimatedDuration: form.estimatedDuration === null || form.estimatedDuration === undefined || form.estimatedDuration === ('' as unknown as number) ? null : Number(form.estimatedDuration),
        startTime: form.startTime || null,
        endTime: form.endTime || null,
      }
      await api<SchoolRoute>(editingId ? `/route/${editingId}` : '/route', token, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })
      setNotice(editingId ? 'Route details updated successfully.' : 'Route created successfully.')
      setShowForm(false); setEditingId(null); setForm(emptySchoolRoute)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save route.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteRoute(route: SchoolRoute) {
    if (!window.confirm(`Deactivate route ${route.routeCode} — ${route.routeName}? Historical transport records will be preserved.`)) return
    setError(''); setNotice('')
    try {
      await api<void>(`/route/${route.id}`, token, { method: 'DELETE' })
      setNotice('Route deactivated successfully.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to deactivate route.')
    }
  }

  return <>
    {!showForm && <div className="page-intro">
      <div><h2>Route management</h2><p>Create and manage school transport routes, timings and estimated journey details.</p></div>
      <div className="page-header-actions">
        <button className="button primary" onClick={openCreateForm}><Route size={15} /> Add Route</button>
        <button className="button secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={14} /> Refresh</button>
      </div>
    </div>}
    {showForm && <div className="record-page-header"><button type="button" className="breadcrumb-back" onClick={() => { setShowForm(false); setEditingId(null) }}>Routes</button><span>/</span><strong>{editingId ? 'Update route' : 'Add route'}</strong></div>}

    {showForm && <section className="panel form-panel">
      <form onSubmit={submit}>
        <div className="form-grid">
          <label className="field"><span>School *</span><SelectInput required value={form.schoolId || ''} onChange={e => setForm({ ...form, schoolId: Number(e.target.value) })}><option value="">Select school</option>{schools.map(school => <option key={school.id} value={school.id}>{school.name} ({school.code})</option>)}</SelectInput></label>
          <label className="field"><span>Route code *</span><TextInput required maxLength={50} value={form.routeCode} onChange={e => setForm({ ...form, routeCode: e.target.value.toUpperCase() })} placeholder="e.g. RT-001" /></label>
          <label className="field"><span>Route name *</span><TextInput required maxLength={150} value={form.routeName} onChange={e => setForm({ ...form, routeName: e.target.value })} placeholder="e.g. Noida Sector 15 Route" /></label>
          <label className="field"><span>Starting point *</span><TextInput required maxLength={200} value={form.startingPoint} onChange={e => setForm({ ...form, startingPoint: e.target.value })} /></label>
          <label className="field"><span>Ending point *</span><TextInput required maxLength={200} value={form.endingPoint} onChange={e => setForm({ ...form, endingPoint: e.target.value })} /></label>
          <label className="field"><span>Estimated distance (km)</span><NumberInput type="number" min="0" step="0.1" value={form.estimatedDistance ?? ''} onChange={e => setForm({ ...form, estimatedDistance: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 12.5" /></label>
          <label className="field"><span>Estimated duration (minutes)</span><NumberInput type="number" min="1" step="1" value={form.estimatedDuration ?? ''} onChange={e => setForm({ ...form, estimatedDuration: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 45" /></label>
          <label className="field"><span>Start time</span><TextInput type="time" value={form.startTime || ''} onChange={e => setForm({ ...form, startTime: e.target.value })} /></label>
          <label className="field"><span>End time</span><TextInput type="time" value={form.endTime || ''} onChange={e => setForm({ ...form, endTime: e.target.value })} /></label>
          <label className="field field-wide"><span>Description</span><TextArea rows={2} maxLength={500} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional route notes" /></label>
        </div>
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</button>
          <button className="button primary" disabled={busy || !schools.length}>{busy ? 'Saving…' : editingId ? 'Update route' : 'Save route'}</button>
        </div>
        {!schools.length && <p className="student-subtext">Create an active school record before adding a route.</p>}
      </form>
    </section>}

    {!showForm && <>
      <section className="panel">
        <div className="panel-heading student-list-heading">
          <div><span className="section-kicker">SCHOOL TRANSPORT</span><h3>All routes <small className="count-label">{filteredRoutes.length}</small></h3></div>
          <div className="table-header-tools">
            <SearchInput className="student-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search route code, name or location…" />
            <button type="button" className="button secondary report-button" onClick={() => downloadExcelReport('routes-report.xls', 'Routes Report', ['Route code', 'Route name', 'Starting point', 'Ending point', 'Distance (km)', 'Duration (minutes)', 'Start time', 'End time', 'School', 'Status'], filteredRoutes.map(route => [route.routeCode, route.routeName, route.startingPoint, route.endingPoint, route.estimatedDistance ?? '', route.estimatedDuration ?? '', route.startTime || '', route.endTime || '', schools.find(school => school.id === route.schoolId)?.name || '', route.status]))}>Export Excel</button>
            <button type="button" className="button secondary report-button" onClick={() => downloadPdfReport('Routes Report', ['Route code', 'Route name', 'From', 'To', 'Distance', 'Duration', 'School', 'Status'], filteredRoutes.map(route => [route.routeCode, route.routeName, route.startingPoint, route.endingPoint, route.estimatedDistance ?? '', route.estimatedDuration ?? '', schools.find(school => school.id === route.schoolId)?.name || '', route.status]))}>Export PDF</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th className="row-actions-heading" aria-label="Row actions"></th><th>Route</th><th>Starting point</th><th>Ending point</th><th>Distance</th><th>Duration</th><th>Schedule</th><th>School</th><th>Status</th></tr></thead>
            <tbody>
              {filteredRoutes.map(route => <tr key={route.id}>
                <td className="row-actions-cell"><div className="row-action-menu"><button type="button" className="row-action-trigger" aria-label={`Actions for ${route.routeCode}`} aria-haspopup="true" aria-expanded={openActionMenuId === route.id} onClick={() => setOpenActionMenuId(current => current === route.id ? null : route.id)}><MoreVertical size={18} /></button>{openActionMenuId === route.id && <div className="row-action-dropdown" role="menu"><button type="button" role="menuitem" onClick={() => { setOpenActionMenuId(null); editRoute(route) }}>Edit route</button>{route.status === 'ACTIVE' && <button type="button" role="menuitem" className="danger" onClick={() => { setOpenActionMenuId(null); void deleteRoute(route) }}>Delete route</button>}</div>}</div></td>
                <td><strong>{route.routeName}</strong><span className="student-subtext">{route.routeCode}</span></td>
                <td>{route.startingPoint}</td><td>{route.endingPoint}</td>
                <td>{route.estimatedDistance != null ? `${route.estimatedDistance} km` : '—'}</td>
                <td>{route.estimatedDuration != null ? `${route.estimatedDuration} min` : '—'}</td>
                <td>{route.startTime || route.endTime ? `${route.startTime || '—'} – ${route.endTime || '—'}` : '—'}</td>
                <td>{schools.find(school => school.id === route.schoolId)?.name || '—'}</td>
                <td><span className={`status-pill ${route.status === 'ACTIVE' ? 'active' : 'inactive'}`}>{route.status}</span></td>
              </tr>)}
              {loading && <tr><td colSpan={9} className="empty-cell">Loading routes…</td></tr>}
              {!loading && filteredRoutes.length === 0 && <tr><td colSpan={9} className="empty-cell">{search ? 'No routes match your search.' : 'No routes found. Add your first route.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <p className="footnote">Deleting a route deactivates it instead of removing the database record. Pickup and drop-off stops will be managed separately.</p>
    </>}
  </>
}
