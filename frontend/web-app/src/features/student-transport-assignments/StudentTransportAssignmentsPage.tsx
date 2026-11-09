import type { FormEvent } from 'react'
import { api } from '../../pages/LegacyPages'
import { useCallback, useEffect, useState } from 'react'
import type { School, Student, SchoolRoute, RouteStop, StudentTransportAssignment, StudentTransportAssignmentForm } from '../../pages/LegacyPages'
import { emptyStudentTransportAssignment, downloadExcelReport, downloadPdfReport } from '../../pages/LegacyPages'
import { MoreVertical, RefreshCw, Users } from 'lucide-react'
import { DateInput, SearchInput, SelectInput, TextArea } from '../../components/ui/FormControls'

export function StudentTransportAssignmentsPage({ token, setError, setNotice }: { token: string; setError: (value: string) => void; setNotice: (value: string) => void }) {
  const [assignments, setAssignments] = useState<StudentTransportAssignment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [routes, setRoutes] = useState<SchoolRoute[]>([])
  const [stops, setStops] = useState<RouteStop[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [form, setForm] = useState<StudentTransportAssignmentForm>(emptyStudentTransportAssignment)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [assignmentRows, studentRows, routeRows, stopRows, schoolRows] = await Promise.all([
        api<StudentTransportAssignment[]>('/student-transport-assignment', token),
        api<Student[]>('/stu', token),
        api<SchoolRoute[]>('/route', token),
        api<RouteStop[]>('/route-stop', token),
        api<School[]>('/school', token).catch(() => [] as School[]),
      ])
      setAssignments(assignmentRows); setStudents(studentRows); setRoutes(routeRows); setStops(stopRows); setSchools(schoolRows)
      setForm(current => current.schoolId || !schoolRows.length ? current : { ...current, schoolId: schoolRows[0].id })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load student transport assignments.')
    } finally { setLoading(false) }
  }, [token, setError])
  useEffect(() => { void load() }, [load])

  const availableStudents = students.filter(x => x.status === 'ACTIVE' && (!form.schoolId || x.schoolId === Number(form.schoolId)))
  const availableRoutes = routes.filter(x => x.status === 'ACTIVE' && (!form.schoolId || x.schoolId === Number(form.schoolId)))
  const routeStops = stops.filter(x => x.status === 'ACTIVE' && x.routeId === Number(form.routeId))
  // Home is picked up in the morning and dropped in the afternoon; school is the reverse endpoint.
  const homeStops = routeStops.filter(x =>
    (!form.requiresPickup || x.pickupAllowed) && (!form.requiresDrop || x.dropAllowed))
  const schoolStops = routeStops.filter(x =>
    (!form.requiresPickup || x.dropAllowed) && (!form.requiresDrop || x.pickupAllowed))
  const studentLabel = (id: number) => {
    const x = students.find(row => row.id === id)
    return x ? `${x.firstName} ${x.lastName || ''} · ${x.admissionNumber}`.trim() : 'Unavailable student'
  }
  const routeLabel = (id: number) => {
    const x = routes.find(row => row.id === id)
    return x ? `${x.routeName} (${x.routeCode})` : 'Unavailable route'
  }
  const stopLabel = (id: number) => {
    const x = stops.find(row => row.id === id)
    return x ? x.stopName : 'Unavailable stop'
  }
  const schoolLabel = (id: number) => schools.find(row => row.id === id)?.name || '—'

  const filtered = assignments.filter(item => [
    studentLabel(item.studentId), routeLabel(item.routeId), stopLabel(item.pickupStopId), stopLabel(item.dropStopId),
    schoolLabel(item.schoolId), item.startDate, item.endDate, item.status,
  ].join(' ').toLowerCase().includes(search.toLowerCase()))

  function createForm() {
    setEditingId(null)
    setForm({ ...emptyStudentTransportAssignment, schoolId: schools[0]?.id || 0 })
    setShowForm(true)
  }
  function edit(item: StudentTransportAssignment) {
    setEditingId(item.id)
    setForm({
      schoolId: item.schoolId, studentId: item.studentId, routeId: item.routeId,
      pickupStopId: item.pickupStopId, dropStopId: item.dropStopId,
      requiresPickup: item.requiresPickup ?? true, requiresDrop: item.requiresDrop ?? true,
      startDate: item.startDate, endDate: item.endDate || '', remarks: item.remarks || '',
    })
    setShowForm(true)
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      if (!form.requiresPickup && !form.requiresDrop) throw new Error('Select at least one transport service.')
      if (Number(form.pickupStopId) === Number(form.dropStopId)) throw new Error('Home stop and school stop must be different.')
      const homeStop = stops.find(stop => stop.id === Number(form.pickupStopId))
      const schoolStop = stops.find(stop => stop.id === Number(form.dropStopId))
      if (!homeStop || !schoolStop) throw new Error("Select both the student's home stop and the school stop.")
      if (homeStop.routeId !== Number(form.routeId) || schoolStop.routeId !== Number(form.routeId)) {
        throw new Error('Both stops must belong to the selected route.')
      }
      if (form.requiresPickup && (!homeStop.pickupAllowed || !schoolStop.dropAllowed)) {
        throw new Error('Morning pickup requires pickup permission at home and drop-off permission at school.')
      }
      if (form.requiresDrop && (!schoolStop.pickupAllowed || !homeStop.dropAllowed)) {
        throw new Error('Afternoon drop requires pickup permission at school and drop-off permission at home.')
      }
      const payload = {
        ...form, schoolId: Number(form.schoolId), studentId: Number(form.studentId), routeId: Number(form.routeId),
        pickupStopId: Number(form.pickupStopId), dropStopId: Number(form.dropStopId),
        requiresPickup: Boolean(form.requiresPickup), requiresDrop: Boolean(form.requiresDrop),
        endDate: form.endDate || null, remarks: form.remarks || null,
      }
      await api<StudentTransportAssignment>(
        editingId ? `/student-transport-assignment/${editingId}` : '/student-transport-assignment',
        token, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) },
      )
      setNotice(editingId ? 'Student transport assignment updated successfully.' : 'Student assigned to route successfully.')
      setShowForm(false); setEditingId(null); setForm(emptyStudentTransportAssignment); await load()
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save student transport assignment.') }
    finally { setBusy(false) }
  }
  async function remove(item: StudentTransportAssignment) {
    if (!window.confirm(`Deactivate transport assignment for ${studentLabel(item.studentId)}?`)) return
    setError(''); setNotice('')
    try {
      await api<void>(`/student-transport-assignment/${item.id}`, token, { method: 'DELETE' })
      setNotice('Student transport assignment deactivated.'); await load()
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to deactivate assignment.') }
  }

  return <>
    {!showForm && <div className="page-intro"><div><h2>Student transport assignment</h2><p>Set the student's home and school stops. The morning journey runs Home → School and the afternoon journey automatically runs School → Home.</p></div><div className="page-header-actions"><button className="button primary" onClick={createForm}><Users size={15}/> Assign Student</button><button className="button secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={14}/> Refresh</button></div></div>}
    {showForm && <div className="record-page-header"><button type="button" className="breadcrumb-back" onClick={() => { setShowForm(false); setEditingId(null) }}>Student Transport Assignments</button><span>/</span><strong>{editingId ? 'Update assignment' : 'Assign student'}</strong></div>}
    {showForm && <section className="panel form-panel"><form onSubmit={submit}><div className="form-grid">
      <label className="field"><span>School *</span><SelectInput required value={form.schoolId || ''} onChange={e => setForm({ ...form, schoolId: Number(e.target.value), studentId: 0, routeId: 0, pickupStopId: 0, dropStopId: 0 })}><option value="">Select school</option>{schools.filter(x => x.status === 'ACTIVE').map(x => <option key={x.id} value={x.id}>{x.name} ({x.code})</option>)}</SelectInput></label>
      <label className="field"><span>Student *</span><SelectInput required value={form.studentId || ''} onChange={e => setForm({ ...form, studentId: Number(e.target.value) })}><option value="">Select active student</option>{availableStudents.map(x => <option key={x.id} value={x.id}>{x.firstName} {x.lastName || ''} · {x.admissionNumber} · {x.className}</option>)}</SelectInput></label>
      <label className="field"><span>Route *</span><SelectInput required value={form.routeId || ''} onChange={e => setForm({ ...form, routeId: Number(e.target.value), pickupStopId: 0, dropStopId: 0 })}><option value="">Select active route</option>{availableRoutes.map(x => <option key={x.id} value={x.id}>{x.routeName} ({x.routeCode})</option>)}</SelectInput></label>
      <label className="field"><span>Morning pickup service *</span><SelectInput required value={form.requiresPickup ? 'true' : 'false'} onChange={e => setForm({ ...form, requiresPickup: e.target.value === 'true' })}><option value="true">Required</option><option value="false">Not required</option></SelectInput></label>
      <label className="field"><span>Afternoon drop service *</span><SelectInput required value={form.requiresDrop ? 'true' : 'false'} onChange={e => setForm({ ...form, requiresDrop: e.target.value === 'true' })}><option value="true">Required</option><option value="false">Not required</option></SelectInput></label>
      <label className="field"><span>Home stop *</span><SelectInput required value={form.pickupStopId || ''} onChange={e => setForm({ ...form, pickupStopId: Number(e.target.value) })}><option value="">Select student's home stop</option>{homeStops.map(x => <option key={x.id} value={x.id}>{x.stopOrder}. {x.stopName}{x.stopAddress ? ` — ${x.stopAddress}` : ''}</option>)}</SelectInput></label>
      <label className="field"><span>School stop *</span><SelectInput required value={form.dropStopId || ''} onChange={e => setForm({ ...form, dropStopId: Number(e.target.value) })}><option value="">Select school stop</option>{schoolStops.map(x => <option key={x.id} value={x.id}>{x.stopOrder}. {x.stopName}{x.stopAddress ? ` — ${x.stopAddress}` : ''}</option>)}</SelectInput></label>
      <label className="field"><span>Start date *</span><DateInput value={form.startDate} onChange={value => setForm({ ...form, startDate: value })}/></label>
      <label className="field"><span>End date</span><DateInput value={form.endDate || ''} onChange={value => setForm({ ...form, endDate: value })}/></label>
      <label className="field field-wide"><span>Remarks</span><TextArea rows={2} maxLength={500} value={form.remarks || ''} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="Optional assignment notes"/></label>
    </div><div className="form-actions"><button type="button" className="button secondary" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</button><button className="button primary" disabled={busy || !schools.length || !availableStudents.length || !availableRoutes.length || homeStops.length === 0 || schoolStops.length === 0 || (!form.requiresPickup && !form.requiresDrop)}>{busy ? 'Saving…' : editingId ? 'Update assignment' : 'Save assignment'}</button></div>{(!availableStudents.length || !availableRoutes.length || homeStops.length === 0 || schoolStops.length === 0) && <p className="student-subtext">Select an active student and route, then choose a home stop and school stop with permissions matching the selected transport services.</p>}</form></section>}
    {!showForm && <section className="panel"><div className="panel-heading student-list-heading"><div><span className="section-kicker">STUDENT TRANSPORT</span><h3>Student assignments <small className="count-label">{filtered.length}</small></h3></div><div className="table-header-tools"><SearchInput className="student-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student, route or stop…"/><button type="button" className="button secondary report-button" onClick={() => downloadExcelReport('student-transport-assignments.xls', 'Student Transport Assignments Report', ['Student', 'Route', 'Home stop', 'School stop', 'Services', 'School', 'Start date', 'End date', 'Status'], filtered.map(x => [studentLabel(x.studentId), routeLabel(x.routeId), stopLabel(x.pickupStopId), stopLabel(x.dropStopId), [x.requiresPickup ? 'Morning pickup' : '', x.requiresDrop ? 'Afternoon drop' : ''].filter(Boolean).join(' + '), schoolLabel(x.schoolId), x.startDate, x.endDate || 'Ongoing', x.status]))}>Export Excel</button><button type="button" className="button secondary report-button" onClick={() => downloadPdfReport('Student Transport Assignments Report', ['Student', 'Route', 'Home stop', 'School stop', 'Services', 'Start', 'End', 'Status'], filtered.map(x => [studentLabel(x.studentId), routeLabel(x.routeId), stopLabel(x.pickupStopId), stopLabel(x.dropStopId), [x.requiresPickup ? 'Morning pickup' : '', x.requiresDrop ? 'Afternoon drop' : ''].filter(Boolean).join(' + '), x.startDate, x.endDate || 'Ongoing', x.status]))}>Export PDF</button></div></div>
    <div className="table-wrap"><table><thead><tr><th className="row-actions-heading" aria-label="Row actions"></th><th>Student</th><th>Route</th><th>Home stop</th><th>School stop</th><th>Services</th><th>School</th><th>Start date</th><th>End date</th><th>Status</th></tr></thead><tbody>
      {filtered.map(item => <tr key={item.id}><td className="row-actions-cell"><div className="row-action-menu"><button type="button" className="row-action-trigger" aria-label="Assignment actions" aria-haspopup="true" aria-expanded={openActionMenuId === item.id} onClick={() => setOpenActionMenuId(current => current === item.id ? null : item.id)}><MoreVertical size={18}/></button>{openActionMenuId === item.id && <div className="row-action-dropdown" role="menu"><button type="button" role="menuitem" onClick={() => { setOpenActionMenuId(null); edit(item) }}>Edit assignment</button>{item.status === 'ACTIVE' && <button type="button" role="menuitem" className="danger" onClick={() => { setOpenActionMenuId(null); void remove(item) }}>Delete assignment</button>}</div>}</div></td><td><strong>{studentLabel(item.studentId)}</strong></td><td>{routeLabel(item.routeId)}</td><td>{stopLabel(item.pickupStopId)}</td><td>{stopLabel(item.dropStopId)}</td><td>{[item.requiresPickup ? 'Morning pickup' : '', item.requiresDrop ? 'Afternoon drop' : ''].filter(Boolean).join(' + ')}</td><td>{schoolLabel(item.schoolId)}</td><td>{item.startDate}</td><td>{item.endDate || 'Ongoing'}</td><td><span className={`status-pill ${item.status === 'ACTIVE' ? 'active' : 'inactive'}`}>{item.status}</span></td></tr>)}
      {loading && <tr><td colSpan={10} className="empty-cell">Loading student assignments…</td></tr>}{!loading && filtered.length === 0 && <tr><td colSpan={10} className="empty-cell">{search ? 'No assignments match your search.' : 'No student transport assignments found. Assign a student to a route to get started.'}</td></tr>}
    </tbody></table></div></section>}
    {!showForm && <p className="footnote">Morning pickup and afternoon drop-off are independently optional. Home and school stops remain configured as journey endpoints; only the permissions needed for the selected service are required. Deleting an assignment deactivates it and preserves its history.</p>}
  </>
}
