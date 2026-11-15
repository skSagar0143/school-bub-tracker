import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../../pages/LegacyPages'
import type { SchoolDriver } from '../../pages/LegacyPages'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Crosshair,
  Gauge,
  MapPin,
  Navigation,
  Play,
  Radio,
  Square,
} from 'lucide-react'

type GPSPosition = {
  latitude: number
  longitude: number
  accuracy: number
  speed: number | null
  heading: number | null
}

export function DriversDashboard({
  token,
  setError,
}: {
  token: string
  setError: (value: string) => void
}) {
  const [driver, setDriver] = useState<SchoolDriver | null>(null)
  const [loading, setLoading] = useState(true)
  const [tripId, setTripId] = useState('')
  const [sharing, setSharing] = useState(false)
  const [position, setPosition] = useState<GPSPosition | null>(null)
  const [gpsError, setGpsError] = useState('')
  const [lastSentAt, setLastSentAt] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const watchIdRef = useRef<number | null>(null)
  const intervalIdRef = useRef<number | null>(null)
  const latestPositionRef = useRef<GeolocationPosition | null>(null)
  const sharingRef = useRef(false)
  const sendingRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    api<SchoolDriver>('/driver/me', token)
      .then(data => {
        if (!cancelled) setDriver(data)
      })
      .catch(error => {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : 'Unable to load your driver profile.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, setError])

  const stopSharing = useCallback(() => {
    sharingRef.current = false

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    if (intervalIdRef.current !== null) {
      window.clearInterval(intervalIdRef.current)
      intervalIdRef.current = null
    }

    latestPositionRef.current = null
    sendingRef.current = false
    setSharing(false)
    setSending(false)
  }, [])

  const sendPosition = useCallback(async (gpsPosition: GeolocationPosition, selectedTripId: number) => {
    if (!sharingRef.current || sendingRef.current) return

    sendingRef.current = true
    setSending(true)

    try {
      await api<void>('/api/driver/location', token, {
        method: 'POST',
        body: JSON.stringify({
          tripId: selectedTripId,
          latitude: gpsPosition.coords.latitude,
          longitude: gpsPosition.coords.longitude,
          accuracy: gpsPosition.coords.accuracy,
          speed: gpsPosition.coords.speed,
          heading: gpsPosition.coords.heading,
        }),
      })

      if (sharingRef.current) {
        setLastSentAt(new Date().toLocaleTimeString())
        setGpsError('')
      }
    } catch (error) {
      if (sharingRef.current) {
        setGpsError(error instanceof Error ? error.message : 'Unable to send your GPS location.')
      }
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }, [token])

  const startSharing = useCallback(() => {
    setGpsError('')

    const selectedTripId = Number(tripId)
    if (!Number.isSafeInteger(selectedTripId) || selectedTripId <= 0) {
      setGpsError('Enter a valid active trip ID before starting GPS sharing.')
      return
    }

    if (!navigator.geolocation) {
      setGpsError('This browser does not support GPS location.')
      return
    }

    if (!window.isSecureContext) {
      setGpsError('GPS requires HTTPS or localhost. Open the application using a secure connection.')
      return
    }

    sharingRef.current = true
    setSharing(true)
    setLastSentAt(null)

    watchIdRef.current = navigator.geolocation.watchPosition(
      gpsPosition => {
        if (!sharingRef.current) return

        latestPositionRef.current = gpsPosition
        setPosition({
          latitude: gpsPosition.coords.latitude,
          longitude: gpsPosition.coords.longitude,
          accuracy: gpsPosition.coords.accuracy,
          speed: gpsPosition.coords.speed,
          heading: gpsPosition.coords.heading,
        })

        // Send the first fix immediately; subsequent fixes are throttled to 5 seconds.
        if (intervalIdRef.current === null) {
          void sendPosition(gpsPosition, selectedTripId)
          intervalIdRef.current = window.setInterval(() => {
            const latest = latestPositionRef.current
            if (latest) void sendPosition(latest, selectedTripId)
          }, 5000)
        }
      },
      gpsFailure => {
        const messages: Record<number, string> = {
          1: 'Location permission was denied. Allow location access in your browser settings.',
          2: 'Your current location is unavailable. Check your device GPS and try again.',
          3: 'The GPS request timed out. Please try again.',
        }
        setGpsError(messages[gpsFailure.code] || 'Unable to read your current location.')
        stopSharing()
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 20000,
      },
    )
  }, [tripId, sendPosition, stopSharing])

  useEffect(() => {
    return () => stopSharing()
  }, [stopSharing])

  const formatCoordinate = (value: number | undefined) =>
    value === undefined ? '—' : value.toFixed(6)

  return <>
    <div className="page-intro">
      <div>
        <h2>My Driver Dashboard</h2>
        <p>Manage your driver profile and share your live bus location.</p>
      </div>
      <span className={`status-pill ${driver?.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
        {loading ? 'LOADING' : driver?.status || 'UNAVAILABLE'}
      </span>
    </div>

    <div className="stats-grid">
      <div className="stat-card">
        <span>DRIVER CODE</span>
        <strong>{driver?.driverCode || '—'}</strong>
        <small>Your registered driver ID</small>
      </div>
      <div className="stat-card">
        <span>ACCOUNT STATUS</span>
        <strong>{driver?.status || (loading ? 'Loading' : '—')}</strong>
        <small>Your current driver profile status</small>
      </div>
      <div className="stat-card">
        <span>SCHOOL ID</span>
        <strong>{driver?.schoolId ?? '—'}</strong>
        <small>Your assigned school</small>
      </div>
    </div>

    <section className="panel driver-live-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">LIVE BUS TRACKING</span>
          <h3>Share GPS location</h3>
        </div>
        <span className={`status-pill ${sharing ? 'active' : 'inactive'}`}>
          {sharing ? 'SHARING' : 'STOPPED'}
        </span>
      </div>

      <div className="driver-live-body">
        <div className="driver-live-intro">
          <Radio size={21} />
          <div>
            <strong>Driver location sharing</strong>
            <p>Keep this page open during the trip. Your latest GPS coordinates will be sent to the server every 5 seconds.</p>
          </div>
        </div>

        <label className="driver-trip-field">
          <span>Active trip ID</span>
          <input
            type="number"
            min="1"
            step="1"
            value={tripId}
            onChange={event => setTripId(event.target.value)}
            placeholder="Enter the trip ID assigned to you"
            disabled={sharing}
          />
        </label>

        <div className="driver-live-actions">
          {!sharing ? (
            <button
              type="button"
              className="button primary"
              onClick={startSharing}
              disabled={loading || driver?.status !== 'ACTIVE'}
            >
              <Play size={15} /> Start GPS sharing
            </button>
          ) : (
            <button type="button" className="button danger" onClick={stopSharing}>
              <Square size={15} /> Stop GPS sharing
            </button>
          )}
          <span>{sharing ? 'GPS watcher is active' : 'Location sharing is stopped'}</span>
        </div>

        {gpsError && (
          <div className="driver-live-alert error">
            <AlertCircle size={17} />
            <span>{gpsError}</span>
          </div>
        )}

        {sharing && !gpsError && (
          <div className="driver-live-alert success">
            <CheckCircle2 size={17} />
            <span>{sending ? 'Sending location to server…' : 'GPS tracking is active.'}</span>
          </div>
        )}

        <div className="driver-live-metrics">
          <div><MapPin /><span>Latitude</span><strong>{formatCoordinate(position?.latitude)}</strong></div>
          <div><Navigation /><span>Longitude</span><strong>{formatCoordinate(position?.longitude)}</strong></div>
          <div><Crosshair /><span>GPS accuracy</span><strong>{position ? `${position.accuracy.toFixed(1)} m` : '—'}</strong></div>
          <div><Gauge /><span>Speed</span><strong>{position?.speed == null ? '—' : `${(position.speed * 3.6).toFixed(1)} km/h`}</strong></div>
          <div><Navigation /><span>Heading</span><strong>{position?.heading == null ? '—' : `${position.heading.toFixed(0)}°`}</strong></div>
          <div><Clock3 /><span>Last API update</span><strong>{lastSentAt || 'Not sent yet'}</strong></div>
        </div>

        <p className="driver-live-note">
          <AlertCircle size={15} />
          Browser GPS may pause when the phone is locked or the browser is in the background. This version is intended for foreground testing.
        </p>
      </div>
    </section>

    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">MY PROFILE</span>
          <h3>{driver ? `${driver.firstName} ${driver.lastName}` : 'Driver profile'}</h3>
        </div>
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
      ) : (
        <div className="empty-cell">Your driver profile could not be loaded. Please contact your school administrator.</div>
      )}
    </section>
  </>
}
