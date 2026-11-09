import { useEffect, useState } from 'react'
import type { Menu } from '../../pages/LegacyPages'
import { iconFor } from '../../pages/LegacyPages'

export function MenuItem({ menu, currentPath, navigate }: { menu: Menu; currentPath: string; navigate: (path: string) => void }) {
  const hasChildren = menu.subMenus?.length > 0
  const selected = menu.path === currentPath || menu.subMenus?.some(child => child.path === currentPath)
  const [expanded, setExpanded] = useState(selected)
  useEffect(() => { if (selected) setExpanded(true) }, [selected])
  return <div className="menu-group">
    <button className={`nav-item ${selected ? 'active' : ''} ${hasChildren ? 'parent-menu' : ''}`}
      onClick={() => hasChildren ? setExpanded(value => !value) : menu.path && navigate(menu.path)}
      aria-expanded={hasChildren ? expanded : undefined}>
      <span className="menu-icon">{iconFor(menu.icon)}</span>{menu.name}{hasChildren && <span className="menu-chevron">{expanded ? '⌃' : '⌄'}</span>}
    </button>
    {hasChildren && expanded && <div className="submenu">{menu.subMenus.map(child => <button key={child.id} className={`submenu-item ${currentPath === child.path ? 'selected' : ''}`} onClick={() => child.path && navigate(child.path)}>{child.name}</button>)}</div>}
  </div>
}
