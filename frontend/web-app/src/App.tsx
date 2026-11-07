import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Activity, ArrowUpRight, Bell, BusFront, Building2, CalendarDays, ChevronRight, Clock3, GraduationCap, MapPinned, Monitor, Moon, MoreVertical, RefreshCw, Route, ShieldCheck, Sun, Users, UserRound } from 'lucide-react'
import { TextInput, NumberInput, EmailInput, PasswordInput, PhoneInput, DateInput, SearchInput, SelectInput, TextArea } from './components/ui/FormControls'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/sm'

type UserRole = 'SCHOOL_ADMIN' | 'DRIVER' | 'STUDENT' | 'PARENT'
type ThemeMode = 'system' | 'dark' | 'light'
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
type Student = {
  id: number; schoolId: number; firstName: string; lastName: string | null; admissionNumber: string
  dateOfBirth: string | null; gender: string | null; className: string; section: string | null; rollNumber: string | null
  parentName: string; parentPhone: string; parentEmail: string | null; emergencyContact: string | null
  address: string | null; status: 'ACTIVE' | 'INACTIVE'; createdAt: string; updatedAt: string
}
type StudentForm = Omit<Student, 'id' | 'status' | 'createdAt' | 'updatedAt'>
type Bus = {
  id: number; schoolId: number; busNumber: string; registrationNumber: string; model: string | null
  capacity: number; busType: string | null; fuelType: string | null; manufactureYear: number | null
  insuranceNumber: string | null; insuranceExpiryDate: string | null; fitnessExpiryDate: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'; createdAt: string; updatedAt: string
}
type BusForm = Omit<Bus, 'id' | 'status' | 'createdAt' | 'updatedAt'>
const emptyBus: BusForm = {
  schoolId: 0, busNumber: '', registrationNumber: '', model: '', capacity: 40,
  busType: 'NON_AC', fuelType: 'DIESEL', manufactureYear: new Date().getFullYear(),
  insuranceNumber: '', insuranceExpiryDate: '', fitnessExpiryDate: '',
}
const emptyStudent: StudentForm = {
  schoolId: 0, firstName: '', lastName: '', admissionNumber: '', dateOfBirth: '', gender: '',
  className: '', section: '', rollNumber: '', parentName: '', parentPhone: '',
  parentEmail: '', emergencyContact: '', address: '',
}
const emptySchool: SchoolForm = { name: '', code: '', email: '', phone: '', website: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India' }
const emptyDriver: DriverForm = { fullName: '', email: '', password: '' }

function escapeReportCell(value: unknown): string {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function downloadExcelReport(filename: string, title: string, headers: string[], rows: (string | number)[][]) {
  const table = `<html><head><meta charset="utf-8"></head><body><h2>${escapeReportCell(title)}</h2><table border="1"><thead><tr>${headers.map(header => `<th>${escapeReportCell(header)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${escapeReportCell(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`
  const blob = new Blob(['\\ufeff', table], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.xls') ? filename : `${filename}.xls`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function downloadPdfReport(title: string, headers: string[], rows: (string | number)[][]) {
  const popup = window.open('', '_blank')
  if (!popup) {
    window.alert('Please allow pop-ups to generate the PDF report.')
    return
  }
  const table = `<table><thead><tr>${headers.map(header => `<th>${escapeReportCell(header)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${escapeReportCell(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeReportCell(title)}</title><style>body{font:12px Arial,sans-serif;padding:24px;color:#111}h1{font-size:20px;margin:0 0 18px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #bbb;padding:7px;text-align:left}th{background:#eee}tr{page-break-inside:avoid}@page{size:landscape;margin:12mm}@media print{body{padding:0}}</style></head><body><h1>${escapeReportCell(title)}</h1><p>Generated: ${new Date().toLocaleString()}</p>${table}<script>window.onload=()=>window.print()</script></body></html>`)
  popup.document.close()
}

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
  const responseText = await response.text()
  if (!responseText) return undefined as T
  try { return JSON.parse(responseText) as T } catch { return responseText as T }
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
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => (localStorage.getItem('schoolroute-theme') as ThemeMode) || 'dark')

  const navigate = useCallback((path: string) => {
    if (!path) return
    window.history.pushState({}, '', path)
    setCurrentPath(path)
    setMobileSidebarOpen(false)
    setError('')
    setNotice('')
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const applyTheme = () => {
      const resolved = themeMode === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : themeMode
      root.dataset.theme = resolved
      root.style.colorScheme = resolved
    }
    applyTheme()
    localStorage.setItem('schoolroute-theme', themeMode)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', applyTheme)
    return () => media.removeEventListener('change', applyTheme)
  }, [themeMode])

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
      .then(result => { if (active) { setMenus(withStudentMenu(result.menus || [], user?.role)); if (currentPath === '/' || currentPath === '/login') navigate(result.defaultPath || '/') } })
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
      setMenus(withStudentMenu(menuResult.menus || [], result.user.role))
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
          <div className="topbar-right"><label className="theme-picker" title="Choose appearance"><span className="theme-picker-icon">{themeMode === 'system' ? <Monitor size={16} /> : themeMode === 'dark' ? <Moon size={16} /> : <Sun size={16} />}</span><select aria-label="Appearance mode" value={themeMode} onChange={event => setThemeMode(event.target.value as ThemeMode)}><option value="system">System</option><option value="dark">Dark</option><option value="light">Light</option></select></label><span className="secure-label"><ShieldCheck size={14} /> Signed in</span><span className="avatar">{initials(user.fullName)}</span></div>
        </header>
        <div className="content">
          {loading && <div className="loading">Loading your workspace…</div>}
          {error && <div className="message error">{error}</div>}
          {notice && <div className="message success">{notice}</div>}
          {currentPath === '/school' ? <SchoolPage token={token} setError={setError} setNotice={setNotice} /> :
            (currentPath === '/students' || currentPath === '/stu') ? <StudentsPage token={token} setError={setError} setNotice={setNotice} /> :
            (currentPath === '/bus' || currentPath === '/busses' || currentPath === '/buses') ? <BusesPage token={token} setError={setError} setNotice={setNotice} /> :
            currentPath === '/drivers' ? <DriversPage token={token} setError={setError} setNotice={setNotice} /> :
            currentPath === '/drivers/dashboard' ? <DriversDashboard token={token} /> :
            <DashboardPage user={user} path={currentPath} token={token} menus={menus} navigate={navigate} />}
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
        <label className="field"><span>Email address</span><EmailInput type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@school.com" /></label>
        <label className="field"><span>Password</span><PasswordInput type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" /></label>
        <button className="button primary login-button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="login-footnote">Your available menus and landing page are loaded securely from the server after sign in.</p>
    </section>
  </main>
}

function MenuItem({ menu, currentPath, navigate }: { menu: Menu; currentPath: string; navigate: (path: string) => void }) {
  const hasChildren = menu.subMenus?.length > 0
  const selected = menu.path === currentPath || menu.subMenus?.some(child => child.path === currentPath)
  const [expanded, setExpanded] = useState(selected)
  useEffect(() => { if (selected) setExpanded(true) }, [selected])
  return <div className="menu-group">
    <button className={`nav-item ${selected ? 'active' : ''} ${hasChildren ? 'parent-menu' : ''}`}
      onClick={() => hasChildren ? setExpanded(value => !value) : menu.path && navigate(menu.path)}
      aria-expanded={hasChildren ? expanded : undefined}>
      <span className="menu-icon">{iconFor(menu.icon)}</span>{menu.name}{hasChildren && <span className="menu-chevron">{expanded ? '⌃' : '⌄'}</span>}
    </button>
    {hasChildren && expanded && <div className="submenu">{menu.subMenus.map(child => <button key={child.id} className={`submenu-item ${currentPath === child.path ? 'selected' : ''}`} onClick={() => child.path && navigate(child.path)}>{child.name}</button>)}</div>}
  </div>
}

function DashboardPage({ user, path, token, menus, navigate }: { user: LoginUser; path: string; token: string; menus: Menu[]; navigate: (path: string) => void }) {
  const [schools, setSchools] = useState<School[]>([])
  const [users, setUsers] = useState<Driver[]>([])
  const [dataLoading, setDataLoading] = useState(user.role === 'SCHOOL_ADMIN')
  const [dataError, setDataError] = useState('')
  const today = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

  const loadAdminOverview = useCallback(async () => {
    if (user.role !== 'SCHOOL_ADMIN') return
    setDataLoading(true)
    setDataError('')
    const [schoolResult, userResult] = await Promise.allSettled([
      api<School[]>('/school', token),
      api<Driver[]>('/user', token),
    ])
    if (schoolResult.status === 'fulfilled') setSchools(schoolResult.value)
    else setDataError(schoolResult.reason instanceof Error ? schoolResult.reason.message : 'School information could not be loaded.')
    if (userResult.status === 'fulfilled') setUsers(userResult.value)
    else setDataError(userResult.reason instanceof Error ? userResult.reason.message : 'User information could not be loaded.')
    setDataLoading(false)
  }, [token, user.role])

  useEffect(() => { void loadAdminOverview() }, [loadAdminOverview])

  const school = schools[0]
  const countRole = (role: UserRole) => users.filter(item => item.role === role).length
  const activeUsers = users.filter(item => item.enabled).length
  const quickLinks = flattenMenus(menus).filter(item => item.path && item.path !== path).slice(0, 4)

  if (user.role !== 'SCHOOL_ADMIN') {
    const roleContent = {
      DRIVER: { title: 'Your driving workspace', subtitle: 'Your assigned bus, route and trip controls will appear here when those modules are connected.', cards: [{ label: 'ASSIGNED BUS', value: 'Not assigned', icon: BusFront }, { label: 'TODAY’S ROUTE', value: 'Not available', icon: Route }, { label: 'TRIP STATUS', value: 'Not started', icon: Activity }] },
      PARENT: { title: 'Your child’s journey', subtitle: 'Track pickup, live bus location and drop-off updates from your parent workspace.', cards: [{ label: 'CHILDREN', value: 'No linked data', icon: GraduationCap }, { label: 'BUS LOCATION', value: 'Awaiting tracking', icon: MapPinned }, { label: 'NOTIFICATIONS', value: 'No new updates', icon: Bell }] },
      STUDENT: { title: 'Your school journey', subtitle: 'Your bus assignment, pickup and drop-off information will appear here.', cards: [{ label: 'MY BUS', value: 'Not assigned', icon: BusFront }, { label: 'PICKUP STATUS', value: 'Not started', icon: Clock3 }, { label: 'ROUTE', value: 'Not available', icon: Route }] },
      SCHOOL_ADMIN: { title: 'School overview', subtitle: 'Manage your school transport operations.', cards: [] },
    }[user.role]
    return <div className="dashboard-page">
      <section className="dashboard-hero">
        <div className="hero-copy"><span className="hero-kicker"><Activity size={14} /> PERSONAL WORKSPACE</span><h2>{roleContent.title}, {user.fullName.split(' ')[0]}</h2><p>{roleContent.subtitle}</p><div className="hero-date"><CalendarDays size={15} /> {today}</div></div>
        <div className="hero-illustration"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-bus-icon"><BusFront size={58} strokeWidth={1.4} /></div><span className="hero-spark spark-one">✦</span><span className="hero-spark spark-two">✧</span></div>
      </section>
      <div className="dashboard-section-heading"><div><span className="section-kicker">AT A GLANCE</span><h3>Your overview</h3></div></div>
      <div className="dashboard-metrics">{roleContent.cards.map((card, index) => { const Icon = card.icon; return <article className="metric-card" key={card.label}><div className={`metric-icon metric-icon-${index + 1}`}><Icon size={20} /></div><span>{card.label}</span><strong className="metric-placeholder">{card.value}</strong><small>Will update when this module is available</small></article> })}</div>
      <section className="dashboard-lower-grid"><article className="glass-panel journey-panel"><div className="panel-heading"><div><span className="section-kicker">JOURNEY MONITOR</span><h3>Live journey</h3></div><span className="live-indicator"><i /> LIVE</span></div><div className="map-preview"><div className="map-road road-a" /><div className="map-road road-b" /><div className="map-road road-c" /><div className="map-route-line" /><div className="map-pin pin-start"><span /></div><div className="map-pin pin-end"><span /></div><div className="map-center-label"><MapPinned size={19} /><strong>Live tracking</strong><small>Waiting for bus location service</small></div></div><div className="panel-footnote"><span><Clock3 size={14} /> Tracking will appear when GPS integration is enabled</span><ChevronRight size={16} /></div></article><article className="glass-panel activity-panel"><div className="panel-heading"><div><span className="section-kicker">UPDATES</span><h3>Recent activity</h3></div><Bell size={18} /></div><div className="empty-activity"><div className="empty-activity-icon"><Bell size={21} /></div><strong>You’re all caught up</strong><p>New trip and notification updates will show here.</p></div></article></section>
    </div>
  }

  const totalUsers = users.length
  const rolePercent = (role: UserRole) => totalUsers ? Math.round((countRole(role) / totalUsers) * 100) : 0
  const enabledPercent = totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0

  return <div className="dashboard-page reference-dashboard">
    <section className="dashboard-heading-row">
      <div><span className="section-kicker">SCHOOL TRANSPORT INTELLIGENCE</span><h2>Operations Overview</h2><p>Welcome back, {user.fullName.split(' ')[0]}. Here is your school’s transport snapshot.</p></div>
      <button className="dashboard-refresh" onClick={() => void loadAdminOverview()} disabled={dataLoading}><RefreshCw size={14} className={dataLoading ? 'spin' : ''} /> Refresh data</button>
    </section>
    {dataError && <div className="message error">{dataError}</div>}
    <section className="reference-kpis">
      <article className="reference-card revenue-card"><div className="reference-card-top"><span>School Profile</span><span className="live-indicator"><i /> {school?.status || 'SETUP'}</span></div><strong>{dataLoading ? '…' : schools.length}</strong><small><span className="trend-up">↗</span> {school ? 'School registered' : 'Profile not configured'}</small><div className="sparkline sparkline-blue"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></article>
      <article className="reference-card"><div className="reference-card-top"><span>Total Accounts</span><Users size={17}/></div><strong>{dataLoading ? '…' : totalUsers.toLocaleString('en-IN')}</strong><small><span className="trend-up">↗</span> {activeUsers} enabled accounts</small><div className="dot-matrix">{Array.from({length:54},(_,i)=><i key={i}/>)}</div></article>
      <article className="reference-card"><div className="reference-card-top"><span>Active Accounts</span><Activity size={17}/></div><strong>{dataLoading ? '…' : activeUsers.toLocaleString('en-IN')}</strong><small><span className="trend-up">{enabledPercent}%</span> of registered accounts</small><div className="mini-area"><svg viewBox="0 0 220 68" preserveAspectRatio="none"><path d="M0 55 C25 48 30 8 65 22 S105 58 135 38 S175 8 220 15 L220 68 L0 68Z"/><path d="M0 55 C25 48 30 8 65 22 S105 58 135 38 S175 8 220 15"/></svg></div></article>
      <article className="reference-card"><div className="reference-card-top"><span>Drivers</span><BusFront size={17}/></div><strong>{dataLoading ? '…' : countRole('DRIVER').toLocaleString('en-IN')}</strong><small><span className="trend-up">↗</span> Registered driver accounts</small><div className="mini-line"><svg viewBox="0 0 220 65" preserveAspectRatio="none"><polyline points="0,12 35,28 70,48 105,44 140,48 180,40 220,20"/></svg></div></article>
    </section>

    <section className="reference-main-grid">
      <article className="reference-panel account-panel"><div className="reference-panel-heading"><div><h3>Account Distribution</h3><p>Registered users by role</p></div><span className="period-chip">All accounts⌄</span></div>
        <div className="distribution-content"><div className="donut-wrap"><div className="account-donut" style={{background: totalUsers ? `conic-gradient(#6158f5 0% ${rolePercent('DRIVER')}%,#64b8f1 ${rolePercent('DRIVER')}% ${rolePercent('DRIVER')+rolePercent('STUDENT')}%,#61dfbd ${rolePercent('DRIVER')+rolePercent('STUDENT')}% ${rolePercent('DRIVER')+rolePercent('STUDENT')+rolePercent('PARENT')}%,#9b83ff ${rolePercent('DRIVER')+rolePercent('STUDENT')+rolePercent('PARENT')}% 100%)` : 'conic-gradient(#293653 0 100%)'}}><div><strong>{dataLoading ? '…' : totalUsers}</strong><span>Total users</span></div></div></div>
          <div className="distribution-legend">{([{label:'Drivers',role:'DRIVER',color:'violet'},{label:'Students',role:'STUDENT',color:'blue'},{label:'Parents',role:'PARENT',color:'mint'}] as const).map(item=><div className="legend-row" key={item.role}><span className={`legend-dot ${item.color}`}/><span>{item.label}</span><strong>{dataLoading?'…':countRole(item.role).toLocaleString('en-IN')}</strong><small>{rolePercent(item.role)}%</small></div>)}</div>
        </div>
      </article>
      <article className="reference-panel fleet-panel"><div className="reference-panel-heading"><div><h3>Transport Readiness</h3><p>Live fleet data will appear when bus APIs are connected</p></div><span className="status-outline">IN PROGRESS</span></div>
        <div className="readiness-visual"><div className="readiness-track"><span className="readiness-fill"/></div><div className="readiness-stages"><div><strong>01</strong><b>School</b><small>{school ? 'Configured' : 'Pending'}</small></div><div><strong>02</strong><b>Drivers</b><small>{countRole('DRIVER')} registered</small></div><div><strong>03</strong><b>Vehicles</b><small>Bus module pending</small></div><div><strong>04</strong><b>Live trips</b><small>GPS module pending</small></div></div></div>
        <div className="readiness-footer"><span><i/> School setup</span><strong>{school?.status || 'NOT CONFIGURED'}</strong></div>
      </article>
    </section>

    <section className="reference-bottom-grid">
      <article className="reference-panel channels-panel"><div className="reference-panel-heading"><div><h3>School User Accounts</h3><p>Account totals by role</p></div><Users size={17}/></div>
        <div className="role-bars">{([{label:'Drivers',role:'DRIVER',color:'violet'},{label:'Students',role:'STUDENT',color:'blue'},{label:'Parents',role:'PARENT',color:'mint'}] as const).map(item=><div className="role-bar-row" key={item.role}><span>{item.label}</span><div><i className={item.color} style={{width:`${rolePercent(item.role)}%`}}/></div><strong>{dataLoading?'…':countRole(item.role)}</strong></div>)}</div>
      </article>
      <article className="reference-panel events-panel"><div className="reference-panel-heading"><div><h3>Account Status</h3><p>Enabled vs disabled users</p></div><ShieldCheck size={17}/></div><div className="status-bubbles"><div className="status-bubble enabled"><strong>{dataLoading?'…':activeUsers}</strong><span>Enabled</span></div><div className="status-bubble disabled"><strong>{dataLoading?'…':totalUsers-activeUsers}</strong><span>Disabled</span></div></div><div className="status-caption">{enabledPercent}% enabled accounts</div></article>
      <article className="reference-panel shortcuts-panel"><div className="reference-panel-heading"><div><h3>Quick Actions</h3><p>Jump into a workspace module</p></div><ArrowUpRight size={17}/></div><div className="reference-shortcuts">{quickLinks.slice(0,4).map(item=><button key={item.id} onClick={()=>item.path&&navigate(item.path)}><span>{iconFor(item.icon)}</span><b>{item.name}</b><ChevronRight size={14}/></button>)}{!quickLinks.length&&<small>No menu shortcuts are configured for this role.</small>}</div></article>
    </section>

    <section className="reference-panel school-profile-row"><div className="profile-icon"><Building2 size={20}/></div><div><span className="section-kicker">SCHOOL PROFILE</span><h3>{school?.name || 'Complete your school profile'}</h3><p>{school ? [school.city,school.state,school.country].filter(Boolean).join(', ') : 'Add school information to begin configuring transport operations.'}</p></div><span className={`profile-status ${school?.status==='ACTIVE'?'active':''}`}>{dataLoading?'LOADING':school?.status||'NOT CONFIGURED'}</span>{!school&&<button className="button primary" onClick={()=>navigate('/school')}>Set up school <ArrowUpRight size={14}/></button>}</section>
    <p className="reference-disclaimer"><Activity size={13}/> Dashboard numbers come from your School and User APIs. Bus counts, route performance, trip activity and GPS locations will populate when those backend modules are connected.</p>
  </div>
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

type SchoolDriver = {
  id: number; schoolId: number; driverCode: string; firstName: string; lastName: string
  dateOfBirth: string | null; gender: string | null; phone: string; alternatePhone: string | null
  email: string | null; address: string | null; city: string | null; state: string | null; pincode: string | null
  licenseNumber: string; licenseType: string | null; licenseExpiryDate: string | null; joiningDate: string | null
  emergencyContactName: string | null; emergencyContactPhone: string | null
  status: 'ACTIVE' | 'INACTIVE'; createdAt: string; updatedAt: string
}
type SchoolDriverForm = Omit<SchoolDriver, 'id' | 'status' | 'createdAt' | 'updatedAt'>
const emptySchoolDriver: SchoolDriverForm = {
  schoolId: 0, driverCode: '', firstName: '', lastName: '', dateOfBirth: '', gender: '',
  phone: '', alternatePhone: '', email: '', address: '', city: '', state: '', pincode: '',
  licenseNumber: '', licenseType: '', licenseExpiryDate: '', joiningDate: '',
  emergencyContactName: '', emergencyContactPhone: '',
}

function DriversPage({ token, setError, setNotice }: { token: string; setError: (value: string) => void; setNotice: (value: string) => void }) {
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
          <label className="field"><span>Driver code *</span><TextInput required maxLength={50} value={form.driverCode} onChange={e => setForm({ ...form, driverCode: e.target.value.toUpperCase() }} placeholder="e.g. DRV-001" /></label>
          <label className="field"><span>First name *</span><TextInput required maxLength={100} value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></label>
          <label className="field"><span>Last name *</span><TextInput required maxLength={100} value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></label>
          <label className="field"><span>Date of birth</span><DateInput value={form.dateOfBirth || ''} onChange={value => setForm({ ...form, dateOfBirth: value })} /></label>
          <label className="field"><span>Gender</span><SelectInput value={form.gender || ''} onChange={e => setForm({ ...form, gender: e.target.value })}><option value="">Select gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></SelectInput></label>
          <label className="field"><span>Phone *</span><PhoneInput required maxLength={20} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Primary mobile number" /></label>
          <label className="field"><span>Alternate phone</span><PhoneInput maxLength={20} value={form.alternatePhone || ''} onChange={e => setForm({ ...form, alternatePhone: e.target.value })} /></label>
          <label className="field"><span>Email</span><EmailInput maxLength={150} value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label className="field"><span>Driving licence number *</span><TextInput required maxLength={50} value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value.toUpperCase() }} placeholder="Enter licence number" /></label>
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
function BusesPage({ token, setError, setNotice }: { token: string; setError: (value: string) => void; setNotice: (value: string) => void }) {
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

function withStudentMenu(items: Menu[], role?: UserRole): Menu[] {
  if (role !== 'SCHOOL_ADMIN') return items
  return items.map(menu => {
    const name = menu.name.trim().toLowerCase()
    if (name === 'students') return { ...menu, path: '/students', subMenus: [] }
    if (name === 'drivers' || name === 'driver') return { ...menu, path: '/drivers', subMenus: [] }
    if (name === 'bus' || name === 'buses' || name === 'busses') return { ...menu, path: '/bus', subMenus: [] }
    return menu
  })
}
function flattenMenus(items: Menu[]): Menu[] { return items.flatMap(item => [item, ...flattenMenus(item.subMenus || [])]) }
function pageTitle(path: string) { return path.split('/').filter(Boolean).map(part => part.replace(/-/g, ' ').replace(/^\w/, char => char.toUpperCase())).join(' / ') || 'Dashboard' }
function initials(name: string) { return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() }
function iconFor(icon: string | null) { const icons: Record<string, string> = { 'layout-dashboard': '▦', school: '⌂', 'steering-wheel': '◉', users: '♙', route: '↗', 'map-pinned': '⌖', bell: '♧' }; return icons[icon || ''] || '•' }

export default App
