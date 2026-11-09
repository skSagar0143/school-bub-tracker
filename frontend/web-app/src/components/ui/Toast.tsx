import { useEffect } from 'react'
import { CheckCircle2, CircleAlert, X } from 'lucide-react'

export type ToastMessage = {
  id: number
  type: 'success' | 'error'
  message: string
}

export function Toast({ toast, onClose }: { toast: ToastMessage | null; onClose: () => void }) {
  const duration = toast?.type === 'error' ? 6000 : 4000

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(onClose, duration)
    return () => window.clearTimeout(timeout)
  }, [toast, onClose, duration])

  if (!toast) return null
  const isError = toast.type === 'error'
  const Icon = isError ? CircleAlert : CheckCircle2

  return (
    <div
      key={toast.id}
      className={`app-toast ${isError ? 'app-toast-error' : 'app-toast-success'}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <div className="app-toast-content">
        <span className="app-toast-icon"><Icon size={19} aria-hidden="true" /></span>
        <span className="app-toast-message">{toast.message}</span>
        <button type="button" className="app-toast-close" onClick={onClose} aria-label="Dismiss notification"><X size={17} /></button>
      </div>
      <div className="app-toast-timer" aria-hidden="true">
        <span key={toast.id} style={{ animationDuration: `${duration}ms` }} />
      </div>
    </div>
  )
}
