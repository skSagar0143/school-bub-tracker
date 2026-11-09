import type { SchoolRoute } from '../../pages/LegacyPages'
import { EmailInput, PasswordInput } from '../../components/ui/FormControls'

export function LoginPage({ email, password, setEmail, setPassword, onSubmit, busy, error }: {
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
