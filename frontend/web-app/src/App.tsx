import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Monitor, Moon, Sun, ShieldCheck, UserRound } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api, withStudentMenu, flattenMenus, pageTitle } from './pages/LegacyPages'
import { LoginPage } from './features/auth/LoginPage'
import { MenuItem } from './components/navigation/MenuItem'
import type { LoginResponse, LoginUser, Menu, MenuResponse, School, ThemeMode } from './pages/LegacyPages'
import AppRoutes from './routes/AppRoutes'
import { Toast } from './components/ui/Toast'
import type { ToastMessage } from './components/ui/Toast'
import './App.css'

const menuCacheKey = (user: LoginUser) => `schoolroute-menus:${user.id}:${user.role}`
const schoolCacheKey = (user: LoginUser) => `schoolroute-school:${user.id}`

type CachedMenuResponse = {
  userId: string
  role: LoginUser['role']
  defaultPath: string
  menus: Menu[]
}

function readCachedMenus(currentUser: LoginUser): CachedMenuResponse | null {
  try {
    const raw = localStorage.getItem(menuCacheKey(currentUser))
    if (!raw) return null
    const cached = JSON.parse(raw) as CachedMenuResponse
    if (
      cached.userId !== currentUser.id ||
      cached.role !== currentUser.role ||
      !Array.isArray(cached.menus)
    ) return null
    return cached
  } catch {
    localStorage.removeItem(menuCacheKey(currentUser))
    return null
  }
}

function readCachedSchool(currentUser: LoginUser): School | null {
  try {
    const raw = localStorage.getItem(schoolCacheKey(currentUser))
    if (!raw) return null
    const school = JSON.parse(raw) as School
    if (!school || typeof school.id !== 'number' || typeof school.name !== 'string') return null
    return school
  } catch {
    localStorage.removeItem(schoolCacheKey(currentUser))
    return null
  }
}

function saveCachedSchool(currentUser: LoginUser, schools: School[]) {
  // This installation currently supports one school.
  const school = schools[0] || null
  if (school) localStorage.setItem(schoolCacheKey(currentUser), JSON.stringify(school))
  else localStorage.removeItem(schoolCacheKey(currentUser))
  return school
}

function saveCachedMenus(currentUser: LoginUser, result: MenuResponse) {
  const cached: CachedMenuResponse = {
    userId: currentUser.id,
    role: currentUser.role,
    defaultPath: result.defaultPath || '/',
    menus: withStudentMenu(result.menus || [], currentUser.role),
  }
  localStorage.setItem(menuCacheKey(currentUser), JSON.stringify(cached))
  return cached
}

