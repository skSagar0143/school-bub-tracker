import { api } from '../../pages/LegacyPages'
import { useCallback, useEffect, useState } from 'react'
import type { School, SchoolForm } from '../../pages/LegacyPages'
import { emptySchool, Detail } from '../../pages/LegacyPages'
import { TextInput } from '../../components/ui/FormControls'

export function SchoolPage({ token, setError, setNotice }: { token: string; setError: (value: string) => void; setNotice: (value: string) => void }) {
  const [school, setSchool] = useState<School | null>(null)
  const [form, setForm] = useState<SchoolForm>(emptySchool)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    try { const rows = await api<School[]>('/school', token); const current = rows[0] || null; setSchool(current); if (current) { const { id: _id, status: _status, createdAt: _created, updatedAt: _updated, ...details } = current; setForm(details) } else setForm(emptySchool) }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load school details.') }
    finally { setLoading(false) }
  }, [token, setError])
  useEffect(() => { void load() }, [load])
  const fields: { key: keyof SchoolForm; label: string; required?: boolean; type?: string }[] = [
    { key: 'name', label: 'School name', required: true }, { key: 'code', label: 'School code', required: true },
    { key: 'email', label: 'Official email', type: 'email' }, { key: 'phone', label: 'Phone number' },
    { key: 'website', label: 'Website' }, { key: 'addressLine1', label: 'Address line 1', required: true },
    { key: 'addressLine2', label: 'Address line 2' }, { key: 'city', label: 'City', required: true },
    { key: 'state', label: 'State', required: true }, { key: 'pincode', label: 'PIN code', required: true },
    { key: 'country', label: 'Country', required: true },
  ]
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('')
    try { const saved = await api<School>(school ? `/school/${school.id}` : '/school', token, { method: school ? 'PUT' : 'POST', body: JSON.stringify(form) }); setSchool(saved); setEditing(false); setNotice('School details saved successfully.'); await load() }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to save school details.') }
    finally { setSaving(false) }
  }
  return <><div className="page-intro"><div><h2>School information</h2><p>Manage the official details used across your school bus operations.</p></div>{school && <span className={`status-pill ${school.status.toLowerCase()}`}>{school.status}</span>}</div>
    {loading ? <div className="loading">Loading school profile…</div> : <section className="panel"><div className="panel-heading"><div><span className="section-kicker">SCHOOL CONFIGURATION</span><h3>{school ? (editing ? 'Update school details' : school.name) : 'Create school profile'}</h3></div>{school && !editing && <button className="button primary" onClick={() => setEditing(true)}>Edit details</button>}</div>
      {!school && !editing ? <div className="empty-state"><h3>No school profile found</h3><p>Create your school's profile to start configuring bus operations.</p><button className="button primary" onClick={() => setEditing(true)}>Create school profile</button></div> : editing ? <form onSubmit={submit}><div className="form-grid">{fields.map(field => <label className="field" key={field.key}><span>{field.label}{field.required && ' *'}</span><TextInput required={field.required} type={field.type || 'text'} value={form[field.key] || ''} onChange={e => setForm({ ...form, [field.key]: e.target.value })} /></label>)}</div><div className="form-actions"><button type="button" className="button secondary" onClick={() => setEditing(false)}>Cancel</button><button className="button primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div></form> : school && <><div className="details-grid">{fields.map(field => <Detail key={field.key} label={field.label} value={school[field.key]} />)}</div><div className="form-actions"><button className="button secondary" onClick={async () => { const status = school.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'; try { await api(`/school/${school.id}/status`, token, { method: 'PATCH', body: JSON.stringify({ status }) }); setNotice(`School marked ${status.toLowerCase()}.`); await load() } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update status.') } }}>{school.status === 'ACTIVE' ? 'Deactivate school' : 'Activate school'}</button></div></>}
    </section>}
    <p className="footnote">This installation supports one school. School deletion is intentionally not available.</p>
  </>
}
