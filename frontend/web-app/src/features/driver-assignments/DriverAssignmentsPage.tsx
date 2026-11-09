import { useCallback, useEffect, useState } from 'react'
import type { Driver, School, Bus, DriverAssignment, DriverAssignmentForm, SchoolDriver } from '../../pages/LegacyPages'
import { emptyDriverAssignment, downloadExcelReport, downloadPdfReport } from '../../pages/LegacyPages'
import { MoreVertical, RefreshCw, UserRound } from 'lucide-react'
import { DateInput, SearchInput, SelectInput, TextArea } from '../../components/ui/FormControls'

export function DriverAssignmentsPage({ token, setError, setNotice }: { token: string; setError: (value: string) => void; setNotice: (value: string) => void }) {
  const [assignments, setAssignments] = useState<DriverAssignment[]>([])
  const [buses, setBuses] = useState<Bus[]>([])
  const [drivers, setDrivers] = useState<SchoolDriver[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [form, setForm] = useState<DriverAssignmentForm>(emptyDriverAssignment)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [assignmentRows,busRows,driverRows,schoolRows] = await Promise.all([
        api<DriverAssignment[]>('/driver-assignment',token),api<Bus[]>('/bus',token),
        api<SchoolDriver[]>('/driver',token),api<School[]>('/school',token).catch(()=>[] as School[]),
      ])
      setAssignments(assignmentRows);setBuses(busRows);setDrivers(driverRows);setSchools(schoolRows)
      setForm(current=>current.schoolId||!schoolRows.length?current:{...current,schoolId:schoolRows[0].id})
    } catch(err) { setError(err instanceof Error?err.message:'Unable to load driver assignments.') }
    finally { setLoading(false) }
  },[token,setError])
  useEffect(()=>{void load()},[load])

  const filtered=assignments.filter(item=>{
    const bus=buses.find(x=>x.id===item.busId);const driver=drivers.find(x=>x.id===item.driverId);const school=schools.find(x=>x.id===item.schoolId)
    return [bus?.busNumber,bus?.registrationNumber,driver?.firstName,driver?.lastName,driver?.driverCode,school?.name,item.startDate,item.endDate,item.status].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase())
  })
  const availableBuses=buses.filter(x=>x.status==='ACTIVE'&&(!form.schoolId||x.schoolId===Number(form.schoolId)))
  const availableDrivers=drivers.filter(x=>x.status==='ACTIVE'&&(!form.schoolId||x.schoolId===Number(form.schoolId)))
  const busLabel=(id:number)=>{const x=buses.find(row=>row.id===id);return x?`${x.busNumber} · ${x.registrationNumber}`:'Unavailable bus'}
  const driverLabel=(id:number)=>{const x=drivers.find(row=>row.id===id);return x?`${x.firstName} ${x.lastName||''} (${x.driverCode})`.trim():'Unavailable driver'}
  const schoolLabel=(id:number)=>schools.find(x=>x.id===id)?.name||'—'
  function createForm(){setEditingId(null);setForm({...emptyDriverAssignment,schoolId:schools[0]?.id||0});setShowForm(true)}
  function edit(item:DriverAssignment){setEditingId(item.id);setForm({schoolId:item.schoolId,busId:item.busId,driverId:item.driverId,startDate:item.startDate,endDate:item.endDate||'',remarks:item.remarks||''});setShowForm(true)}
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError('');setNotice('')
    try{
      const payload={...form,schoolId:Number(form.schoolId),busId:Number(form.busId),driverId:Number(form.driverId),endDate:form.endDate||null,remarks:form.remarks||null}
      await api<DriverAssignment>(editingId?`/driver-assignment/${editingId}`:'/driver-assignment',token,{method:editingId?'PUT':'POST',body:JSON.stringify(payload)})
      setNotice(editingId?'Driver assignment updated successfully.':'Driver assigned to bus successfully.')
      setShowForm(false);setEditingId(null);setForm(emptyDriverAssignment);await load()
    }catch(err){setError(err instanceof Error?err.message:'Unable to save driver assignment.')}
    finally{setBusy(false)}
  }
  async function remove(item:DriverAssignment){
    if(!window.confirm(`Deactivate assignment of ${driverLabel(item.driverId)} to ${busLabel(item.busId)}?`))return
    setError('');setNotice('')
    try{await api<void>(`/driver-assignment/${item.id}`,token,{method:'DELETE'});setNotice('Driver assignment deactivated.');await load()}
    catch(err){setError(err instanceof Error?err.message:'Unable to deactivate assignment.')}
  }

  return <>
    {!showForm&&<div className="page-intro"><div><h2>Driver assignment</h2><p>Assign active drivers to school buses and maintain assignment periods and history.</p></div><div className="page-header-actions"><button className="button primary" onClick={createForm}><UserRound size={15}/> Assign Driver</button><button className="button secondary" onClick={()=>void load()} disabled={loading}><RefreshCw size={14}/> Refresh</button></div></div>}
    {showForm&&<div className="record-page-header"><button type="button" className="breadcrumb-back" onClick={()=>{setShowForm(false);setEditingId(null)}}>Driver Assignments</button><span>/</span><strong>{editingId?'Update assignment':'Assign driver'}</strong></div>}
    {showForm&&<section className="panel form-panel"><form onSubmit={submit}><div className="form-grid">
      <label className="field"><span>School *</span><SelectInput required value={form.schoolId||''} onChange={e=>setForm({...form,schoolId:Number(e.target.value),busId:0,driverId:0})}><option value="">Select school</option>{schools.filter(x=>x.status==='ACTIVE').map(x=><option key={x.id} value={x.id}>{x.name} ({x.code})</option>)}</SelectInput></label>
      <label className="field"><span>Bus *</span><SelectInput required value={form.busId||''} onChange={e=>setForm({...form,busId:Number(e.target.value)})}><option value="">Select active bus</option>{availableBuses.map(x=><option key={x.id} value={x.id}>{x.busNumber} · {x.registrationNumber}</option>)}</SelectInput></label>
      <label className="field"><span>Driver *</span><SelectInput required value={form.driverId||''} onChange={e=>setForm({...form,driverId:Number(e.target.value)})}><option value="">Select active driver</option>{availableDrivers.map(x=><option key={x.id} value={x.id}>{x.firstName} {x.lastName||''} · {x.driverCode}</option>)}</SelectInput></label>
      <label className="field"><span>Start date *</span><DateInput value={form.startDate} onChange={value=>setForm({...form,startDate:value})}/></label>
      <label className="field"><span>End date</span><DateInput value={form.endDate||''} onChange={value=>setForm({...form,endDate:value})}/></label>
      <label className="field field-wide"><span>Remarks</span><TextArea rows={2} maxLength={500} value={form.remarks||''} onChange={e=>setForm({...form,remarks:e.target.value})} placeholder="Optional assignment notes"/></label>
    </div><div className="form-actions"><button type="button" className="button secondary" onClick={()=>{setShowForm(false);setEditingId(null)}}>Cancel</button><button className="button primary" disabled={busy||!schools.length||!availableBuses.length||!availableDrivers.length}>{busy?'Saving…':editingId?'Update assignment':'Save assignment'}</button></div>{(!availableBuses.length||!availableDrivers.length)&&<p className="student-subtext">This school needs an active bus and an active driver before an assignment can be created.</p>}</form></section>}
    {!showForm&&<section className="panel"><div className="panel-heading student-list-heading"><div><span className="section-kicker">DRIVER OPERATIONS</span><h3>Driver assignments <small className="count-label">{filtered.length}</small></h3></div><div className="table-header-tools"><SearchInput className="student-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search driver, bus or school…"/><button type="button" className="button secondary report-button" onClick={()=>downloadExcelReport('driver-assignments.xls','Driver Assignments Report',['Driver','Bus','School','Start date','End date','Status','Remarks'],filtered.map(x=>[driverLabel(x.driverId),busLabel(x.busId),schoolLabel(x.schoolId),x.startDate,x.endDate||'Ongoing',x.status,x.remarks||'']))}>Export Excel</button><button type="button" className="button secondary report-button" onClick={()=>downloadPdfReport('Driver Assignments Report',['Driver','Bus','School','Start','End','Status'],filtered.map(x=>[driverLabel(x.driverId),busLabel(x.busId),schoolLabel(x.schoolId),x.startDate,x.endDate||'Ongoing',x.status]))}>Export PDF</button></div></div>
    <div className="table-wrap"><table><thead><tr><th className="row-actions-heading" aria-label="Row actions"></th><th>Driver</th><th>Bus</th><th>School</th><th>Start date</th><th>End date</th><th>Status</th></tr></thead><tbody>
      {filtered.map(item=><tr key={item.id}><td className="row-actions-cell"><div className="row-action-menu"><button type="button" className="row-action-trigger" aria-label={`Actions for assignment ${item.id}`} aria-haspopup="true" aria-expanded={openActionMenuId===item.id} onClick={()=>setOpenActionMenuId(current=>current===item.id?null:item.id)}><MoreVertical size={18}/></button>{openActionMenuId===item.id&&<div className="row-action-dropdown" role="menu"><button type="button" role="menuitem" onClick={()=>{setOpenActionMenuId(null);edit(item)}}>Edit assignment</button>{item.status==='ACTIVE'&&<button type="button" role="menuitem" className="danger" onClick={()=>{setOpenActionMenuId(null);void remove(item)}}>Delete assignment</button>}</div>}</div></td><td><strong>{driverLabel(item.driverId)}</strong></td><td>{busLabel(item.busId)}</td><td>{schoolLabel(item.schoolId)}</td><td>{item.startDate}</td><td>{item.endDate||'Ongoing'}</td><td><span className={`status-pill ${item.status==='ACTIVE'?'active':'inactive'}`}>{item.status}</span></td></tr>)}
      {loading&&<tr><td colSpan={7} className="empty-cell">Loading driver assignments…</td></tr>}{!loading&&filtered.length===0&&<tr><td colSpan={7} className="empty-cell">{search?'No assignments match your search.':'No driver assignments found. Assign a driver to a bus to get started.'}</td></tr>}
    </tbody></table></div></section>}
    {!showForm&&<p className="footnote">A driver and a bus cannot have overlapping active assignments. Deleting an assignment deactivates it and preserves its history.</p>}
  </>
}
