import { NavLink } from 'react-router-dom'
import { Home, ClipboardList } from 'lucide-react'
import { cn } from '../../lib/cn'

export function BottomNav() {
  const items = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/visit', label: 'Visit', icon: ClipboardList, end: false },
  ]
  return (
    <nav className="border-t border-stone-200 bg-white/95 backdrop-blur shrink-0">
      <div className="grid grid-cols-2">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                isActive ? 'text-primary-600' : 'text-stone-500 hover:text-stone-700',
              )
            }
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
