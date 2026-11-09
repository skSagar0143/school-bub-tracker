import { useEffect } from 'react'
import { CheckCircle2, CircleAlert, X } from 'lucide-react'

export type ToastMessage = {
  id: number
  type: 'success' | 'error'
  message: string
}

export function Toast({ toast, onClose }: { toast: ToastMessage | null; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(onClose, toast.type === 'error' ? 6000 : 4000)
    return () => window.clearTimeout(timeout)
  }, [toast, onClose])

  if (!toast) return null
  const isError = toast.type === 'error'
  const Icon = isError ? CircleAlert : CheckCircle2

  return (
    <div className={`app-toast ${isError ? 'app-toast-error' : 'app-toast-success'}`} role={isError ? 'alert' : 'status'} aria-live={isError ? 'assertive' : 'polite'}>
      <Icon size={20} aria-hidden="true" />
      <span>{toast.message}</span>
      <button type="button" className="app-toast-close" onClick={onClose} aria-label="Dismiss notification"><X size={17} /></button>
    </div>
  )
}
