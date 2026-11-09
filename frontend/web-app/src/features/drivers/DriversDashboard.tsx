import { useEffect, useState } from 'react'
import type { Driver } from '../../pages/LegacyPages'

export function DriversDashboard({ token }: { token: string }) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  useEffect(() => { api<Driver[]>('/user', token).then(data => setDrivers(data.filter(user => user.role === 'DRIVER'))).catch(() => setDrivers([])) }, [token])
  const active = drivers.filter(driver => driver.enabled).length
  return <><div className="page-intro"><div><h2>Drivers overview</h2><p>Current driver accounts registered for this school.</p></div><span className="status-pill active">LIVE DATA</span></div>
    <div className="stats-grid"><div className="stat-card"><span>TOTAL DRIVERS</span><strong>{drivers.length}</strong><small>Registered driver accounts</small></div><div className="stat-card"><span>ACTIVE DRIVERS</span><strong>{active}</strong><small>Enabled accounts</small></div><div className="stat-card"><span>INACTIVE DRIVERS</span><strong>{drivers.length - active}</strong><small>Disabled accounts</small></div></div>
    <section className="panel"><div className="panel-heading"><div><span className="section-kicker">SCHOOL DRIVERS</span><h3>Driver account summary</h3></div></div><div className="table-wrap"><table><thead><tr><th>Driver</th><th>Email</th><th>Status</th></tr></thead><tbody>{drivers.slice(0, 8).map(driver => <tr key={driver.id}><td>{driver.fullName}</td><td>{driver.email}</td><td><span className={`status-pill ${driver.enabled ? 'active' : 'inactive'}`}>{driver.enabled ? 'ACTIVE' : 'INACTIVE'}</span></td></tr>)}{drivers.length === 0 && <tr><td colSpan={3} className="empty-cell">No driver accounts have been added yet.</td></tr>}</tbody></table></div></section>
  </>
}
