import { useCallback, useEffect, useState } from 'react'
import type { UserRole, LoginUser, Menu, Driver, School, Bus } from '../../pages/LegacyPages'
import { flattenMenus, iconFor } from '../../pages/LegacyPages'
import { Activity, ArrowUpRight, Bell, BusFront, Building2, CalendarDays, ChevronRight, Clock3, GraduationCap, MapPinned, RefreshCw, Route, ShieldCheck, Users } from 'lucide-react'

export function DashboardPage({ user, path, token, menus, navigate }: { user: LoginUser; path: string; token: string; menus: Menu[]; navigate: (path: string) => void }) {
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