function App() {
  const [token, setToken] = useState(sessionStorage.getItem('accessToken') || '')
  const [user, setUser] = useState<LoginUser | null>(() => {
    try { return JSON.parse(sessionStorage.getItem('currentUser') || 'null') as LoginUser | null } catch { return null }
  })
  const [menus, setMenus] = useState<Menu[]>(() => user ? readCachedMenus(user)?.menus || [] : [])
  const [school, setSchool] = useState<School | null>(() => user ? readCachedSchool(user) : null)
  const location = useLocation()
  const routerNavigate = useNavigate()
  const currentPath = location.pathname
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const setError = useCallback((message: string) => setToast(message ? { id: Date.now(), type: 'error', message } : null), [])
  const setNotice = useCallback((message: string) => setToast(message ? { id: Date.now(), type: 'success', message } : null), [])
  const closeToast = useCallback(() => setToast(null), [])
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => (localStorage.getItem('schoolroute-theme') as ThemeMode) || 'dark')
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const navigate = useCallback((path: string) => {
    if (!path) return
    routerNavigate(path)
    setMobileSidebarOpen(false)
    setError('')
    setNotice('')
  }, [routerNavigate])

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
    if (!token || !user) return
    let active = true

    // Restore the school profile from localStorage. Fetch only for older sessions
    // that do not have a cached school profile.
    if (user.role === 'SCHOOL_ADMIN') {
      const cachedSchool = readCachedSchool(user)
      if (cachedSchool) {
        setSchool(cachedSchool)
      } else {
        api<School[]>('/school', token)
          .then(rows => {
            if (active) setSchool(saveCachedSchool(user, rows))
          })
          .catch(() => {
            if (active) setSchool(null)
          })
      }
    } else {
      setSchool(null)
    }

    // Reuse cached menus after refresh; do not call /menu/me on page navigation.
    const cached = readCachedMenus(user)
    if (cached) {
      setMenus(cached.menus)
      if (currentPath === '/' || currentPath === '/login') {
        navigate(cached.defaultPath || '/')
      }
      setLoading(false)
      return () => { active = false }
    }

    setLoading(true)
    api<MenuResponse>('/menu/me', token)
      .then(result => {
        if (!active) return
        const saved = saveCachedMenus(user, result)
        setMenus(saved.menus)
        if (currentPath === '/' || currentPath === '/login') {
          navigate(saved.defaultPath || '/')
        }
      })
      .catch(() => { if (active) logout() })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
    // Initial session restoration only; navigation is handled separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function logout() {
    if (user) {
      localStorage.removeItem(menuCacheKey(user))
      localStorage.removeItem(schoolCacheKey(user))
    }
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('currentUser')
    setToken('')
    setUser(null)
    setUserMenuOpen(false)
    setMenus([])
    setSchool(null)
    navigate('/login')
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginBusy(true); setError('')
    try {
      const result = await api<LoginResponse>('/auth/login', '', { method: 'POST', body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }) })
      sessionStorage.setItem('accessToken', result.accessToken)
      sessionStorage.setItem('currentUser', JSON.stringify(result.user))
      setToken(result.accessToken); setUser(result.user); setUserMenuOpen(false)
      const menuResult = await api<MenuResponse>('/menu/me', result.accessToken)
      const savedMenus = saveCachedMenus(result.user, menuResult)
      setMenus(savedMenus.menus)

      // Fetch the school profile once at login and cache it for later visits.
      if (result.user.role === 'SCHOOL_ADMIN') {
        try {
          const schoolRows = await api<School[]>('/school', result.accessToken)
          setSchool(saveCachedSchool(result.user, schoolRows))
        } catch {
          setSchool(null)
        }
      } else {
        setSchool(null)
      }

      navigate(savedMenus.defaultPath || '/')
    } catch (err) {
      sessionStorage.removeItem('accessToken'); sessionStorage.removeItem('currentUser')
      setError(err instanceof Error ? err.message : 'Unable to sign in. Check your credentials.')
    } finally { setLoginBusy(false) }
  }

  const activeMenu = useMemo(() => flattenMenus(menus).find(item => item.path === currentPath), [menus, currentPath])

  if (!token || !user) {
    return <><Toast toast={toast} onClose={closeToast} /><LoginPage email={loginEmail} password={loginPassword} setEmail={setLoginEmail} setPassword={setLoginPassword} onSubmit={handleLogin} busy={loginBusy} /> </>
  }

  return (
    <>
    <Toast toast={toast} onClose={closeToast} />
    <main className={`app-shell ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
      <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMobileSidebarOpen(false)} />
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">{school?.name?.slice(0, 2).toUpperCase() || 'SR'}</span><span className="school-brand-name" title={school?.name || 'SchoolRoute'}>{school?.name || 'SchoolRoute'}<small>SCHOOL BUS MANAGEMENT</small></span></div>
        <p className="nav-caption">WORKSPACE</p>
        <nav className="menu-tree">{menus.map(menu => <MenuItem key={menu.id} menu={menu} currentPath={currentPath} navigate={navigate} />)}</nav>
        <div className="sidebar-note"><span className="note-dot" /> Secure role-based access</div>
        
      </aside>
      <section className="workspace">
        <header className="topbar">
          <button className="mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileSidebarOpen(true)}>☰</button>
          <div className="topbar-title"><span className="eyebrow">{user.role.replace('_', ' ')}</span><h1>{activeMenu?.name || pageTitle(currentPath)}</h1></div>
          <div className="topbar-right"><label className="theme-picker" title="Choose appearance"><span className="theme-picker-icon">{themeMode === 'system' ? <Monitor size={16} /> : themeMode === 'dark' ? <Moon size={16} /> : <Sun size={16} />}</span><select aria-label="Appearance mode" value={themeMode} onChange={event => setThemeMode(event.target.value as ThemeMode)}><option value="system">System</option><option value="dark">Dark</option><option value="light">Light</option></select></label><span className="secure-label"><ShieldCheck size={14} /> Signed in</span><div className="user-menu"><button type="button" className="user-menu-trigger" aria-label="Open user menu" aria-haspopup="true" aria-expanded={userMenuOpen} onClick={() => setUserMenuOpen(value => !value)}><UserRound size={19} /></button>{userMenuOpen && <div className="user-menu-dropdown" role="menu"><div className="user-menu-profile"><strong>{user.fullName}</strong><span>{user.role.replace('_', ' ')}</span></div><button type="button" role="menuitem" className="user-menu-signout" onClick={logout}>Sign out</button></div>}</div></div>
        </header>
        <div className="content">
          {loading && <div className="loading">Loading your workspace…</div>}
          <AppRoutes token={token} user={user} menus={menus} currentPath={currentPath} navigate={navigate} setError={setError} setNotice={setNotice} />
        </div>
      </section>
    </main>
    </>
  )
}

export default App
