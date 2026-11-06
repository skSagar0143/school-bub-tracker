import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Building2, CheckCircle2, Edit3, Globe2, Mail, MapPin, Phone, Plus, RefreshCw, Save, ShieldCheck, X } from 'lucide-react'
import { createSchool, getSchools, updateSchool, updateSchoolStatus } from '../services/school'
import type { School, SchoolPayload } from '../services/school'
import './SchoolManagement.css'

const emptyForm: SchoolPayload = {
  name: '', code: '', email: '', phone: '', website: '',
  addressLine1: '', addressLine2: '', city: '', state: '',
  pincode: '', country: 'India',
}

function toPayload(school: School): SchoolPayload {
  return {
    name: school.name, code: school.code, email: school.email || '',
    phone: school.phone || '', website: school.website || '',
    addressLine1: school.addressLine1, addressLine2: school.addressLine2 || '',
    city: school.city, state: school.state, pincode: school.pincode, country: school.country,
  }
}

function SchoolManagement() {
  const [school, setSchool] = useState<School | null>(null)
  const [form, setForm] = useState<SchoolPayload>(emptyForm)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadSchool = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const schools = await getSchools()
      const current = schools[0] || null
      setSchool(current)
      setForm(current ? toPayload(current) : emptyForm)
      setEditing(!current)
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || 'Unable to load school details. Check that the backend is running and you are signed in as School Admin.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadSchool() }, [loadSchool])

  const setField = (key: keyof SchoolPayload, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    const payload: SchoolPayload = {
      ...form,
      name: form.name.trim(), code: form.code.trim().toUpperCase(),
      email: form.email.trim() || null, phone: form.phone.trim() || null,
      website: form.website.trim() || null, addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim() || null, city: form.city.trim(),
      state: form.state.trim(), pincode: form.pincode.trim(), country: form.country.trim(),
    }
    try {
      const saved = school ? await updateSchool(school.id, payload) : await createSchool(payload)
      setSchool(saved)
      setForm(toPayload(saved))
      setEditing(false)
      setSuccess(school ? 'School profile updated successfully.' : 'School profile created successfully.')
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || 'Could not save the school profile. Please review the details and try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleStatus = async () => {
    if (!school) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const updated = await updateSchoolStatus(school.id, school.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
      setSchool(updated)
      setSuccess(`School marked ${updated.status.toLowerCase()}.`)
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || 'Unable to update school status.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <section className="school-page"><div className="school-loading"><RefreshCw size={18} /> Loading school profile…</div></section>

  return (
    <section className="school-page">
      <div className="school-page-heading">
        <div><span className="school-eyebrow">SCHOOL SETUP</span><h2>School profile</h2><p>Manage the identity and contact details of your school.</p></div>
        {school && !editing && <button className="school-primary-action" onClick={() => { setEditing(true); setSuccess(''); setError('') }}><Edit3 size={16} /> Edit profile</button>}
      </div>

      {error && <div className="school-alert school-alert-error" role="alert">{error}</div>}
      {success && <div className="school-alert school-alert-success"><CheckCircle2 size={16} />{success}</div>}

      {!school && !editing ? (
        <article className="school-empty">
          <div className="school-empty-icon"><Building2 size={28} /></div>
          <h3>No school profile added yet</h3>
          <p>Add your school's official details to start setting up SchoolRoute.</p>
          <button className="school-primary-action" onClick={() => setEditing(true)}><Plus size={16} /> Add school</button>
        </article>
      ) : editing ? (
        <form className="school-form-card" onSubmit={handleSave}>
          <div className="school-form-heading"><div><h3>{school ? 'Update school details' : 'Add your school'}</h3><p>Fields marked with * are required.</p></div>{school && <button type="button" className="school-icon-button" aria-label="Cancel editing" onClick={() => { setForm(toPayload(school)); setEditing(false); setError('') }}><X size={18} /></button>}</div>
          <div className="school-form-grid">
            <label>School name *<input required maxLength={150} value={form.name} onChange={e => setField('name', e.target.value)} placeholder="e.g. Sunrise Public School" /></label>
            <label>School code *<input required maxLength={30} value={form.code} onChange={e => setField('code', e.target.value.toUpperCase())} placeholder="e.g. SUNRISE-001" /></label>
            <label>Email address<input type="email" maxLength={150} value={form.email || ''} onChange={e => setField('email', e.target.value)} placeholder="office@school.edu.in" /></label>
            <label>Phone number<input type="tel" maxLength={20} value={form.phone || ''} onChange={e => setField('phone', e.target.value)} placeholder="+91 98765 43210" /></label>
            <label className="school-field-wide">Website<input type="url" maxLength={150} value={form.website || ''} onChange={e => setField('website', e.target.value)} placeholder="https://www.school.edu.in" /></label>
            <label className="school-field-wide">Address line 1 *<input required maxLength={255} value={form.addressLine1} onChange={e => setField('addressLine1', e.target.value)} placeholder="Building, street and area" /></label>
            <label className="school-field-wide">Address line 2<input maxLength={255} value={form.addressLine2 || ''} onChange={e => setField('addressLine2', e.target.value)} placeholder="Landmark (optional)" /></label>
            <label>City *<input required maxLength={100} value={form.city} onChange={e => setField('city', e.target.value)} /></label>
            <label>State *<input required maxLength={100} value={form.state} onChange={e => setField('state', e.target.value)} /></label>
            <label>PIN code *<input required maxLength={10} value={form.pincode} onChange={e => setField('pincode', e.target.value)} /></label>
            <label>Country *<input required maxLength={100} value={form.country} onChange={e => setField('country', e.target.value)} /></label>
          </div>
          <div className="school-form-actions"><button type="button" className="school-secondary-action" onClick={() => { setForm(school ? toPayload(school) : emptyForm); setEditing(false); setError('') }} disabled={saving}>Cancel</button><button type="submit" className="school-primary-action" disabled={saving}><Save size={16} />{saving ? 'Saving…' : school ? 'Save changes' : 'Create school'}</button></div>
        </form>
      ) : school ? (
        <article className="school-profile-card">
          <div className="school-profile-top"><div className="school-profile-mark"><Building2 size={25} /></div><div className="school-profile-title"><h3>{school.name}</h3><span>{school.code}</span></div><span className={`school-status-pill ${school.status.toLowerCase()}`}>{school.status}</span></div>
          <div className="school-detail-grid">
            <div><Mail size={16} /><span><small>Email</small><b>{school.email || 'Not provided'}</b></span></div>
            <div><Phone size={16} /><span><small>Phone</small><b>{school.phone || 'Not provided'}</b></span></div>
            <div><Globe2 size={16} /><span><small>Website</small><b>{school.website || 'Not provided'}</b></span></div>
            <div><MapPin size={16} /><span><small>Address</small><b>{[school.addressLine1, school.addressLine2, school.city, school.state, school.pincode, school.country].filter(Boolean).join(', ')}</b></span></div>
          </div>
          <div className="school-profile-footer"><span><ShieldCheck size={15} /> Single-school installation</span><button className="school-secondary-action" onClick={handleStatus} disabled={saving}>{saving ? 'Updating…' : school.status === 'ACTIVE' ? 'Deactivate school' : 'Activate school'}</button></div>
        </article>
      ) : null}
    </section>
  )
}

export default SchoolManagement
