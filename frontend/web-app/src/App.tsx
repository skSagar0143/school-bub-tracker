import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Monitor, Moon, Sun, ShieldCheck, UserRound } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api, withStudentMenu, flattenMenus, pageTitle } from './pages/LegacyPages'
import { LoginPage } from './features/auth/LoginPage'
import { MenuItem } from './components/navigation/MenuItem'
import type { LoginResponse, LoginUser, Menu, MenuResponse, ThemeMode } from './pages/LegacyPages'
import AppRoutes from './routes/AppRoutes'
import './App.css'

function App() {
  const [token, setToken] = useState(sessionStorage.getItem('accessToken') || '')
  const [user, setUser] = useState<LoginUser | null>(() => {
    try { return JSON.parse(sessionStorage.getItem('currentUser') || 'null') as LoginUser | null } catch { return null }
  })
  const [menus, setMenus] = useState<Menu[]>([])
  const location = useLocation()
  const routerNavigate = useNavigate()
  const currentPath = location.pathname
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
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
    setUserMenuOpen(false)
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
      setToken(result.accessToken); setUser(result.user); setUserMenuOpen(false)
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
        
      </aside>
      <section className="workspace">
        <header className="topbar">
          <button className="mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileSidebarOpen(true)}>☰</button>
          <div className="topbar-title"><span className="eyebrow">{user.role.replace('_', ' ')}</span><h1>{activeMenu?.name || pageTitle(currentPath)}</h1></div>
          <div className="topbar-right"><label className="theme-picker" title="Choose appearance"><span className="theme-picker-icon">{themeMode === 'system' ? <Monitor size={16} /> : themeMode === 'dark' ? <Moon size={16} /> : <Sun size={16} />}</span><select aria-label="Appearance mode" value={themeMode} onChange={event => setThemeMode(event.target.value as ThemeMode)}><option value="system">System</option><option value="dark">Dark</option><option value="light">Light</option></select></label><span className="secure-label"><ShieldCheck size={14} /> Signed in</span><div className="user-menu"><button type="button" className="user-menu-trigger" aria-label="Open user menu" aria-haspopup="true" aria-expanded={userMenuOpen} onClick={() => setUserMenuOpen(value => !value)}><UserRound size={19} /></button>{userMenuOpen && <div className="user-menu-dropdown" role="menu"><div className="user-menu-profile"><strong>{user.fullName}</strong><span>{user.role.replace('_', ' ')}</span></div><button type="button" role="menuitem" className="user-menu-signout" onClick={logout}>Sign out</button></div>}</div></div>
        </header>
        <div className="content">
          {loading && <div className="loading">Loading your workspace…</div>}
          {error && <div className="message error">{error}</div>}
          {notice && <div className="message success">{notice}</div>}
          <AppRoutes token={token} user={user} menus={menus} currentPath={currentPath} navigate={navigate} setError={setError} setNotice={setNotice} />
        </div>
      </section>
    </main>
  )
}

export default App
