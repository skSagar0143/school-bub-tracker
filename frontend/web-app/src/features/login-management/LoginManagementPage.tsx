import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../pages/LegacyPages'
import type { Student, SchoolDriver } from '../../pages/LegacyPages'
import { Copy, KeyRound, RefreshCw, Search, ShieldCheck, Users } from 'lucide-react'

type Credential = { recordId: number; fullName: string; code: string; role: 'STUDENT' | 'DRIVER'; loginId: string; temporaryPassword: string }

export function LoginManagementPage({ token, setError, setNotice }: { token: string; setError: (value: string) => void; setNotice: (value: string) => void }) {
  const [students, setStudents] = useState<Student[]>([])
  const [drivers, setDrivers] = useState<SchoolDriver[]>([])
  const [studentIds, setStudentIds] = useState<number[]>([])
  const [driverIds, setDriverIds] = useState<number[]>([])
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [studentRows, driverRows] = await Promise.all([api<Student[]>('/stu', token), api<SchoolDriver[]>('/driver', token)])
      setStudents(studentRows.filter(row => row.status === 'ACTIVE'))
      setDrivers(driverRows.filter(row => row.status === 'ACTIVE'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load students and drivers.')
    } finally { setLoading(false) }
  }, [token, setError])

  useEffect(() => { void load() }, [load])

  const filteredStudents = useMemo(() => students.filter(row => [row.firstName, row.lastName, row.rollNumber, row.className, row.section].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase())), [students, search])
  const filteredDrivers = useMemo(() => drivers.filter(row => [row.firstName, row.lastName, row.driverCode, row.phone].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase())), [drivers, search])

  function toggleId(id: number, selected: number[], update: (ids: number[]) => void) {
    update(selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id])
  }

  async function generate() {
    if (!studentIds.length && !driverIds.length) { setError('Select at least one student or driver.'); return }
    setBusy(true); setError('')
    try {
      const result = await api<Credential[]>('/user/login-accounts/generate', token, { method: 'POST', body: JSON.stringify({ studentIds, driverIds }) })
      setCredentials(result)
      setStudentIds([]); setDriverIds([])
      setNotice(`Generated ${result.length} login account(s). Copy and securely share the temporary passwords now.`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate login accounts.')
    } finally { setBusy(false) }
  }

  function copyCredentials(rows: Credential[]) {
    const text = ['Name,Role,Code,Login ID,Temporary Password', ...rows.map(row => [row.fullName, row.role, row.code, row.loginId, row.temporaryPassword].join(','))].join('\n')
    void navigator.clipboard.writeText(text).then(() => setNotice('Credentials copied. Share them securely with the respective users.')).catch(() => setError('Clipboard access was blocked by your browser.'))
  }

  return <>
    <div className="page-intro">
      <div><h2>Login account management</h2><p>Create Login IDs and temporary six-digit passwords for active students and drivers.</p></div>
      <button className="button secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={14}/> Refresh</button>
    </div>
    <section className="login-info-strip"><ShieldCheck size={19}/><div><strong>School Admin access</strong><span>Student Login ID = student name + roll number. Driver Login ID = driver name + driver code. Passwords are generated securely and shown only in this result.</span></div></section>
    <section className="panel login-management-panel">
      <div className="login-management-toolbar">
        <label className="login-search"><Search size={16}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, roll number, class or driver code"/></label>
        <div className="login-selection-count"><Users size={15}/>{studentIds.length + driverIds.length} selected</div>
      </div>
      {loading ? <div className="loading">Loading active students and drivers…</div> : <div className="login-selection-grid">
        <section className="login-select-list">
          <div className="login-list-heading"><div><span className="section-kicker">STUDENT ACCOUNTS</span><h3>Students <small>{filteredStudents.length}</small></h3></div><button type="button" className="text-action" onClick={() => setStudentIds(filteredStudents.map(row => row.id))}>Select shown</button></div>
          {filteredStudents.length ? filteredStudents.map(row => <label className="login-select-row" key={row.id}><input type="checkbox" checked={studentIds.includes(row.id)} onChange={() => toggleId(row.id, studentIds, setStudentIds)}/><span><strong>{row.firstName} {row.lastName || ''}</strong><small>Roll {row.rollNumber || '—'} · {row.className}{row.section ? ` - ${row.section}` : ''}</small></span></label>) : <p className="login-empty">No active students match this search.</p>}
        </section>
        <section className="login-select-list">
          <div className="login-list-heading"><div><span className="section-kicker">DRIVER ACCOUNTS</span><h3>Drivers <small>{filteredDrivers.length}</small></h3></div><button type="button" className="text-action" onClick={() => setDriverIds(filteredDrivers.map(row => row.id))}>Select shown</button></div>
          {filteredDrivers.length ? filteredDrivers.map(row => <label className="login-select-row" key={row.id}><input type="checkbox" checked={driverIds.includes(row.id)} onChange={() => toggleId(row.id, driverIds, setDriverIds)}/><span><strong>{row.firstName} {row.lastName}</strong><small>Code {row.driverCode} · {row.phone}</small></span></label>) : <p className="login-empty">No active drivers match this search.</p>}
        </section>
      </div>}
      <div className="login-generate-footer"><span>Accounts already linked to a login cannot be generated again.</span><button className="button primary" disabled={busy || loading || (!studentIds.length && !driverIds.length)} onClick={() => void generate()}><KeyRound size={15}/>{busy ? 'Generating…' : `Generate ${studentIds.length + driverIds.length} account(s)`}</button></div>
    </section>
    {credentials.length > 0 && <section className="panel login-credentials-panel">
      <div className="panel-heading"><div><span className="section-kicker">GENERATED JUST NOW</span><h3>Login credentials</h3><p className="student-subtext">Temporary passwords are displayed once. Copy them before leaving this page.</p></div><button className="button secondary" onClick={() => copyCredentials(credentials)}><Copy size={14}/> Copy all</button></div>
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Role</th><th>Code</th><th>Login ID</th><th>Temporary password</th><th></th></tr></thead><tbody>{credentials.map((row, index) => <tr key={`${row.role}-${row.recordId}-${index}`}><td><strong>{row.fullName}</strong></td><td>{row.role}</td><td>{row.code}</td><td><code>{row.loginId}</code></td><td><code className="temporary-password">{row.temporaryPassword}</code></td><td><button className="icon-action" title="Copy this account" onClick={() => copyCredentials([row])}><Copy size={14}/></button></td></tr>)}</tbody></table></div>
    </section>}
  </>
}
