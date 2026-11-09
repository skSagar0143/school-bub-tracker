import { api } from '../../pages/LegacyPages'
import { useCallback, useEffect, useState } from 'react'
import type { School, Bus, SchoolRoute, BusAssignment, BusAssignmentForm } from '../../pages/LegacyPages'
import { emptyBusAssignment, downloadExcelReport, downloadPdfReport } from '../../pages/LegacyPages'
import { BusFront, MoreVertical, RefreshCw, Route } from 'lucide-react'
import { DateInput, SearchInput, SelectInput, TextArea } from '../../components/ui/FormControls'

export function BusAssignmentsPage({ token, setError, setNotice }: { token: string; setError: (value: string) => void; setNotice: (value: string) => void }) {
  const [assignments, setAssignments] = useState<BusAssignment[]>([])
  const [buses, setBuses] = useState<Bus[]>([])
  const [routes, setRoutes] = useState<SchoolRoute[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [form, setForm] = useState<BusAssignmentForm>(emptyBusAssignment)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [assignmentRows, busRows, routeRows, schoolRows] = await Promise.all([
        api<BusAssignment[]>('/bus-assignment', token),
        api<Bus[]>('/bus', token),
        api<SchoolRoute[]>('/route', token),
        api<School[]>('/school', token).catch(() => [] as School[]),
      ])
      setAssignments(assignmentRows); setBuses(busRows); setRoutes(routeRows); setSchools(schoolRows)
      setForm(current => current.schoolId || !schoolRows.length ? current : { ...current, schoolId: schoolRows[0].id })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load bus assignments.')
    } finally { setLoading(false) }
  }, [token, setError])
  useEffect(() => { void load() }, [load])

  const filtered = assignments.filter(item => {
    const bus = buses.find(row => row.id === item.busId)
    const route = routes.find(row => row.id === item.routeId)
    const school = schools.find(row => row.id === item.schoolId)
    return [bus?.busNumber, bus?.registrationNumber, route?.routeName, route?.routeCode, school?.name, item.startDate, item.endDate, item.status]
      .filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase())
  })
  const availableBuses = buses.filter(row => row.status === 'ACTIVE' && (!form.schoolId || row.schoolId === Number(form.schoolId)))
  const availableRoutes = routes.filter(row => row.status === 'ACTIVE' && (!form.schoolId || row.schoolId === Number(form.schoolId)))
  const busLabel = (id: number) => { const row = buses.find(item => item.id === id); return row ? `${row.busNumber} · ${row.registrationNumber}` : 'Unavailable bus' }
  const routeLabel = (id: number) => { const row = routes.find(item => item.id === id); return row ? `${row.routeName} (${row.routeCode})` : 'Unavailable route' }
  const schoolLabel = (id: number) => schools.find(item => item.id === id)?.name || '—'
  function createForm() { setEditingId(null); setForm({ ...emptyBusAssignment, schoolId: schools[0]?.id || 0 }); setShowForm(true) }
  function edit(item: BusAssignment) { setEditingId(item.id); setForm({ schoolId:item.schoolId,busId:item.busId,routeId:item.routeId,startDate:item.startDate,endDate:item.endDate || '',remarks:item.remarks || '' }); setShowForm(true) }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      const payload = { ...form, schoolId:Number(form.schoolId), busId:Number(form.busId), routeId:Number(form.routeId), endDate:form.endDate || null, remarks:form.remarks || null }
      await api<BusAssignment>(editingId ? `/bus-assignment/${editingId}` : '/bus-assignment', token, { method:editingId?'PUT':'POST', body:JSON.stringify(payload) })
      setNotice(editingId ? 'Bus assignment updated successfully.' : 'Bus assigned to route successfully.')
      setShowForm(false); setEditingId(null); setForm(emptyBusAssignment); await load()
    } catch(err) { setError(err instanceof Error ? err.message : 'Unable to save bus assignment.') }
    finally { setBusy(false) }
  }
  async function remove(item: BusAssignment) {
    if (!window.confirm(`Deactivate assignment of ${busLabel(item.busId)} to ${routeLabel(item.routeId)}?`)) return
    setError(''); setNotice('')
    try { await api<void>(`/bus-assignment/${item.id}`,token,{method:'DELETE'}); setNotice('Bus assignment deactivated.'); await load() }
    catch(err) { setError(err instanceof Error ? err.message : 'Unable to deactivate assignment.') }
  }

  return <>
    {!showForm && <div className="page-intro"><div><h2>Bus assignment</h2><p>Connect an active school bus to a route and maintain its assignment period.</p></div><div className="page-header-actions"><button className="button primary" onClick={createForm}><BusFront size={15}/> Assign Bus</button><button className="button secondary" onClick={()=>void load()} disabled={loading}><RefreshCw size={14}/> Refresh</button></div></div>}
    {showForm && <div className="record-page-header"><button type="button" className="breadcrumb-back" onClick={()=>{setShowForm(false);setEditingId(null)}}>Bus Assignments</button><span>/</span><strong>{editingId?'Update assignment':'Assign bus'}</strong></div>}
    {showForm && <section className="panel form-panel"><form onSubmit={submit}><div className="form-grid">
      <label className="field"><span>School *</span><SelectInput required value={form.schoolId || ''} onChange={e=>setForm({...form,schoolId:Number(e.target.value),busId:0,routeId:0})}><option value="">Select school</option>{schools.filter(x=>x.status==='ACTIVE').map(x=><option key={x.id} value={x.id}>{x.name} ({x.code})</option>)}</SelectInput></label>
      <label className="field"><span>Bus *</span><SelectInput required value={form.busId || ''} onChange={e=>setForm({...form,busId:Number(e.target.value)})}><option value="">Select active bus</option>{availableBuses.map(x=><option key={x.id} value={x.id}>{x.busNumber} · {x.registrationNumber}</option>)}</SelectInput></label>
      <label className="field"><span>Route *</span><SelectInput required value={form.routeId || ''} onChange={e=>setForm({...form,routeId:Number(e.target.value)})}><option value="">Select active route</option>{availableRoutes.map(x=><option key={x.id} value={x.id}>{x.routeName} ({x.routeCode})</option>)}</SelectInput></label>
      <label className="field"><span>Start date *</span><DateInput value={form.startDate} onChange={value=>setForm({...form,startDate:value})}/></label>
      <label className="field"><span>End date</span><DateInput value={form.endDate || ''} onChange={value=>setForm({...form,endDate:value})}/></label>
      <label className="field field-wide"><span>Remarks</span><TextArea rows={2} maxLength={500} value={form.remarks || ''} onChange={e=>setForm({...form,remarks:e.target.value})} placeholder="Optional assignment notes"/></label>
    </div><div className="form-actions"><button type="button" className="button secondary" onClick={()=>{setShowForm(false);setEditingId(null)}}>Cancel</button><button className="button primary" disabled={busy || !schools.length || !availableBuses.length || !availableRoutes.length}>{busy?'Saving…':editingId?'Update assignment':'Save assignment'}</button></div>{(!availableBuses.length || !availableRoutes.length) && <p className="student-subtext">This school needs an active bus and an active route before an assignment can be created.</p>}</form></section>}
    {!showForm && <section className="panel"><div className="panel-heading student-list-heading"><div><span className="section-kicker">FLEET CONFIGURATION</span><h3>Bus assignments <small className="count-label">{filtered.length}</small></h3></div><div className="table-header-tools"><SearchInput className="student-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search bus, route or school…"/><button type="button" className="button secondary report-button" onClick={()=>downloadExcelReport('bus-assignments.xls','Bus Assignments Report',['Bus','Route','School','Start date','End date','Status','Remarks'],filtered.map(x=>[busLabel(x.busId),routeLabel(x.routeId),schoolLabel(x.schoolId),x.startDate,x.endDate||'Ongoing',x.status,x.remarks||'']))}>Export Excel</button><button type="button" className="button secondary report-button" onClick={()=>downloadPdfReport('Bus Assignments Report',['Bus','Route','School','Start','End','Status'],filtered.map(x=>[busLabel(x.busId),routeLabel(x.routeId),schoolLabel(x.schoolId),x.startDate,x.endDate||'Ongoing',x.status]))}>Export PDF</button></div></div>
    <div className="table-wrap"><table><thead><tr><th className="row-actions-heading" aria-label="Row actions"></th><th>Bus</th><th>Route</th><th>School</th><th>Start date</th><th>End date</th><th>Status</th></tr></thead><tbody>
      {filtered.map(item=><tr key={item.id}><td className="row-actions-cell"><div className="row-action-menu"><button type="button" className="row-action-trigger" aria-label={`Actions for assignment ${item.id}`} aria-haspopup="true" aria-expanded={openActionMenuId===item.id} onClick={()=>setOpenActionMenuId(current=>current===item.id?null:item.id)}><MoreVertical size={18}/></button>{openActionMenuId===item.id && <div className="row-action-dropdown" role="menu"><button type="button" role="menuitem" onClick={()=>{setOpenActionMenuId(null);edit(item)}}>Edit assignment</button>{item.status==='ACTIVE' && <button type="button" role="menuitem" className="danger" onClick={()=>{setOpenActionMenuId(null);void remove(item)}}>Delete assignment</button>}</div>}</div></td><td><strong>{busLabel(item.busId)}</strong></td><td>{routeLabel(item.routeId)}</td><td>{schoolLabel(item.schoolId)}</td><td>{item.startDate}</td><td>{item.endDate || 'Ongoing'}</td><td><span className={`status-pill ${item.status==='ACTIVE'?'active':'inactive'}`}>{item.status}</span></td></tr>)}
      {loading && <tr><td colSpan={7} className="empty-cell">Loading bus assignments…</td></tr>}{!loading && filtered.length===0 && <tr><td colSpan={7} className="empty-cell">{search?'No assignments match your search.':'No bus assignments found. Assign a bus to a route to get started.'}</td></tr>}
    </tbody></table></div></section>}
    {!showForm && <p className="footnote">Multiple buses may serve the same route. A bus itself cannot have overlapping active route assignments. Deleting an assignment deactivates it and preserves its history.</p>}
  </>
}
