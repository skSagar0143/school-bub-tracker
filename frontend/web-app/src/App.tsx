import { FormEvent, useCallback, useEffect, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/sm'

type School = {
  id: number
  name: string
  code: string
  email: string | null
  phone: string | null
  website: string | null
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  pincode: string
  country: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
}

type SchoolForm = Omit<School, 'id' | 'status' | 'createdAt' | 'updatedAt'>

const emptyForm: SchoolForm = {
  name: '', code: '', email: '', phone: '', website: '',
  addressLine1: '', addressLine2: '', city: '', state: '',
  pincode: '', country: 'India',
}

async function schoolRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('accessToken')
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!response.ok) {
    const message = await response.text()
    if (response.status === 401 || response.status === 403) {
      throw new Error('Login required or your account does not have School Admin permission. Please sign in with a SCHOOL_ADMIN account.')
    }
    throw new Error(message || `Request failed (${response.status})`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

function App() {
  const [school, setSchool] = useState<School | null>(null)
  const [form, setForm] = useState<SchoolForm>(emptyForm)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [token, setToken] = useState(localStorage.getItem('accessToken') || '')

  const loadSchool = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await schoolRequest<School[]>('/school')
      const current = data[0] ?? null
      setSchool(current)
      if (current) {
        const { id: _id, status: _status, createdAt: _created, updatedAt: _updated, ...details } = current
        setForm(details)
      } else {
        setForm(emptyForm)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load school details.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadSchool() }, [loadSchool])

  function updateField(field: keyof SchoolForm, value: string) {
    setForm(current => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const saved = await schoolRequest<School>(school ? `/school/${school.id}` : '/school', {
        method: school ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      })
      setSchool(saved)
      setEditing(false)
      setNotice(school ? 'School details updated successfully.' : 'School profile created successfully.')
      await loadSchool()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save school details.')
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus() {
    if (!school) return
    const nextStatus = school.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    setError('')
    setNotice('')
    try {
      const updated = await schoolRequest<School>(`/school/${school.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      })
      setSchool(updated)
      setNotice(`School marked ${nextStatus.toLowerCase()}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update school status.')
    }
  }

  function saveToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (token.trim()) localStorage.setItem('accessToken', token.trim())
    else localStorage.removeItem('accessToken')
    setNotice('Access token saved in this browser. Reloading school data…')
    void loadSchool()
  }

  const fields: { key: keyof SchoolForm; label: string; required?: boolean; type?: string }[] = [
    { key: 'name', label: 'School name', required: true },
    { key: 'code', label: 'School code', required: true },
    { key: 'email', label: 'Official email', type: 'email' },
    { key: 'phone', label: 'Phone number' },
    { key: 'website', label: 'Website' },
    { key: 'addressLine1', label: 'Address line 1', required: true },
    { key: 'addressLine2', label: 'Address line 2' },
    { key: 'city', label: 'City', required: true },
    { key: 'state', label: 'State', required: true },
    { key: 'pincode', label: 'PIN code', required: true },
    { key: 'country', label: 'Country', required: true },
  ]

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">SR</span><span>SchoolRoute<small>BUS MANAGEMENT</small></span></div>
        <p className="nav-caption">ADMINISTRATION</p>
        <button className="nav-item active"><span>▦</span> School profile</button>
        <div className="sidebar-note"><span className="note-dot" /> Single-school setup</div>
        <div className="sidebar-footer">SchoolRoute <span>Admin Console</span></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><span className="eyebrow">CONFIGURATION</span><h1>School profile</h1></div>
          <div className="topbar-right"><span className="secure-label">● Secure admin area</span><span className="avatar">SA</span></div>
        </header>

        <div className="content">
          <div className="page-intro">
            <div><h2>School information</h2><p>Manage the official details used across your school bus operations.</p></div>
            {school && <span className={`status-pill ${school.status.toLowerCase()}`}>{school.status}</span>}
          </div>

          {(error || notice) && <div className={`message ${error ? 'error' : 'success'}`}>{error || notice}</div>}

          <section className="token-panel">
            <div><strong>Admin access token</strong><p>Paste the access token issued by your School Admin login.</p></div>
            <form onSubmit={saveToken} className="token-form">
              <input aria-label="Access token" value={token} onChange={e => setToken(e.target.value)} placeholder="Paste JWT access token" type="password" />
              <button type="submit" className="button secondary">Save token</button>
            </form>
          </section>

          {loading ? <div className="loading">Loading school profile…</div> : (
            <section className="panel">
              <div className="panel-heading">
                <div><span className="section-kicker">GENERAL DETAILS</span><h3>{school ? (editing ? 'Update school details' : school.name) : 'Create school profile'}</h3></div>
                {school && !editing && <button className="button primary" onClick={() => setEditing(true)}>Edit details</button>}
              </div>

              {!school && !editing ? (
                <div className="empty-state"><div className="empty-icon">⌂</div><h3>No school profile found</h3><p>Create your school's profile to start configuring the bus tracking system.</p><button className="button primary" onClick={() => setEditing(true)}>Create school profile</button></div>
              ) : editing ? (
                <form onSubmit={handleSubmit}>
                  <div className="form-grid">
                    {fields.map(field => <label className="field" key={field.key}><span>{field.label}{field.required && <b> *</b>}</span><input required={field.required} type={field.type || 'text'} value={form[field.key] || ''} onChange={e => updateField(field.key, e.target.value)} /></label>)}
                  </div>
                  <div className="form-actions"><button type="button" className="button secondary" onClick={() => { setEditing(false); if (school) { const { id: _id, status: _status, createdAt: _created, updatedAt: _updated, ...details } = school; setForm(details) } }}>Cancel</button><button className="button primary" type="submit" disabled={saving}>{saving ? 'Saving…' : school ? 'Save changes' : 'Create school'}</button></div>
                </form>
              ) : school && (
                <>
                  <div className="details-grid">
                    <Detail label="School name" value={school.name} />
                    <Detail label="School code" value={school.code} />
                    <Detail label="Official email" value={school.email} />
                    <Detail label="Phone number" value={school.phone} />
                    <Detail label="Website" value={school.website} />
                    <Detail label="Address" value={[school.addressLine1, school.addressLine2].filter(Boolean).join(', ')} />
                    <Detail label="City" value={school.city} />
                    <Detail label="State" value={school.state} />
                    <Detail label="PIN code" value={school.pincode} />
                    <Detail label="Country" value={school.country} />
                  </div>
                  <div className="form-actions status-actions"><span className="muted">School status: <strong>{school.status}</strong></span><button className="button secondary" onClick={changeStatus}>{school.status === 'ACTIVE' ? 'Deactivate school' : 'Activate school'}</button></div>
                </>
              )}
            </section>
          )}
          <p className="footnote">School Admin can update school information and status. School deletion is intentionally not available here.</p>
        </div>
      </section>
    </main>
  )
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return <div className="detail"><span>{label}</span><strong>{value || 'Not provided'}</strong></div>
}

export default App
