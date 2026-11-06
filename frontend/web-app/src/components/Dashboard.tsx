import { useMemo, useState } from 'react'
import {
  Activity, ArrowUpRight, Bell, BusFront, CalendarDays,
  CheckCircle2, ChevronDown, CircleHelp, Clock3, Command, Compass,
  LayoutDashboard, LogOut, MapPin, Menu, Navigation,
  Search, Settings, ShieldCheck, UserRound, Users, X, Route
} from 'lucide-react'
import type { AuthUser } from '../services/auth'
import SchoolManagement from './SchoolManagement'
import './Dashboard.css'

type Props = { user: AuthUser; onLogout: () => void; loggingOut: boolean }
type NavItem = { label: string; icon: typeof LayoutDashboard }

const parentNav: NavItem[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Live tracking', icon: MapPin },
  { label: 'My children', icon: Users },
  { label: 'Routes & stops', icon: Route },
  { label: 'Notifications', icon: Bell },
]
const staffNav: NavItem[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Live fleet', icon: BusFront },
  { label: 'Students', icon: Users },
  { label: 'Routes', icon: Route },
  { label: 'Reports', icon: Activity },
]
const adminNav: NavItem[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Live operations', icon: MapPin },
  { label: 'Schools', icon: Compass },
  { label: 'Students & staff', icon: Users },
  { label: 'Fleet & routes', icon: BusFront },
  { label: 'Reports', icon: Activity },
]

const roleTitle: Record<string, string> = {
  PARENT: 'Parent workspace',
  DRIVER: 'Driver workspace',
  SCHOOL_ADMIN: 'School control center',
  SUPER_ADMIN: 'Platform overview',
}

