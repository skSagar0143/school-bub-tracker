import { useEffect, useState } from 'react'
import { api } from '../../pages/LegacyPages'
import type { SchoolDriver } from '../../pages/LegacyPages'

export function DriversDashboard({ token, setError }: { token: string; setError: (value: string) => void }) {
  const [driver, setDriver] = useState<SchoolDriver | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api<SchoolDriver>('/driver/me', token)
      .then(data => {
        if (!cancelled) setDriver(data)
      })
      .catch(error => {
        if (!cancelled) setError(error instanceof Error ? error.message : 'Unable to load your driver profile.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [token, setError])

  return <>
    <div className="page-intro">
      <div>
        <h2>My Driver Dashboard</h2>
        <p>Your driver account and profile information.</p>
      </div>
      <span className={`status-pill ${driver?.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
        {loading ? 'LOADING' : driver?.status || 'UNAVAILABLE'}
      </span>
    </div>

    <div className="stats-grid">
      <div className="stat-card"><span>DRIVER CODE</span><strong>{driver?.driverCode || '—'}</strong><small>Your registered driver ID</small></div>
      <div className="stat-card"><span>ACCOUNT STATUS</span><strong>{driver?.status || (loading ? 'Loading' : '—')}</strong><small>Your current driver profile status</small></div>
      <div className="stat-card"><span>SCHOOL ID</span><strong>{driver?.schoolId ?? '—'}</strong><small>Your assigned school</small></div>
    </div>

    <section className="panel">
      <div className="panel-heading">
        <div><span className="section-kicker">MY PROFILE</span><h3>{driver ? `${driver.firstName} ${driver.lastName}` : 'Driver profile'}</h3></div>
      </div>
      {loading ? <div className="empty-cell">Loading your profile…</div> : driver ? (
        <div className="details-grid">
          <div className="detail"><span>Driver code</span><strong>{driver.driverCode}</strong></div>
          <div className="detail"><span>Phone</span><strong>{driver.phone || 'Not provided'}</strong></div>
          <div className="detail"><span>Email</span><strong>{driver.email || 'Not provided'}</strong></div>
          <div className="detail"><span>License number</span><strong>{driver.licenseNumber || 'Not provided'}</strong></div>
          <div className="detail"><span>License type</span><strong>{driver.licenseType || 'Not provided'}</strong></div>
          <div className="detail"><span>License expiry</span><strong>{driver.licenseExpiryDate || 'Not provided'}</strong></div>
        </div>
      ) : <div className="empty-cell">Your driver profile could not be loaded. Please contact your school administrator.</div>}
    </section>
  </>
}
