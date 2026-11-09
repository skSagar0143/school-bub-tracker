import type { FormEvent } from 'react'
import { api } from '../../pages/LegacyPages'
import { useCallback, useEffect, useState } from 'react'
import type { School, SchoolDriver, SchoolDriverForm } from '../../pages/LegacyPages'
import { emptySchoolDriver, downloadExcelReport, downloadPdfReport } from '../../pages/LegacyPages'
import { MoreVertical, RefreshCw, UserRound } from 'lucide-react'
import { TextInput, EmailInput, PhoneInput, DateInput, SearchInput, SelectInput, TextArea } from '../../components/ui/FormControls'

export function DriversPage({ token, setError, setNotice }: { token: string; setError: (value: string) => void; setNotice: (value: string) => void }) {
  const [drivers, setDrivers] = useState<SchoolDriver[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [form, setForm] = useState<SchoolDriverForm>(emptySchoolDriver)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [driverRows, schoolRows] = await Promise.all([
        api<SchoolDriver[]>('/driver', token),
        api<School[]>('/school', token).catch(() => [] as School[]),
      ])
      setDrivers(driverRows)
      setSchools(schoolRows)
      setForm(current => current.schoolId || !schoolRows.length ? current : { ...current, schoolId: schoolRows[0].id })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load drivers.')
    } finally {
      setLoading(false)
    }
  }, [token, setError])

  useEffect(() => { void load() }, [load])

  const filteredDrivers = drivers.filter(driver =>
    [driver.driverCode, driver.firstName, driver.lastName, driver.phone, driver.email, driver.licenseNumber]
      .filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase())
  )

  function openCreateForm() {
    setEditingId(null)
    setForm({ ...emptySchoolDriver, schoolId: schools[0]?.id || 0 })
    setShowForm(true)
  }

  function editDriver(driver: SchoolDriver) {
    setEditingId(driver.id)
    setForm({
      schoolId: driver.schoolId, driverCode: driver.driverCode, firstName: driver.firstName,
      lastName: driver.lastName || '', dateOfBirth: driver.dateOfBirth || '', gender: driver.gender || '',
      phone: driver.phone, alternatePhone: driver.alternatePhone || '', email: driver.email || '',
      address: driver.address || '', city: driver.city || '', state: driver.state || '',
      pincode: driver.pincode || '', licenseNumber: driver.licenseNumber, licenseType: driver.licenseType || '',
      licenseExpiryDate: driver.licenseExpiryDate || '', joiningDate: driver.joiningDate || '',
      emergencyContactName: driver.emergencyContactName || '',
      emergencyContactPhone: driver.emergencyContactPhone || '',
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
        lastName: form.lastName || null,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        alternatePhone: form.alternatePhone || null,
        email: form.email || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        pincode: form.pincode || null,
        licenseType: form.licenseType || null,
        licenseExpiryDate: form.licenseExpiryDate || null,
        joiningDate: form.joiningDate || null,
        emergencyContactName: form.emergencyContactName || null,
        emergencyContactPhone: form.emergencyContactPhone || null,
      }
      await api<SchoolDriver>(editingId ? `/driver/${editingId}` : '/driver', token, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })
      setNotice(editingId ? 'Driver details updated successfully.' : 'Driver added successfully.')
      setShowForm(false); setEditingId(null); setForm(emptySchoolDriver)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save driver.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteDriver(driver: SchoolDriver) {
    if (!window.confirm(`Deactivate driver ${driver.firstName} ${driver.lastName || ''}? Historical transport records will be preserved.`)) return
    setError(''); setNotice('')
    try {
      await api<void>(`/driver/${driver.id}`, token, { method: 'DELETE' })
      setNotice('Driver deactivated successfully.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to deactivate driver.')
    }
  }

  return <>
    {!showForm && <div className="page-intro">
      <div><h2>Driver management</h2><p>Add, update and manage driver profiles and driving licence details.</p></div>
      <div className="page-header-actions">
        <button className="button primary" onClick={openCreateForm}><UserRound size={15} /> Add Driver</button>
        <button className="button secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={14} /> Refresh</button>
      </div>
    </div>}
    {showForm && <div className="record-page-header"><button type="button" className="breadcrumb-back" onClick={() => { setShowForm(false); setEditingId(null) }}>Drivers</button><span>/</span><strong>{editingId ? 'Update driver' : 'Add driver'}</strong></div>}

    {showForm && <section className="panel form-panel">
      <form onSubmit={submit}>
        <div className="form-grid">
          <label className="field"><span>School *</span><SelectInput required value={form.schoolId || ''} onChange={e => setForm({ ...form, schoolId: Number(e.target.value) })}><option value="">Select school</option>{schools.map(school => <option key={school.id} value={school.id}>{school.name} ({school.code})</option>)}</SelectInput></label>
          <label className="field"><span>Driver code *</span><TextInput required maxLength={50} value={form.driverCode} onChange={e => setForm({ ...form, driverCode: e.target.value.toUpperCase() })} placeholder="e.g. DRV-001" /></label>
          <label className="field"><span>First name *</span><TextInput required maxLength={100} value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></label>
          <label className="field"><span>Last name *</span><TextInput required maxLength={100} value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></label>
          <label className="field"><span>Date of birth</span><DateInput value={form.dateOfBirth || ''} onChange={value => setForm({ ...form, dateOfBirth: value })} /></label>
          <label className="field"><span>Gender</span><SelectInput value={form.gender || ''} onChange={e => setForm({ ...form, gender: e.target.value })}><option value="">Select gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></SelectInput></label>
          <label className="field"><span>Phone *</span><PhoneInput required maxLength={20} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Primary mobile number" /></label>
          <label className="field"><span>Alternate phone</span><PhoneInput maxLength={20} value={form.alternatePhone || ''} onChange={e => setForm({ ...form, alternatePhone: e.target.value })} /></label>
          <label className="field"><span>Email</span><EmailInput maxLength={150} value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label className="field"><span>Driving licence number *</span><TextInput required maxLength={50} value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value.toUpperCase() })} placeholder="Enter licence number" /></label>
          <label className="field"><span>Licence type</span><SelectInput value={form.licenseType || ''} onChange={e => setForm({ ...form, licenseType: e.target.value })}><option value="">Select licence type</option><option value="LMV">LMV</option><option value="HMV">HMV</option><option value="TRANSPORT">Transport</option><option value="HEAVY_VEHICLE">Heavy vehicle</option></SelectInput></label>
          <label className="field"><span>Licence expiry date</span><DateInput value={form.licenseExpiryDate || ''} onChange={value => setForm({ ...form, licenseExpiryDate: value })} /></label>
          <label className="field"><span>Joining date</span><DateInput value={form.joiningDate || ''} onChange={value => setForm({ ...form, joiningDate: value })} /></label>
          <label className="field"><span>Emergency contact name</span><TextInput maxLength={150} value={form.emergencyContactName || ''} onChange={e => setForm({ ...form, emergencyContactName: e.target.value })} /></label>
          <label className="field"><span>Emergency contact phone</span><PhoneInput maxLength={20} value={form.emergencyContactPhone || ''} onChange={e => setForm({ ...form, emergencyContactPhone: e.target.value })} /></label>
          <label className="field field-wide"><span>Address</span><TextArea rows={2} maxLength={1000} value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
          <label className="field"><span>City</span><TextInput maxLength={100} value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} /></label>
          <label className="field"><span>State</span><TextInput maxLength={100} value={form.state || ''} onChange={e => setForm({ ...form, state: e.target.value })} /></label>
          <label className="field"><span>Pincode</span><TextInput maxLength={15} value={form.pincode || ''} onChange={e => setForm({ ...form, pincode: e.target.value })} /></label>
        </div>
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</button>
          <button className="button primary" disabled={busy || !schools.length}>{busy ? 'Saving…' : editingId ? 'Update driver' : 'Save driver'}</button>
        </div>
        {!schools.length && <p className="student-subtext">Create an active school record before adding a driver.</p>}
      </form>
    </section>}

    {!showForm && <>
      <section className="panel">
        <div className="panel-heading student-list-heading">
          <div><span className="section-kicker">SCHOOL DIRECTORY</span><h3>All drivers <small className="count-label">{filteredDrivers.length}</small></h3></div>
          <div className="table-header-tools">
            <SearchInput className="student-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search driver, code, phone, licence…" />
            <button type="button" className="button secondary report-button" onClick={() => downloadExcelReport('drivers-report.xls', 'Drivers Report', ['Driver code', 'Driver name', 'Phone', 'Alternate phone', 'Email', 'Driving licence', 'Licence type', 'Licence expiry', 'Joining date', 'School', 'Status'], filteredDrivers.map(driver => [driver.driverCode, `${driver.firstName} ${driver.lastName}`.trim(), driver.phone, driver.alternatePhone || '', driver.email || '', driver.licenseNumber, driver.licenseType || '', driver.licenseExpiryDate || '', driver.joiningDate || '', schools.find(school => school.id === driver.schoolId)?.name || '', driver.status]))}>Export Excel</button>
            <button type="button" className="button secondary report-button" onClick={() => downloadPdfReport('Drivers Report', ['Driver code', 'Driver name', 'Phone', 'Driving licence', 'Licence expiry', 'School', 'Status'], filteredDrivers.map(driver => [driver.driverCode, `${driver.firstName} ${driver.lastName}`.trim(), driver.phone, driver.licenseNumber, driver.licenseExpiryDate || '', schools.find(school => school.id === driver.schoolId)?.name || '', driver.status]))}>Export PDF</button>
          </div>
        </div>
        <div className="table-wrap"><table>
          <thead><tr><th className="row-actions-heading">Actions</th><th>Driver</th><th>Driver code</th><th>Phone</th><th>Driving licence</th><th>Licence expiry</th><th>School</th><th>Status</th></tr></thead>
          <tbody>
            {filteredDrivers.map(driver => <tr key={driver.id}>
              <td className="row-actions-cell"><div className="row-action-menu"><button type="button" className="row-action-trigger" aria-label={`Actions for ${driver.firstName}`} aria-haspopup="true" aria-expanded={openActionMenuId === driver.id} onClick={() => setOpenActionMenuId(current => current === driver.id ? null : driver.id)}><MoreVertical size={18} /></button>{openActionMenuId === driver.id && <div className="row-action-dropdown" role="menu"><button type="button" role="menuitem" onClick={() => { setOpenActionMenuId(null); editDriver(driver) }}>Edit driver</button>{driver.status === 'ACTIVE' && <button type="button" role="menuitem" className="danger" onClick={() => { setOpenActionMenuId(null); void deleteDriver(driver) }}>Delete driver</button>}</div>}</div></td>
              <td><strong>{driver.firstName} {driver.lastName}</strong></td>
              <td>{driver.driverCode}</td><td>{driver.phone}</td><td>{driver.licenseNumber}</td>
              <td>{driver.licenseExpiryDate || '—'}</td>
              <td>{schools.find(school => school.id === driver.schoolId)?.name || '—'}</td>
              <td><span className={`status-pill ${driver.status === 'ACTIVE' ? 'active' : 'inactive'}`}>{driver.status}</span></td>
            </tr>)}
            {loading && <tr><td colSpan={8} className="empty-cell">Loading drivers…</td></tr>}
            {!loading && filteredDrivers.length === 0 && <tr><td colSpan={8} className="empty-cell">{search ? 'No drivers match your search.' : 'No drivers found. Add your first driver.'}</td></tr>}
          </tbody>
        </table></div>
      </section>
      <p className="footnote">Deleting a driver deactivates the record and preserves historical transport records. Bus assignment will be managed separately.</p>
    </>}
  </>
}
