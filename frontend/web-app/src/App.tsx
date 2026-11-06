import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, BellRing, BusFront, CheckCircle2, Eye, EyeOff, LockKeyhole, LogOut, Mail, MapPinned, Navigation, ShieldCheck, UserRound, Users } from 'lucide-react'
import { getCurrentUser, login, logout, register } from './services/auth'
import type { AuthUser } from './services/auth'
import Dashboard from './components/Dashboard'
import './App.css'

type Mode = 'login' | 'register'

function App() {
  const [mode, setMode] = useState<Mode>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(() => Boolean(sessionStorage.getItem('bus_access_token')))
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    if (!sessionStorage.getItem('bus_access_token')) return
    getCurrentUser().then((currentUser) => { if (active) setUser(currentUser) })
      .catch(() => { if (active) setUser(null) })
      .finally(() => { if (active) setCheckingSession(false) })
    const onExpired = () => setUser(null)
    window.addEventListener('bus-auth-expired', onExpired)
    return () => { active = false; window.removeEventListener('bus-auth-expired', onExpired) }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')
    if (mode === 'register' && password !== confirmPassword) {
      setError('Your passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const authenticatedUser = mode === 'login'
        ? await login(email, password)
        : await register(fullName, email, password)
      setUser(authenticatedUser)
      setNotice(mode === 'login' ? 'Welcome back. You are securely signed in.' : 'Your parent account has been created.')
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || 'We could not complete your request. Check the API connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    try { await logout() } catch { /* local session is cleared even if API is unavailable */ }
    setUser(null)
    setPassword('')
    setConfirmPassword('')
    setNotice('You have been signed out.')
    setLoading(false)
  }

  if (user) return <Dashboard user={user} onLogout={handleLogout} loggingOut={loading} />

  if (checkingSession) return <main className="boot-screen"><div className="boot-mark"><BusFront size={26} /></div><span>Checking your secure session…</span></main>

  return (
    <main className="auth-shell">
      <section className="story-panel">
        <div className="brand"><div className="brand-icon"><BusFront size={23} /></div><span>School<span className="brand-light">Route</span></span><span className="brand-beta">LIVE</span></div>
        <div className="story-copy">
          <div className="eyebrow"><span className="live-dot" /> SMART SCHOOL TRANSPORT</div>
          <h1>Every journey.<br /><em>Closer to home.</em></h1>
          <p className="story-description">A safer, more connected school commute starts with knowing where the journey leads.</p>
          <div className="feature-list">
            <div className="feature-item"><span className="feature-icon"><MapPinned size={18} /></span><span><strong>Live bus visibility</strong><small>Know where the school journey is</small></span></div>
            <div className="feature-item"><span className="feature-icon"><BellRing size={18} /></span><span><strong>Timely journey updates</strong><small>Stay informed at every milestone</small></span></div>
            <div className="feature-item"><span className="feature-icon"><ShieldCheck size={18} /></span><span><strong>Parent-first privacy</strong><small>Your family data stays protected</small></span></div>
          </div>
        </div>
        <div className="route-card" aria-hidden="true">
          <div className="route-card-top"><span>YOUR CHILD'S ROUTE</span><span className="route-status"><i /> READY</span></div>
          <div className="route-visual"><div className="route-line"><span className="route-stop start"><Navigation size={13} /></span><span className="route-stop end"><BusFront size={14} /></span></div><div className="route-labels"><span><b>Home</b><small>Safe start</small></span><span><b>School</b><small>On the way</small></span></div></div>
        </div>
        <div className="story-footer"><span>BUILT AROUND SAFER SCHOOL JOURNEYS</span><span>© 2026 SCHOOLROUTE</span></div>
      </section>

      <section className="form-panel">
        <div className="mobile-brand"><div className="brand-icon"><BusFront size={22} /></div><b>School<span>Route</span></b></div>
        <div className="form-wrap">
          {user ? (
            <div className="success-view">
              <div className="success-icon"><CheckCircle2 size={32} /></div>
              <div className="form-kicker">AUTHENTICATION COMPLETE</div>
              <h2>You're all set,<br /><span>{user.fullName.split(' ')[0]}.</span></h2>
              <p className="form-intro">Your account is securely connected. The parent workspace will become available as we build the school, student and trip modules.</p>
              <div className="account-card"><div className="account-avatar">{user.fullName.slice(0, 1).toUpperCase()}</div><div className="account-details"><strong>{user.fullName}</strong><span>{user.email}</span></div><span className="role-pill">{user.role}</span></div>
              <div className="session-note"><ShieldCheck size={16} /> RSA-secured session active</div>
              <button className="primary-button" onClick={handleLogout} disabled={loading}>{loading ? 'Signing out…' : 'Sign out'} <LogOut size={17} /></button>
              <p className="fine-print">Your refresh session is stored as a hash on the server.</p>
            </div>
          ) : (
            <>
              <div className="form-kicker">{mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}</div>
              <h2>{mode === 'login' ? <>Good to see<br /><span>you again.</span></> : <>Join the<br /><span>parent community.</span></>}</h2>
              <p className="form-intro">{mode === 'login' ? 'Sign in to stay connected to your child’s school journey.' : 'Create your parent account to get started with safer school journeys.'}</p>
              <div className="mode-switch" role="tablist" aria-label="Authentication mode">
                <button type="button" className={mode === 'login' ? 'selected' : ''} onClick={() => { setMode('login'); setError(''); setNotice('') }}>Sign in</button>
                <button type="button" className={mode === 'register' ? 'selected' : ''} onClick={() => { setMode('register'); setError(''); setNotice('') }}>Create account</button>
              </div>
              {notice && <div className="notice-message"><CheckCircle2 size={16} />{notice}</div>}
              {error && <div className="error-message" role="alert">{error}</div>}
              <form onSubmit={handleSubmit} className="auth-form">
                {mode === 'register' && <label className="field-label">Full name<span className="input-wrap"><UserRound size={17} /><input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" autoComplete="name" required minLength={2} maxLength={120} /></span></label>}
                <label className="field-label">Email address<span className="input-wrap"><Mail size={17} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></span></label>
                <label className="field-label">Password<span className="input-wrap"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} maxLength={72} /><button className="visibility-button" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
                {mode === 'register' && <label className="field-label">Confirm password<span className="input-wrap"><LockKeyhole size={17} /><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter your password again" autoComplete="new-password" required minLength={8} maxLength={72} /></span></label>}
                {mode === 'register' && <div className="role-hint"><Users size={15} /> New registrations are created with the Parent role.</div>}
                <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Please wait…' : mode === 'login' ? 'Sign in securely' : 'Create parent account'}{!loading && <ArrowRight size={18} />}</button>
              </form>
              <div className="secure-caption"><ShieldCheck size={15} /><span>Protected with RSA-256 token signing and BCrypt password hashing.</span></div>
            </>
          )}
        </div>
        <div className="form-bottom"><span>NEED HELP? <a href="mailto:support@schoolroute.local">CONTACT SUPPORT</a></span><span>PRIVACY FIRST · ALWAYS</span></div>
      </section>
    </main>
  )
}

export default App
