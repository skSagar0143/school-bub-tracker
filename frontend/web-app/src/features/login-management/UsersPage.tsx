import { useCallback, useEffect, useState } from 'react'
import { KeyRound, RefreshCw, ShieldCheck, UserRoundCheck, UserRoundX } from 'lucide-react'
import { api } from '../../pages/LegacyPages'

type Account = {
  id: string
  fullName: string
  loginId: string | null
  role: 'STUDENT' | 'DRIVER'
  enabled: boolean
  createdAt: string
}

type ResetResult = { loginId: string; temporaryPassword: string }

export function UsersPage({ token, setError, setNotice }: {
  token: string
  setError: (value: string) => void
  setNotice: (value: string) => void
}) {
  const [role, setRole] = useState<'STUDENT' | 'DRIVER'>('STUDENT')
  const [rows, setRows] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [resetResult, setResetResult] = useState<ResetResult | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await api<Account[]>(`/user?role=${role}`, token))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to load user accounts.')
    } finally {
      setLoading(false)
    }
  }, [role, token, setError])

  useEffect(() => { void load() }, [load])

  async function toggleStatus(account: Account) {
    setBusyId(account.id)
    try {
      await api<Account>(`/user/${account.id}/status`, token, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !account.enabled }),
      })
      setNotice(`${account.fullName} account ${account.enabled ? 'deactivated' : 'activated'}.`)
      await load()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to update account status.')
    } finally {
      setBusyId(null)
    }
  }

  async function resetPassword(account: Account) {
    if (!window.confirm(`Reset password for ${account.fullName}? The current password will stop working immediately.`)) return
    setBusyId(account.id)
    setResetResult(null)
    try {
      const result = await api<ResetResult>(`/user/${account.id}/reset-password`, token, { method: 'POST' })
      setResetResult(result)
      setNotice('Password reset. Share this temporary password securely; it will not be shown again.')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to reset password.')
    } finally {
      setBusyId(null)
    }
  }

  return <>
    <div className="page-intro">
      <div><h2>Users</h2><p>Manage student and driver login accounts, access and temporary passwords.</p></div>
      <button className="button secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={14}/> Refresh</button>
    </div>
    <section className="panel">
      <div className="panel-heading">
        <div><span className="section-kicker">ACCOUNT DIRECTORY</span><h3>Login accounts <small className="count-label">{rows.length}</small></h3></div>
        <div className="table-header-tools">
          <select aria-label="Filter account role" value={role} onChange={event => setRole(event.target.value as 'STUDENT' | 'DRIVER')}>
            <option value="STUDENT">Students</option>
            <option value="DRIVER">Drivers</option>
          </select>
        </div>
      </div>
      {resetResult && <div className="login-info-strip"><ShieldCheck size={18}/><div><strong>New temporary password for {resetResult.loginId}</strong><span> {resetResult.temporaryPassword} — copy it now and share it securely.</span></div><button className="button secondary" onClick={() => { void navigator.clipboard.writeText(resetResult.temporaryPassword).then(() => setNotice('Temporary password copied.')).catch(() => setError('Clipboard access was blocked.')) }}>Copy</button></div>}
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Login ID</th><th>Role</th><th>Access</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map(account => <tr key={account.id}>
              <td><strong>{account.fullName}</strong></td>
              <td><code>{account.loginId || '—'}</code></td>
              <td>{account.role}</td>
              <td><span className={`status-pill ${account.enabled ? 'active' : 'inactive'}`}>{account.enabled ? 'Active' : 'Deactivated'}</span></td>
              <td>{account.createdAt ? new Date(account.createdAt).toLocaleDateString() : '—'}</td>
              <td><div className="page-header-actions">
                <button className="button secondary report-button" disabled={busyId === account.id} onClick={() => void resetPassword(account)}><KeyRound size={14}/> Reset password</button>
                <button className={`button ${account.enabled ? 'danger' : 'primary'} report-button`} disabled={busyId === account.id} onClick={() => void toggleStatus(account)}>{account.enabled ? <UserRoundX size={14}/> : <UserRoundCheck size={14}/>} {account.enabled ? 'Deactivate' : 'Activate'}</button>
              </div></td>
            </tr>)}
            {!loading && rows.length === 0 && <tr><td colSpan={6} className="empty-cell">No {role.toLowerCase()} login accounts have been created yet.</td></tr>}
            {loading && <tr><td colSpan={6} className="empty-cell">Loading accounts…</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  </>
}
