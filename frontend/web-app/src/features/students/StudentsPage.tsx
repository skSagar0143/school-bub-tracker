import { useCallback, useEffect, useState } from 'react'
import type { School, Student, StudentForm, Bus } from '../../pages/LegacyPages'
import { emptyStudent, downloadExcelReport, downloadPdfReport } from '../../pages/LegacyPages'
import { BusFront, MoreVertical, RefreshCw, Users } from 'lucide-react'
import { TextInput, NumberInput, EmailInput, PhoneInput, DateInput, SearchInput, SelectInput, TextArea } from '../../components/ui/FormControls'

export function StudentsPage({ token, setError, setNotice }: { token: string; setError: (value: string) => void; setNotice: (value: string) => void }) {
  const [students, setStudents] = useState<Student[]>([])
  const [form, setForm] = useState<StudentForm>(emptyStudent)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rows, schools] = await Promise.all([
        api<Student[]>('/stu', token),
        api<School[]>('/school', token).catch(() => [] as School[]),
      ])
      setStudents(rows)
      setSelectedIds(current => current.filter(id => rows.some(student => student.id === id && student.status === 'ACTIVE')))
      if (!form.schoolId && schools.length) setForm(current => ({ ...current, schoolId: schools[0].id }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load students.')
    } finally {
      setLoading(false)
    }
  }, [token, setError, form.schoolId])

  useEffect(() => { void load() }, [load])

  const filteredStudents = students.filter(student =>
    [student.firstName, student.lastName, student.admissionNumber, student.className, student.parentName, student.parentPhone]
      .filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase())
  )

  function openCreateForm() {
    setEditingId(null)
    setForm(emptyStudent)
    setShowForm(true)
  }

  function editStudent(student: Student) {
    setEditingId(student.id)
    setForm({
      schoolId: student.schoolId, firstName: student.firstName, lastName: student.lastName || '',
      admissionNumber: student.admissionNumber, dateOfBirth: student.dateOfBirth || '',
      gender: student.gender || '', className: student.className, section: student.section || '',
      rollNumber: student.rollNumber || '', parentName: student.parentName, parentPhone: student.parentPhone,
      parentEmail: student.parentEmail || '', emergencyContact: student.emergencyContact || '',
      address: student.address || '',
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
        section: form.section || null,
        rollNumber: form.rollNumber || null,
        parentEmail: form.parentEmail || null,
        emergencyContact: form.emergencyContact || null,
        address: form.address || null,
      }
      await api<Student>(editingId ? `/stu/${editingId}` : '/stu', token, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })
      setNotice(editingId ? 'Student details updated successfully.' : 'Student added successfully.')
      setShowForm(false); setEditingId(null); setForm(emptyStudent)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save student.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteSelectedStudents() {
    const selected = students.filter(student => selectedIds.includes(student.id) && student.status === 'ACTIVE')
    if (!selected.length) return
    if (!window.confirm(`Deactivate ${selected.length} selected student(s)? Historical transport records will be preserved.`)) return
    setBusy(true); setError(''); setNotice('')
    try {
      for (const student of selected) {
        await api<void>(`/stu/${student.id}`, token, { method: 'DELETE' })
      }
      setSelectedIds([])
      setNotice(`${selected.length} student(s) deactivated successfully.`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete all selected students. Refresh the list to see which records were deactivated.')
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function deleteStudent(student: Student) {
    if (!window.confirm(`Deactivate student ${student.firstName} ${student.lastName || ''}?`)) return
    setError(''); setNotice('')
    try {
      await api<void>(`/stu/${student.id}`, token, { method: 'DELETE' })
      setNotice('Student deactivated successfully.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to deactivate student.')
    }
  }

  return <>
    {!showForm && <div className="page-intro">
      <div><h2>Student management</h2><p>Add, update and manage students. Select students to perform bulk actions.</p></div>
      <div className="page-header-actions">
        <button className="button primary" onClick={openCreateForm}><Users size={15} /> Add Students</button>
        <button className="button secondary" disabled={selectedIds.length === 0} onClick={() => setNotice('Bus assignment UI is ready; it will be connected when the backend student-to-bus assignment API is added.')}><BusFront size={15} /> Bus Assign ({selectedIds.length})</button>
        <button className="button danger" disabled={selectedIds.length === 0} onClick={() => void deleteSelectedStudents()}><Users size={15} /> Delete Students ({selectedIds.length})</button>
        <button className="button secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={14} /> Refresh</button>
      </div>
    </div>}
    {showForm && <div className="record-page-header"><button type="button" className="breadcrumb-back" onClick={() => { setShowForm(false); setEditingId(null) }}>Students</button><span>/</span><strong>{editingId ? 'Update student' : 'Add student'}</strong></div>}

    {showForm && <section className="panel form-panel">

      <form onSubmit={submit}>
        <div className="form-grid">
          <label className="field"><span>School ID *</span><NumberInput type="number" min="1" required value={form.schoolId || ''} onChange={e => setForm({ ...form, schoolId: Number(e.target.value) })} /></label>
          <label className="field"><span>Admission number *</span><TextInput required maxLength={50} value={form.admissionNumber} onChange={e => setForm({ ...form, admissionNumber: e.target.value })} /></label>
          <label className="field"><span>First name *</span><TextInput required maxLength={100} value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></label>
          <label className="field"><span>Last name</span><TextInput maxLength={100} value={form.lastName || ''} onChange={e => setForm({ ...form, lastName: e.target.value })} /></label>
          <label className="field"><span>Date of birth</span><DateInput value={form.dateOfBirth || ''} onChange={value => setForm({ ...form, dateOfBirth: value })} /></label>
          <label className="field"><span>Gender</span><SelectInput value={form.gender || ''} onChange={e => setForm({ ...form, gender: e.target.value })}><option value="">Select gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></SelectInput></label>
          <label className="field"><span>Class *</span><TextInput required maxLength={50} value={form.className} onChange={e => setForm({ ...form, className: e.target.value })} placeholder="e.g. 5" /></label>
          <label className="field"><span>Section</span><TextInput maxLength={20} value={form.section || ''} onChange={e => setForm({ ...form, section: e.target.value })} /></label>
          <label className="field"><span>Roll number</span><TextInput maxLength={30} value={form.rollNumber || ''} onChange={e => setForm({ ...form, rollNumber: e.target.value })} /></label>
          <label className="field"><span>Parent / guardian name *</span><TextInput required maxLength={150} value={form.parentName} onChange={e => setForm({ ...form, parentName: e.target.value })} /></label>
          <label className="field"><span>Parent phone *</span><PhoneInput required type="tel" maxLength={15} value={form.parentPhone} onChange={e => setForm({ ...form, parentPhone: e.target.value })} /></label>
          <label className="field"><span>Parent email</span><EmailInput type="email" maxLength={150} value={form.parentEmail || ''} onChange={e => setForm({ ...form, parentEmail: e.target.value })} /></label>
          <label className="field"><span>Emergency contact</span><PhoneInput type="tel" maxLength={15} value={form.emergencyContact || ''} onChange={e => setForm({ ...form, emergencyContact: e.target.value })} /></label>
          <label className="field field-wide"><span>Address</span><TextArea rows={2} maxLength={500} value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
        </div>
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</button>
          <button className="button primary" disabled={busy}>{busy ? 'Saving…' : editingId ? 'Update student' : 'Save student'}</button>
        </div>
      </form>
    </section>}

    {!showForm && <>
    <section className="panel">
      <div className="panel-heading student-list-heading">
        <div><span className="section-kicker">SCHOOL DIRECTORY</span><h3>All students <small className="count-label">{filteredStudents.length}</small></h3></div>
        <div className="table-header-tools">
          <SearchInput className="student-search" placeholder="Search name, admission no., class…" value={search} onChange={e => setSearch(e.target.value)} />
          <button type="button" className="button secondary report-button" onClick={() => downloadExcelReport('students-report.xls', 'Students Report', ['Student', 'Admission number', 'Class', 'Parent / guardian', 'Parent phone', 'Parent email', 'Date of birth', 'Gender', 'Status'], filteredStudents.map(student => [`${student.firstName} ${student.lastName || ''}`.trim(), student.admissionNumber, `${student.className}${student.section ? ` - ${student.section}` : ''}`, student.parentName, student.parentPhone, student.parentEmail || '', student.dateOfBirth || '', student.gender || '', student.status]))}>Export Excel</button>
          <button type="button" className="button secondary report-button" onClick={() => downloadPdfReport('Students Report', ['Student', 'Admission number', 'Class', 'Parent / guardian', 'Parent phone', 'Status'], filteredStudents.map(student => [`${student.firstName} ${student.lastName || ''}`.trim(), student.admissionNumber, `${student.className}${student.section ? ` - ${student.section}` : ''}`, student.parentName, student.parentPhone, student.status]))}>Export PDF</button>
        </div>
      </div>
      <div className="table-wrap"><table>
        <thead><tr><th className="select-column"><input aria-label="Select all active students" type="checkbox" checked={filteredStudents.filter(student => student.status === 'ACTIVE').length > 0 && filteredStudents.filter(student => student.status === 'ACTIVE').every(student => selectedIds.includes(student.id))} onChange={event => { const visibleActiveIds = filteredStudents.filter(student => student.status === 'ACTIVE').map(student => student.id); setSelectedIds(event.target.checked ? Array.from(new Set([...selectedIds, ...visibleActiveIds])) : selectedIds.filter(id => !visibleActiveIds.includes(id))) }} /></th><th className="row-actions-heading">Actions</th><th>Student</th><th>Admission no.</th><th>Class</th><th>Parent / guardian</th><th>Parent phone</th><th>Status</th></tr></thead>
        <tbody>
          {filteredStudents.map(student => <tr key={student.id}>
            <td className="select-column"><input aria-label={`Select ${student.firstName}`} type="checkbox" disabled={student.status !== 'ACTIVE'} checked={selectedIds.includes(student.id)} onChange={event => setSelectedIds(current => event.target.checked ? [...current, student.id] : current.filter(id => id !== student.id))} /></td>
            <td className="row-actions-cell"><div className="row-action-menu"><button type="button" className="row-action-trigger" aria-label={`Actions for ${student.firstName} ${student.lastName || ""}`} aria-haspopup="true" aria-expanded={openActionMenuId === student.id} onClick={() => setOpenActionMenuId(current => current === student.id ? null : student.id)}><MoreVertical size={18} /></button>{openActionMenuId === student.id && <div className="row-action-dropdown" role="menu"><button type="button" role="menuitem" onClick={() => { setOpenActionMenuId(null); editStudent(student) }}>Edit student</button>{student.status === 'ACTIVE' && <button type="button" role="menuitem" className="danger" onClick={() => { setOpenActionMenuId(null); void deleteStudent(student) }}>Delete student</button>}</div>}</div></td>
            <td><strong>{student.firstName} {student.lastName || ''}</strong></td>
            <td>{student.admissionNumber}</td><td>{student.className}{student.section ? ` - ${student.section}` : ''}</td>
            <td>{student.parentName}</td><td>{student.parentPhone}</td>
            <td><span className={`status-pill ${student.status === 'ACTIVE' ? 'active' : 'inactive'}`}>{student.status}</span></td>
            
          </tr>)}
          {!loading && filteredStudents.length === 0 && <tr><td colSpan={8} className="empty-cell">{search ? 'No students match your search.' : 'No students found. Add your first student.'}</td></tr>}
          {loading && <tr><td colSpan={8} className="empty-cell">Loading students…</td></tr>}
        </tbody>
      </table></div>
    </section>
    <p className="footnote">Deleting a student deactivates the record; historical transport and trip records are preserved.</p>
    </>}

  </>
}
