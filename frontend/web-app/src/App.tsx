import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Activity, ArrowUpRight, Bell, BusFront, Building2, CalendarDays, ChevronRight, Clock3, GraduationCap, MapPinned, Monitor, Moon, RefreshCw, Route, ShieldCheck, Sun, Users, UserRound } from 'lucide-react'
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
const emptyStudent: StudentForm = {
  schoolId: 0, firstName: '', lastName: '', admissionNumber: '', dateOfBirth: '', gender: '',
  className: '', section: '', rollNumber: '', parentName: '', parentPhone: '',
  parentEmail: '', emergencyContact: '', address: '',
}
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

function StudentsPage({ token, setError, setNotice }: { token: string; setError: (value: string) => void; setNotice: (value: string) => void }) {
  const [students, setStudents] = useState<Student[]>([])
  const [form, setForm] = useState<StudentForm>(emptyStudent)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])

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
    <div className="page-intro">
      <div><h2>Student management</h2><p>Add, update and manage students. Select students to perform bulk actions.</p></div>
      <div className="page-header-actions">
        <button className="button primary" onClick={openCreateForm}><Users size={15} /> Add Students</button>
        <button className="button secondary" disabled={selectedIds.length === 0} onClick={() => setNotice('Bus assignment UI is ready; it will be connected when the backend student-to-bus assignment API is added.')}><BusFront size={15} /> Bus Assign ({selectedIds.length})</button>
        <button className="button danger" disabled={selectedIds.length === 0} onClick={() => void deleteSelectedStudents()}><Users size={15} /> Delete Students ({selectedIds.length})</button>
        <button className="button secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={14} /> Refresh</button>
      </div>
    </div>

    {showForm && <section className="panel form-panel">
      <div className="panel-heading"><div><span className="section-kicker">STUDENT RECORD</span><h3>{editingId ? 'Update student' : 'Add new student'}</h3></div></div>
      <form onSubmit={submit}>
        <div className="form-grid">
          <label className="field"><span>School ID *</span><input type="number" min="1" required value={form.schoolId || ''} onChange={e => setForm({ ...form, schoolId: Number(e.target.value) })} /></label>
          <label className="field"><span>Admission number *</span><input required maxLength={50} value={form.admissionNumber} onChange={e => setForm({ ...form, admissionNumber: e.target.value })} /></label>
          <label className="field"><span>First name *</span><input required maxLength={100} value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></label>
          <label className="field"><span>Last name</span><input maxLength={100} value={form.lastName || ''} onChange={e => setForm({ ...form, lastName: e.target.value })} /></label>
          <label className="field"><span>Date of birth</span><input type="date" value={form.dateOfBirth || ''} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} /></label>
          <label className="field"><span>Gender</span><select value={form.gender || ''} onChange={e => setForm({ ...form, gender: e.target.value })}><option value="">Select gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></label>
          <label className="field"><span>Class *</span><input required maxLength={50} value={form.className} onChange={e => setForm({ ...form, className: e.target.value })} placeholder="e.g. 5" /></label>
          <label className="field"><span>Section</span><input maxLength={20} value={form.section || ''} onChange={e => setForm({ ...form, section: e.target.value })} /></label>
          <label className="field"><span>Roll number</span><input maxLength={30} value={form.rollNumber || ''} onChange={e => setForm({ ...form, rollNumber: e.target.value })} /></label>
          <label className="field"><span>Parent / guardian name *</span><input required maxLength={150} value={form.parentName} onChange={e => setForm({ ...form, parentName: e.target.value })} /></label>
          <label className="field"><span>Parent phone *</span><input required type="tel" maxLength={15} value={form.parentPhone} onChange={e => setForm({ ...form, parentPhone: e.target.value })} /></label>
          <label className="field"><span>Parent email</span><input type="email" maxLength={150} value={form.parentEmail || ''} onChange={e => setForm({ ...form, parentEmail: e.target.value })} /></label>
          <label className="field"><span>Emergency contact</span><input type="tel" maxLength={15} value={form.emergencyContact || ''} onChange={e => setForm({ ...form, emergencyContact: e.target.value })} /></label>
          <label className="field field-wide"><span>Address</span><textarea rows={2} maxLength={500} value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
        </div>
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</button>
          <button className="button primary" disabled={busy}>{busy ? 'Saving…' : editingId ? 'Update student' : 'Save student'}</button>
        </div>
      </form>
    </section>}

    <section className="panel">
      <div className="panel-heading student-list-heading">
        <div><span className="section-kicker">SCHOOL DIRECTORY</span><h3>All students <small className="count-label">{filteredStudents.length}</small></h3></div>
        <input className="student-search" type="search" placeholder="Search name, admission no., class…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="table-wrap"><table>
        <thead><tr><th><input aria-label="Select all active students" type="checkbox" checked={filteredStudents.filter(student => student.status === 'ACTIVE').length > 0 && filteredStudents.filter(student => student.status === 'ACTIVE').every(student => selectedIds.includes(student.id))} onChange={event => { const visibleActiveIds = filteredStudents.filter(student => student.status === 'ACTIVE').map(student => student.id); setSelectedIds(event.target.checked ? Array.from(new Set([...selectedIds, ...visibleActiveIds])) : selectedIds.filter(id => !visibleActiveIds.includes(id))) }} /></th><th>Student</th><th>Admission no.</th><th>Class</th><th>Parent / guardian</th><th>Parent phone</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {filteredStudents.map(student => <tr key={student.id}>
            <td><input aria-label={`Select ${student.firstName}`} type="checkbox" disabled={student.status !== 'ACTIVE'} checked={selectedIds.includes(student.id)} onChange={event => setSelectedIds(current => event.target.checked ? [...current, student.id] : current.filter(id => id !== student.id))} /></td>
            <td><strong>{student.firstName} {student.lastName || ''}</strong><small className="student-subtext">ID #{student.id}</small></td>
            <td>{student.admissionNumber}</td><td>{student.className}{student.section ? ` - ${student.section}` : ''}</td>
            <td>{student.parentName}</td><td>{student.parentPhone}</td>
            <td><span className={`status-pill ${student.status === 'ACTIVE' ? 'active' : 'inactive'}`}>{student.status}</span></td>
            <td className="actions-cell"><button className="table-action" onClick={() => editStudent(student)}>Edit</button>{student.status === 'ACTIVE' && <button className="table-action danger" onClick={() => void deleteStudent(student)}>Delete</button>}</td>
          </tr>)}
          {!loading && filteredStudents.length === 0 && <tr><td colSpan={8} className="empty-cell">{search ? 'No students match your search.' : 'No students found. Add your first student.'}</td></tr>}
          {loading && <tr><td colSpan={8} className="empty-cell">Loading students…</td></tr>}
        </tbody>
      </table></div>
    </section>
    <p className="footnote">Deleting a student deactivates the record; historical transport and trip records are preserved.</p>
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
function withStudentMenu(items: Menu[], role?: UserRole): Menu[] {
  if (role !== 'SCHOOL_ADMIN') return items
  return items.map(menu => menu.name.trim().toLowerCase() === 'students'
    ? { ...menu, path: '/students', subMenus: [] }
    : menu)
}
function flattenMenus(items: Menu[]): Menu[] { return items.flatMap(item => [item, ...flattenMenus(item.subMenus || [])]) }
function pageTitle(path: string) { return path.split('/').filter(Boolean).map(part => part.replace(/-/g, ' ').replace(/^\w/, char => char.toUpperCase())).join(' / ') || 'Dashboard' }
function initials(name: string) { return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() }
function iconFor(icon: string | null) { const icons: Record<string, string> = { 'layout-dashboard': '▦', school: '⌂', 'steering-wheel': '◉', users: '♙', route: '↗', 'map-pinned': '⌖', bell: '♧' }; return icons[icon || ''] || '•' }

export default App