function Dashboard({ user, onLogout, loggingOut }: Props) {
  const role = user.role.toUpperCase()
  const isParent = role === 'PARENT'
  const isDriver = role === 'DRIVER'
  const navItems = isParent ? parentNav : isDriver ? staffNav : adminNav
  const [activeNav, setActiveNav] = useState('Overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [noticeOpen, setNoticeOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [toast, setToast] = useState('')
  const firstName = user.fullName.trim().split(/\s+/)[0] || 'there'
  const dateLabel = useMemo(() => new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()), [])

  const showComingSoon = (feature: string) => {
    setToast(`${feature} will be connected when its backend module is ready.`)
    window.setTimeout(() => setToast(''), 3200)
  }

  return (
    <div className="dashboard-shell">
      {sidebarOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="dash-brand">
          <div className="dash-brand-icon"><BusFront size={21} /></div>
          <span>School<span>Route</span></span>
          <button className="mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <div className="workspace-switch">
          <div className="workspace-avatar">{isParent ? <UserRound size={17} /> : <ShieldCheck size={17} />}</div>
          <div><strong>{roleTitle[role] || 'SchoolRoute workspace'}</strong><small>{isParent ? 'Family account' : isDriver ? 'Transport team' : 'Administration'}</small></div>
          <ChevronDown size={15} />
        </div>
        <div className="nav-caption">MENU</div>
        <nav className="dash-nav" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={activeNav === label ? 'active' : ''} onClick={() => { setActiveNav(label); setSidebarOpen(false); if (label !== 'Overview' && !(role === 'SCHOOL_ADMIN' && label === 'Schools')) showComingSoon(label) }}>
              <Icon size={18} /><span>{label}</span>{label === 'Notifications' && <i className="nav-count">2</i>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="nav-caption">PREFERENCES</div>
          <button onClick={() => showComingSoon('Settings')}><Settings size={18} /><span>Settings</span></button>
          <button onClick={() => showComingSoon('Help center')}><CircleHelp size={18} /><span>Help center</span></button>
          <div className="sidebar-help-card">
            <div className="help-icon"><ShieldCheck size={17} /></div>
            <strong>Your family's safety matters.</strong>
            <p>SchoolRoute keeps your journey information in one secure place.</p>
            <button onClick={() => showComingSoon('Safety center')}>Safety center <ArrowUpRight size={14} /></button>
          </div>
          <button className="sidebar-logout" onClick={onLogout} disabled={loggingOut}><LogOut size={18} /><span>{loggingOut ? 'Signing out…' : 'Sign out'}</span></button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button className="mobile-menu" aria-label="Open menu" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
            <div className="breadcrumb">Workspace <span>/</span> <b>{activeNav}</b></div>
          </div>
          <div className="topbar-actions">
            <div className="topbar-search"><Search size={16} /><input placeholder="Search anything…" aria-label="Search" onFocus={() => showComingSoon('Search')} /><kbd><Command size={11} /> K</kbd></div>
            <div className="popover-wrap">
              <button className={`icon-action ${noticeOpen ? 'is-open' : ''}`} aria-label="Notifications" onClick={() => { setNoticeOpen(!noticeOpen); setProfileOpen(false) }}><Bell size={18} /><i /></button>
              {noticeOpen && <div className="top-popover"><strong>Notifications</strong><p className="popover-empty">You're all caught up. New journey alerts will appear here.</p></div>}
            </div>
            <div className="profile-wrap">
              <button className="profile-trigger" onClick={() => { setProfileOpen(!profileOpen); setNoticeOpen(false) }}><span className="profile-avatar">{user.fullName.slice(0, 1).toUpperCase()}</span><span className="profile-meta"><b>{user.fullName}</b><small>{role.replace('_', ' ')}</small></span><ChevronDown size={15} /></button>
              {profileOpen && <div className="top-popover profile-popover"><strong>{user.fullName}</strong><p>{user.email}</p><button onClick={onLogout}><LogOut size={15} /> Sign out</button></div>}
            </div>
          </div>
        </header>

        <main className="dashboard-content">
          <div className="welcome-row">
            <div><div className="dash-eyebrow"><span /> YOUR SCHOOL JOURNEY, CONNECTED</div><h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {firstName}<span>.</span></h1><p>Here's what's happening with your school commute today.</p></div>
            <div className="date-chip"><CalendarDays size={16} /> {dateLabel}</div>
          </div>

          <div className="preview-banner"><div className="preview-mark"><Activity size={17} /></div><div><strong>Workspace preview</strong><span>Your secure account is connected. Live student, bus and trip data will appear here as the remaining modules are integrated.</span></div><span className="preview-pill">SETUP IN PROGRESS</span></div>

          {role === 'SCHOOL_ADMIN' && activeNav === 'Schools' ? (
            <SchoolManagement />
          ) : isParent ? (
            <>
              <div className="section-heading"><div><h2>Family overview</h2><p>A clear view of the journeys that matter.</p></div><button className="outline-action" onClick={() => showComingSoon('Link a child')}><Users size={16} /> Link a child</button></div>
              <div className="parent-grid">
                <article className="empty-child-card">
                  <div className="empty-illustration"><Users size={27} /><span><BusFront size={16} /></span></div>
                  <div className="empty-tag">GET STARTED</div><h3>No child linked yet</h3><p>Connect your child to their school to see assigned buses, route details and journey updates here.</p>
                  <button className="solid-action" onClick={() => showComingSoon('Child linking')}>Connect a child <ArrowUpRight size={16} /></button>
                </article>
                <article className="journey-card">
                  <div className="card-heading"><div><h3>Today's journey</h3><p>Pickup and drop-off updates</p></div><span className="soft-status">AWAITING SETUP</span></div>
                  <div className="journey-empty"><div className="journey-route-icon"><Navigation size={20} /></div><strong>Your journey timeline will appear here</strong><span>Once a child and route are linked, you'll see each trip milestone.</span></div>
                  <div className="journey-legend"><span><i className="legend-home" /> Home pickup</span><span><i className="legend-school" /> School arrival</span><span><i className="legend-bus" /> Bus in transit</span></div>
                </article>
              </div>
              <div className="lower-grid">
                <article className="panel-card"><div className="card-heading"><div><h3>Recent activity</h3><p>Updates from your family account</p></div><Clock3 size={17} /></div><div className="activity-empty"><div><CheckCircle2 size={18} /></div><span><b>You're all caught up</b><small>New account and journey activity will show here.</small></span></div></article>
                <article className="panel-card safety-panel"><div className="safety-symbol"><ShieldCheck size={22} /></div><div><h3>Safety comes first</h3><p>Only linked children and their assigned journeys will be visible in your parent account.</p><button onClick={() => showComingSoon('Privacy settings')}>Learn about privacy <ArrowUpRight size={14} /></button></div></article>
              </div>
            </>
          ) : (
            <>
              <div className="section-heading"><div><h2>{isDriver ? 'Your shift at a glance' : 'Operations at a glance'}</h2><p>{isDriver ? 'Your assigned trips and route information.' : 'A live overview of your school transport network.'}</p></div><button className="outline-action" onClick={() => showComingSoon('Live map')}><MapPin size={16} /> Open live map</button></div>
              <div className="metric-grid">
                {(isDriver ? [
                  ['Assigned trips', '—', 'No trips assigned yet', BusFront],
                  ['Students onboard', '—', 'Trip data not connected', Users],
                  ['Next pickup', '—', 'Awaiting route assignment', MapPin],
                  ['Shift status', 'Ready', 'No active shift', Clock3],
                ] : [
                  ['Total students', '—', 'Awaiting student module', Users],
                  ['Active buses', '—', 'Awaiting fleet module', BusFront],
                  ['Routes today', '—', 'Awaiting route module', Route],
                  ['Trips in progress', '—', 'Live tracking not connected', Activity],
                ]).map(([label, value, caption, Icon]) => {
                  const MetricIcon = Icon as typeof Users
                  return <article className="metric-card" key={label as string}><div className="metric-top"><span>{label as string}</span><i><MetricIcon size={17} /></i></div><strong>{value as string}</strong><small>{caption as string}</small></article>
                })}
              </div>
              <div className="lower-grid"><article className="panel-card"><div className="card-heading"><div><h3>Live transport map</h3><p>Bus locations and route progress</p></div><MapPin size={17} /></div><div className="map-placeholder"><div className="map-grid-lines" /><div className="map-center"><div><BusFront size={22} /></div><b>Live map is getting ready</b><span>Location services will appear when tracking is connected.</span></div></div></article><article className="panel-card"><div className="card-heading"><div><h3>Today's operations</h3><p>Upcoming activity and alerts</p></div><CalendarDays size={17} /></div><div className="activity-empty"><div><CheckCircle2 size={18} /></div><span><b>No scheduled activity yet</b><small>Trips and alerts will appear after setup.</small></span></div></article></div>
            </>
          )}
          <footer className="dashboard-footer"><span>© 2026 SchoolRoute · Safer journeys, stronger connections.</span><span><ShieldCheck size={13} /> Secure workspace</span></footer>
        </main>
      </section>
      {toast && <div className="dashboard-toast"><CheckCircle2 size={17} />{toast}</div>}
    </div>
  )
}

export default Dashboard
