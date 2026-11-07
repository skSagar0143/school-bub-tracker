import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/sm'

type UserRole = 'SCHOOL_ADMIN' | 'DRIVER' | 'STUDENT' | 'PARENT'
type LoginUser = { id: string; fullName: string; email: string; role: UserRole; enabled: boolean }
type LoginResponse = { tokenType: string; accessToken: string; refreshToken: string; expiresInSeconds: number; user: LoginUser }
type Menu = { id: number; name: string; path: string | null; icon: string | null; sequences: number; subMenus: Menu[] }
type MenuResponse = { role: UserRole; defaultPath: string; menus: Menu[] }
type Driver = { id: string; fullName: string; email: string; role: UserRole; enabled: boolean; createdAt: string; updatedAt: string }
type School = {
  id: number; name: string; code: string; email: string | null; phone: string | null; website: string | null
  addressLine1: string; addressLine2: string | null; city: string; state: string; pincode: string; country: string
  status: 'ACTIVE' | 'INACTIVE'; createdAt: string; updatedAt: string
}
type SchoolForm = Omit<School, 'id' | 'status' | 'createdAt' | 'updatedAt'>
type DriverForm = { fullName: string; email: string; password: string }
const emptySchool: SchoolForm = { name: '', code: '', email: '', phone: '', website: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India' }
const emptyDriver: DriverForm = { fullName: '', email: '', password: '' }

async function api<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try { const body = await response.json(); message = body.message || message } catch { /* keep fallback */ }
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

function App() {
  const [token, setToken] = useState(sessionStorage.getItem('accessToken') || '')
  const [user, setUser] = useState<LoginUser | null>(() => {
    try { return JSON.parse(sessionStorage.getItem('currentUser') || 'null') as LoginUser | null } catch { return null }
  })
  const [menus, setMenus] = useState<Menu[]>([])
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const navigate = useCallback((path: string) => {
    if (!path) return
    window.history.pushState({}, '', path)
    setCurrentPath(path)
    setMobileSidebarOpen(false)
    setError('')
    setNotice('')
  }, [])

  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (!token) return
    let active = true
    setLoading(true)
    api<MenuResponse>('/menu/me', token)
      .then(result => { if (active) { setMenus(result.menus || []); if (currentPath === '/' || currentPath === '/login') navigate(result.defaultPath || '/') } })
      .catch(() => { if (active) logout() })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
    // Initial session restoration only; navigation is handled separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function logout() {
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('currentUser')
    setToken('')
    setUser(null)
    setMenus([])
    navigate('/login')
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginBusy(true); setError('')
    try {
      const result = await api<LoginResponse>('/auth/login', '', { method: 'POST', body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }) })
      sessionStorage.setItem('accessToken', result.accessToken)
      sessionStorage.setItem('currentUser', JSON.stringify(result.user))
      setToken(result.accessToken); setUser(result.user)
      const menuResult = await api<MenuResponse>('/menu/me', result.accessToken)
      setMenus(menuResult.menus || [])
      navigate(menuResult.defaultPath || '/')
    } catch (err) {
      sessionStorage.removeItem('accessToken'); sessionStorage.removeItem('currentUser')
      setError(err instanceof Error ? err.message : 'Unable to sign in. Check your credentials.')
    } finally { setLoginBusy(false) }
  }

  const activeMenu = useMemo(() => flattenMenus(menus).find(item => item.path === currentPath), [menus, currentPath])

  if (!token || !user) {
    return <LoginPage email={loginEmail} password={loginPassword} setEmail={setLoginEmail} setPassword={setLoginPassword} onSubmit={handleLogin} busy={loginBusy} error={error} />
  }

  return (
    <main className={`app-shell ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
      <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMobileSidebarOpen(false)} />
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">SR</span><span>SchoolRoute<small>SCHOOL BUS MANAGEMENT</small></span></div>
        <p className="nav-caption">WORKSPACE</p>
        <nav className="menu-tree">{menus.map(menu => <MenuItem key={menu.id} menu={menu} currentPath={currentPath} navigate={navigate} />)}</nav>
        <div className="sidebar-note"><span className="note-dot" /> Secure role-based access</div>
        <div className="sidebar-footer"><strong>{user.fullName}</strong><span>{user.role.replace('_', ' ')}</span><button className="logout-link" onClick={logout}>Sign out</button></div>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <button className="mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileSidebarOpen(true)}>☰</button>
          <div className="topbar-title"><span className="eyebrow">{user.role.replace('_', ' ')}</span><h1>{activeMenu?.name || pageTitle(currentPath)}</h1></div>
          <div className="topbar-right"><span className="secure-label">● Signed in securely</span><span className="avatar">{initials(user.fullName)}</span></div>
        </header>
        <div className="content">
          {loading && <div className="loading">Loading your workspace…</div>}
          {error && <div className="message error">{error}</div>}
          {notice && <div className="message success">{notice}</div>}
          {currentPath === '/school' ? <SchoolPage token={token} setError={setError} setNotice={setNotice} /> :
            currentPath === '/drivers' ? <DriversPage token={token} setError={setError} setNotice={setNotice} /> :
            currentPath === '/drivers/dashboard' ? <DriversDashboard token={token} /> :
            <DashboardPage user={user} path={currentPath} />}
        </div>
      </section>
    </main>
  )
}

function LoginPage({ email, password, setEmail, setPassword, onSubmit, busy, error }: {
  email: string; password: string; setEmail: (value: string) => void; setPassword: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void; busy: boolean; error: string
}) {
  return <main className="login-screen">
    <section className="login-card">
      <div className="login-brand"><span className="brand-mark">SR</span><div><strong>SchoolRoute</strong><small>SCHOOL BUS MANAGEMENT</small></div></div>
      <div className="login-heading"><span className="section-kicker">WELCOME BACK</span><h1>Sign in to your workspace</h1><p>Use the account credentials provided by your school administrator.</p></div>
      {error && <div className="message error">{error}</div>}
      <form onSubmit={onSubmit} className="login-form">
        <label className="field"><span>Email address</span><input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@school.com" /></label>
        <label className="field"><span>Password</span><input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" /></label>
        <button className="button primary login-button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="login-footnote">Your available menus and landing page are loaded securely from the server after sign in.</p>
    </section>
  </main>
}

function MenuItem({ menu, currentPath, navigate }: { menu: Menu; currentPath: string; navigate: (path: string) => void }) {
  const hasChildren = menu.subMenus?.length > 0
  const selected = menu.path === currentPath || menu.subMenus?.some(child => child.path === currentPath)
  return <div className="menu-group">
    <button className={`nav-item ${selected ? 'active' : ''} ${hasChildren ? 'parent-menu' : ''}`} onClick={() => menu.path && navigate(menu.path)}>
      <span className="menu-icon">{iconFor(menu.icon)}</span>{menu.name}{hasChildren && <span className="menu-chevron">⌄</span>}
    </button>
    {hasChildren && <div className="submenu">{menu.subMenus.map(child => <button key={child.id} className={`submenu-item ${currentPath === child.path ? 'selected' : ''}`} onClick={() => child.path && navigate(child.path)}>{child.name}</button>)}</div>}
  </div>
}

function DashboardPage({ user, path }: { user: LoginUser; path: string }) {
  return <><div className="page-intro"><div><h2>{path === '/dashboard' ? 'School overview' : pageTitle(path)}</h2><p>Welcome, {user.fullName}. Your role-specific workspace is ready.</p></div><span className="status-pill active">CONNECTED</span></div>
    <div className="stats-grid"><div className="stat-card"><span>YOUR ROLE</span><strong>{user.role.replace('_', ' ')}</strong><small>Access managed by SchoolRoute</small></div><div className="stat-card"><span>ACCOUNT STATUS</span><strong>Active</strong><small>You are signed in</small></div><div className="stat-card"><span>WORKSPACE</span><strong>SchoolRoute</strong><small>School bus operations</small></div></div>
    <section className="panel welcome-panel"><span className="section-kicker">GET STARTED</span><h3>Welcome to your dashboard</h3><p>Use the navigation menu to open the modules available to your account. The menu is controlled by your role and delivered by the backend.</p></section>
  </>
}

function DriversDashboard({ token }: { token: string }) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  useEffect(() => { api<Driver[]>('/user', token).then(data => setDrivers(data.filter(user => user.role === 'DRIVER'))).catch(() => setDrivers([])) }, [token])
  const active = drivers.filter(driver => driver.enabled).length
  return <><div className="page-intro"><div><h2>Drivers overview</h2><p>Current driver accounts registered for this school.</p></div><span className="status-pill active">LIVE DATA</span></div>
    <div className="stats-grid"><div className="stat-card"><span>TOTAL DRIVERS</span><strong>{drivers.length}</strong><small>Registered driver accounts</small></div><div className="stat-card"><span>ACTIVE DRIVERS</span><strong>{active}</strong><small>Enabled accounts</small></div><div className="stat-card"><span>INACTIVE DRIVERS</span><strong>{drivers.length - active}</strong><small>Disabled accounts</small></div></div>
    <section className="panel"><div className="panel-heading"><div><span className="section-kicker">SCHOOL DRIVERS</span><h3>Driver account summary</h3></div></div><div className="table-wrap"><table><thead><tr><th>Driver</th><th>Email</th><th>Status</th></tr></thead><tbody>{drivers.slice(0, 8).map(driver => <tr key={driver.id}><td>{driver.fullName}</td><td>{driver.email}</td><td><span className={`status-pill ${driver.enabled ? 'active' : 'inactive'}`}>{driver.enabled ? 'ACTIVE' : 'INACTIVE'}</span></td></tr>)}{drivers.length === 0 && <tr><td colSpan={3} className="empty-cell">No driver accounts have been added yet.</td></tr>}</tbody></table></div></section>
  </>
}

function DriversPage({ token, setError, setNotice }: { token: string; setError: (value: string) => void; setNotice: (value: string) => void }) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [form, setForm] = useState<DriverForm>(emptyDriver)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => { const data = await api<Driver[]>('/user', token); setDrivers(data.filter(item => item.role === 'DRIVER')) }, [token])
  useEffect(() => { void load().catch(err => setError(err.message)) }, [load, setError])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      if (editingId) {
        await api<Driver>(`/user/${editingId}`, token, { method: 'PUT', body: JSON.stringify({ fullName: form.fullName, email: form.email }) })
        setNotice('Driver details updated.')
      } else {
        await api<Driver>('/user', token, { method: 'POST', body: JSON.stringify({ ...form, role: 'DRIVER' }) })
        setNotice('Driver account created.')
      }
      setForm(emptyDriver); setEditingId(null); setShowForm(false); await load()
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save driver.') }
    finally { setBusy(false) }
  }
  function edit(driver: Driver) { setEditingId(driver.id); setForm({ fullName: driver.fullName, email: driver.email, password: '' }); setShowForm(true) }
  async function deleteDriver(driver: Driver) {
    if (!window.confirm(`Delete driver account for ${driver.fullName}? This disables sign-in but preserves historical records.`)) return
    try { await api<void>(`/user/${driver.id}`, token, { method: 'DELETE' }); setNotice('Driver account deleted (deactivated).'); await load() }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to delete driver.') }
  }
  return <>
    <div className="page-intro"><div><h2>All drivers</h2><p>Create, update and delete driver accounts for your school.</p></div><button className="button primary" onClick={() => { setEditingId(null); setForm(emptyDriver); setShowForm(true) }}>+ Add driver</button></div>
    {showForm && <section className="panel form-panel"><div className="panel-heading"><div><span className="section-kicker">DRIVER ACCOUNT</span><h3>{editingId ? 'Update driver' : 'Add new driver'}</h3></div></div><form onSubmit={submit}><div className="form-grid"><label className="field"><span>Full name *</span><input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></label><label className="field"><span>Email *</span><input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>{!editingId && <label className="field"><span>Temporary password *</span><input required minLength={8} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>}</div><div className="form-actions"><button type="button" className="button secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save driver'}</button></div></form></section>}
    <section className="panel"><div className="panel-heading"><div><span className="section-kicker">SCHOOL DIRECTORY</span><h3>Driver accounts <small className="count-label">{drivers.length}</small></h3></div></div><div className="table-wrap"><table><thead><tr><th>Driver name</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead><tbody>{drivers.map(driver => <tr key={driver.id}><td><strong>{driver.fullName}</strong></td><td>{driver.email}</td><td><span className={`status-pill ${driver.enabled ? 'active' : 'inactive'}`}>{driver.enabled ? 'ACTIVE' : 'INACTIVE'}</span></td><td className="actions-cell"><button className="table-action" onClick={() => edit(driver)}>Edit</button>{driver.enabled && <button className="table-action danger" onClick={() => void deleteDriver(driver)}>Delete</button>}</td></tr>)}{drivers.length === 0 && <tr><td colSpan={4} className="empty-cell">No drivers found. Add your first driver.</td></tr>}</tbody></table></div></section>
    <p className="footnote">Deactivate is a soft delete: it disables login while preserving historical trip and audit records.</p>
  </>
}

function SchoolPage({ token, setError, setNotice }: { token: string; setError: (value: string) => void; setNotice: (value: string) => void }) {
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
      {!school && !editing ? <div className="empty-state"><h3>No school profile found</h3><p>Create your school's profile to start configuring bus operations.</p><button className="button primary" onClick={() => setEditing(true)}>Create school profile</button></div> : editing ? <form onSubmit={submit}><div className="form-grid">{fields.map(field => <label className="field" key={field.key}><span>{field.label}{field.required && ' *'}</span><input required={field.required} type={field.type || 'text'} value={form[field.key] || ''} onChange={e => setForm({ ...form, [field.key]: e.target.value })} /></label>)}</div><div className="form-actions"><button type="button" className="button secondary" onClick={() => setEditing(false)}>Cancel</button><button className="button primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div></form> : school && <><div className="details-grid">{fields.map(field => <Detail key={field.key} label={field.label} value={school[field.key]} />)}</div><div className="form-actions"><button className="button secondary" onClick={async () => { const status = school.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'; try { await api(`/school/${school.id}/status`, token, { method: 'PATCH', body: JSON.stringify({ status }) }); setNotice(`School marked ${status.toLowerCase()}.`); await load() } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update status.') } }}>{school.status === 'ACTIVE' ? 'Deactivate school' : 'Activate school'}</button></div></>}
    </section>}
    <p className="footnote">This installation supports one school. School deletion is intentionally not available.</p>
  </>
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) { return <div className="detail"><span>{label}</span><strong>{value || 'Not provided'}</strong></div> }
function flattenMenus(items: Menu[]): Menu[] { return items.flatMap(item => [item, ...flattenMenus(item.subMenus || [])]) }
function pageTitle(path: string) { return path.split('/').filter(Boolean).map(part => part.replace(/-/g, ' ').replace(/^\w/, char => char.toUpperCase())).join(' / ') || 'Dashboard' }
function initials(name: string) { return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() }
function iconFor(icon: string | null) { const icons: Record<string, string> = { 'layout-dashboard': '▦', school: '⌂', 'steering-wheel': '◉', users: '♙', route: '↗', 'map-pinned': '⌖', bell: '♧' }; return icons[icon || ''] || '•' }

export default App
