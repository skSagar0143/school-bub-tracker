import { useCallback, useEffect, useState } from 'react'
import { KeyRound, MoreVertical, RefreshCw, UserRoundCheck, UserRoundX } from 'lucide-react'
import { api } from '../../pages/LegacyPages'

type Account = {
  id: string
  fullName: string
  loginId: string | null
  displayPassword: string | null
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
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openActionId, setOpenActionId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await api<Account[]>(`/user?role=${role}`, token))
      setSelectedIds([])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to load user accounts.')
    } finally { setLoading(false) }
  }, [role, token, setError])

  useEffect(() => { void load() }, [load])

  async function toggleStatus(account: Account) {
    setBusyId(account.id)
    try {
      await api<Account>(`/user/${account.id}/status`, token, {
        method: 'PATCH', body: JSON.stringify({ enabled: !account.enabled }),
      })
      setNotice(account.enabled ? 'Account deactivated.' : 'Account activated.')
      await load()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to update account status.')
    } finally { setBusyId(null); setOpenActionId(null) }
  }

  async function resetPassword(account: Account) {
    setBusyId(account.id)
    try {
      await api<ResetResult>(`/user/${account.id}/reset-password`, token, { method: 'POST' })
      setNotice('Password reset successfully. The new password is shown in the Password column.')
      await load()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to reset password.')
    } finally { setBusyId(null); setOpenActionId(null) }
  }

  const allSelected = rows.length > 0 && rows.every(row => selectedIds.includes(row.id))
  return <>
    <div className="page-intro">
      <div><h2>Users</h2><p>Manage student and driver login accounts.</p></div>
      <button className="button secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={14}/> Refresh</button>
    </div>
    <section className="panel">
      <div className="panel-heading">
        <div><span className="section-kicker">ACCOUNT DIRECTORY</span><h3>Login accounts <small className="count-label">{rows.length}</small></h3></div>
        <div className="table-header-tools">
          <select aria-label="Filter account role" value={role} onChange={event => setRole(event.target.value as 'STUDENT' | 'DRIVER')}>
            <option value="STUDENT">Students</option><option value="DRIVER">Drivers</option>
          </select>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr>
            <th className="select-column"><input type="checkbox" aria-label="Select all accounts" checked={allSelected} onChange={event => setSelectedIds(event.target.checked ? rows.map(row => row.id) : [])}/></th>
            <th className="row-actions-heading"></th><th>Name</th><th>Login ID</th><th>Password</th>
          </tr></thead>
          <tbody>
            {rows.map(account => <tr key={account.id}>
              <td className="select-column"><input type="checkbox" aria-label={`Select ${account.fullName}`} checked={selectedIds.includes(account.id)} onChange={event => setSelectedIds(current => event.target.checked ? [...current, account.id] : current.filter(id => id !== account.id))}/></td>
              <td className="row-actions-cell">
                <div className="row-action-menu">
                  <button type="button" className="row-action-trigger" aria-label={`Actions for ${account.fullName}`} aria-haspopup="true" aria-expanded={openActionId === account.id} onClick={() => setOpenActionId(current => current === account.id ? null : account.id)}><MoreVertical size={18}/></button>
                  {openActionId === account.id && <div className="row-action-dropdown" role="menu">
                    <button type="button" role="menuitem" disabled={busyId === account.id} onClick={() => void resetPassword(account)}><KeyRound size={14}/> Reset password</button>
                    <button type="button" role="menuitem" disabled={busyId === account.id} onClick={() => void toggleStatus(account)}>{account.enabled ? <UserRoundX size={14}/> : <UserRoundCheck size={14}/>} {account.enabled ? 'Deactivate' : 'Activate'}</button>
                  </div>}
                </div>
              </td>
              <td><strong>{account.fullName}</strong><div className="student-subtext">{account.enabled ? 'Active' : 'Deactivated'}</div></td>
              <td><code>{account.loginId || '—'}</code></td>
              <td><code>{account.displayPassword || '######'}</code></td>
            </tr>)}
            {!loading && rows.length === 0 && <tr><td colSpan={5} className="empty-cell">No {role.toLowerCase()} login accounts have been created yet.</td></tr>}
            {loading && <tr><td colSpan={5} className="empty-cell">Loading accounts…</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  </>
}
