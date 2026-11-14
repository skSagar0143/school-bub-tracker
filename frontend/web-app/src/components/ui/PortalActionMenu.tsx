import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical } from 'lucide-react'

type PortalActionMenuProps = {
  label: string
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

export function PortalActionMenu({ label, open, onOpenChange, children }: PortalActionMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  function toggleMenu() {
    if (open) {
      onOpenChange(false)
      return
    }
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const estimatedMenuHeight = 150
    const top = rect.bottom + estimatedMenuHeight + 8 <= window.innerHeight
      ? rect.bottom + 6
      : Math.max(8, rect.top - estimatedMenuHeight - 6)
    setPosition({
      top,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 190)),
    })
    onOpenChange(true)
  }

  useEffect(() => {
    if (!open) return
    function handleOutsideClick(event: PointerEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      onOpenChange(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('pointerdown', handleOutsideClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onOpenChange])

  return <>
    <button
      ref={triggerRef}
      type="button"
      className="row-action-trigger"
      aria-label={label}
      aria-haspopup="true"
      aria-expanded={open}
      onClick={toggleMenu}
    >
      <MoreVertical size={18} />
    </button>
    {open && position && createPortal(
      <div
        ref={menuRef}
        className="row-action-dropdown"
        role="menu"
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          zIndex: 10000,
          maxHeight: 'min(60vh, 320px)',
          overflowY: 'auto',
        }}
      >
        {children}
      </div>,
      document.body
    )}
  </>
}
