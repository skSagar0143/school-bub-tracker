import { api } from '../../pages/LegacyPages'
import { useCallback, useEffect, useState } from 'react'
import type { Driver, School, Bus, BusForm } from '../../pages/LegacyPages'
import { emptyBus, downloadExcelReport, downloadPdfReport } from '../../pages/LegacyPages'
import { BusFront, MoreVertical, RefreshCw } from 'lucide-react'
import { TextInput, NumberInput, DateInput, SearchInput, SelectInput } from '../../components/ui/FormControls'

export function BusesPage({ token, setError, setNotice }: { token: string; setError: (value: string) => void; setNotice: (value: string) => void }) {
  const [buses, setBuses] = useState<Bus[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [form, setForm] = useState<BusForm>(emptyBus)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [busRows, schoolRows] = await Promise.all([
        api<Bus[]>('/bus', token),
        api<School[]>('/school', token).catch(() => [] as School[]),
      ])
      setBuses(busRows)
      setSchools(schoolRows)
      setForm(current => current.schoolId || !schoolRows.length ? current : { ...current, schoolId: schoolRows[0].id })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load buses.')
    } finally {
      setLoading(false)
    }
  }, [token, setError])

  useEffect(() => { void load() }, [load])

  const filteredBuses = buses.filter(bus =>
    [bus.busNumber, bus.registrationNumber, bus.model, bus.busType, bus.fuelType]
      .filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase())
  )

  function openCreateForm() {
    setEditingId(null)
    setForm({ ...emptyBus, schoolId: schools[0]?.id || 0 })
    setShowForm(true)
  }

  function editBus(bus: Bus) {
    setEditingId(bus.id)
    setForm({
      schoolId: bus.schoolId,
      busNumber: bus.busNumber,
      registrationNumber: bus.registrationNumber,
      model: bus.model || '',
      capacity: bus.capacity,
      busType: bus.busType || 'NON_AC',
      fuelType: bus.fuelType || 'DIESEL',
      manufactureYear: bus.manufactureYear || new Date().getFullYear(),
      insuranceNumber: bus.insuranceNumber || '',
      insuranceExpiryDate: bus.insuranceExpiryDate || '',
      fitnessExpiryDate: bus.fitnessExpiryDate || '',
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
        model: form.model || null,
        busType: form.busType || null,
        fuelType: form.fuelType || null,
        manufactureYear: form.manufactureYear ? Number(form.manufactureYear) : null,
        insuranceNumber: form.insuranceNumber || null,
        insuranceExpiryDate: form.insuranceExpiryDate || null,
        fitnessExpiryDate: form.fitnessExpiryDate || null,
      }
      await api<Bus>(editingId ? `/bus/${editingId}` : '/bus', token, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })
      setNotice(editingId ? 'Bus details updated successfully.' : 'Bus added successfully.')
      setShowForm(false); setEditingId(null); setForm(emptyBus)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save bus.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteBus(bus: Bus) {
    if (!window.confirm(`Deactivate bus ${bus.busNumber} (${bus.registrationNumber})? Historical transport records will be preserved.`)) return
    setError(''); setNotice('')
    try {
      await api<void>(`/bus/${bus.id}`, token, { method: 'DELETE' })
      setNotice('Bus deactivated successfully.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to deactivate bus.')
    }
  }

  return <>
    {!showForm && <div className="page-intro">
      <div><h2>Bus management</h2><p>Add, update and manage your school fleet and vehicle documents.</p></div>
      <div className="page-header-actions">
        <button className="button primary" onClick={openCreateForm}><BusFront size={15} /> Add Bus</button>
        <button className="button secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={14} /> Refresh</button>
      </div>
    </div>}
    {showForm && <div className="record-page-header"><button type="button" className="breadcrumb-back" onClick={() => { setShowForm(false); setEditingId(null) }}>Buses</button><span>/</span><strong>{editingId ? 'Update bus' : 'Add bus'}</strong></div>}

    {showForm && <section className="panel form-panel">

      <form onSubmit={submit}>
        <div className="form-grid">
          <label className="field"><span>School *</span>
            <SelectInput required value={form.schoolId || ''} onChange={e => setForm({ ...form, schoolId: Number(e.target.value) })}>
              <option value="">Select school</option>
              {schools.map(school => <option key={school.id} value={school.id}>{school.name} ({school.code})</option>)}
            </SelectInput>
          </label>
          <label className="field"><span>Bus number *</span><TextInput required maxLength={50} value={form.busNumber} onChange={e => setForm({ ...form, busNumber: e.target.value })} placeholder="e.g. BUS-001" /></label>
          <label className="field"><span>Registration number *</span><TextInput required maxLength={30} value={form.registrationNumber} onChange={e => setForm({ ...form, registrationNumber: e.target.value.toUpperCase() })} placeholder="e.g. DL01AB1234" /></label>
          <label className="field"><span>Bus model</span><TextInput maxLength={100} value={form.model || ''} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="e.g. Tata Starbus" /></label>
          <label className="field"><span>Seating capacity *</span><NumberInput required type="number" min="1" max="100" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} /></label>
          <label className="field"><span>Bus type</span><SelectInput value={form.busType || ''} onChange={e => setForm({ ...form, busType: e.target.value })}><option value="NON_AC">Non AC</option><option value="AC">AC</option></SelectInput></label>
          <label className="field"><span>Fuel type</span><SelectInput value={form.fuelType || ''} onChange={e => setForm({ ...form, fuelType: e.target.value })}><option value="DIESEL">Diesel</option><option value="CNG">CNG</option><option value="ELECTRIC">Electric</option><option value="PETROL">Petrol</option></SelectInput></label>
          <label className="field"><span>Manufacturing year</span><NumberInput type="number" min="1980" max={new Date().getFullYear() + 1} value={form.manufactureYear || ''} onChange={e => setForm({ ...form, manufactureYear: e.target.value ? Number(e.target.value) : null })} /></label>
          <label className="field"><span>Insurance policy number</span><TextInput maxLength={100} value={form.insuranceNumber || ''} onChange={e => setForm({ ...form, insuranceNumber: e.target.value })} /></label>
          <label className="field"><span>Insurance expiry date</span><DateInput value={form.insuranceExpiryDate || ''} onChange={value => setForm({ ...form, insuranceExpiryDate: value })} /></label>
          <label className="field"><span>Fitness expiry date</span><DateInput value={form.fitnessExpiryDate || ''} onChange={value => setForm({ ...form, fitnessExpiryDate: value })} /></label>
        </div>
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</button>
          <button className="button primary" disabled={busy || !schools.length}>{busy ? 'Saving…' : editingId ? 'Update bus' : 'Save bus'}</button>
        </div>
        {!schools.length && <p className="student-subtext">Create an active school record before adding a bus.</p>}
      </form>
    </section>}

    {!showForm && <>
    <section className="panel">
      <div className="panel-heading student-list-heading">
        <div><span className="section-kicker">SCHOOL FLEET</span><h3>All buses <small className="count-label">{filteredBuses.length}</small></h3></div>
        <div className="table-header-tools">
          <SearchInput className="student-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bus number, registration, model…" />
          <button type="button" className="button secondary report-button" onClick={() => downloadExcelReport('buses-report.xls', 'Buses Report', ['Bus number', 'Registration number', 'Model', 'Capacity', 'Fuel type', 'Bus type', 'School', 'Manufacturing year', 'Insurance number', 'Insurance expiry', 'Fitness expiry', 'Status'], filteredBuses.map(bus => [bus.busNumber, bus.registrationNumber, bus.model || '', bus.capacity, bus.fuelType || '', bus.busType || '', schools.find(school => school.id === bus.schoolId)?.name || '', bus.manufactureYear || '', bus.insuranceNumber || '', bus.insuranceExpiryDate || '', bus.fitnessExpiryDate || '', bus.status]))}>Export Excel</button>
          <button type="button" className="button secondary report-button" onClick={() => downloadPdfReport('Buses Report', ['Bus number', 'Registration number', 'Model', 'Capacity', 'Fuel / type', 'School', 'Status'], filteredBuses.map(bus => [bus.busNumber, bus.registrationNumber, bus.model || '', bus.capacity, [bus.fuelType, bus.busType].filter(Boolean).join(' / '), schools.find(school => school.id === bus.schoolId)?.name || '', bus.status]))}>Export PDF</button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th className="row-actions-heading">Actions</th><th>Bus</th><th>Registration</th><th>Model</th><th>Capacity</th><th>Fuel / Type</th><th>School</th><th>Status</th></tr></thead>
          <tbody>
            {filteredBuses.map(bus => <tr key={bus.id}>
              <td className="row-actions-cell"><div className="row-action-menu"><button type="button" className="row-action-trigger" aria-label={`Actions for ${bus.busNumber}`} aria-haspopup="true" aria-expanded={openActionMenuId === bus.id} onClick={() => setOpenActionMenuId(current => current === bus.id ? null : bus.id)}><MoreVertical size={18} /></button>{openActionMenuId === bus.id && <div className="row-action-dropdown" role="menu"><button type="button" role="menuitem" onClick={() => { setOpenActionMenuId(null); editBus(bus) }}>Edit bus</button>{bus.status === 'ACTIVE' && <button type="button" role="menuitem" className="danger" onClick={() => { setOpenActionMenuId(null); void deleteBus(bus) }}>Delete bus</button>}</div>}</div></td>
              <td><strong>{bus.busNumber}</strong></td>
              <td>{bus.registrationNumber}</td>
              <td>{bus.model || '—'}</td>
              <td>{bus.capacity} seats</td>
              <td>{[bus.fuelType, bus.busType].filter(Boolean).join(' / ') || '—'}</td>
              <td>{schools.find(school => school.id === bus.schoolId)?.name || `School #${bus.schoolId}`}</td>
              <td><span className={`status-pill ${bus.status === 'ACTIVE' ? 'active' : 'inactive'}`}>{bus.status}</span></td>
            </tr>)}
            {loading && <tr><td colSpan={8} className="empty-cell">Loading buses…</td></tr>}
            {!loading && filteredBuses.length === 0 && <tr><td colSpan={8} className="empty-cell">{search ? 'No buses match your search.' : 'No buses found. Add your first bus.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
    <p className="footnote">Deleting a bus deactivates it instead of removing the database record. Driver and student assignments will be handled separately.</p>
    </>}

  </>
}
