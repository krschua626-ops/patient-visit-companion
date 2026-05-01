import { Outlet, Link, useLocation } from 'react-router-dom'
import { Activity, ArrowLeft } from 'lucide-react'
import { cn } from '../../lib/cn'

export function DemoLayout() {
  const { pathname } = useLocation()
  const onAudit = pathname.includes('audit-log')
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/demo" className="flex items-center gap-2 text-stone-900">
            <Activity className="h-5 w-5 text-primary-600" />
            <span className="font-semibold">Patient Visit Companion</span>
            <span className="text-stone-400 text-sm font-normal">— Demo Console</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/demo"
              className={cn(
                'px-3 py-1.5 rounded-lg transition-colors',
                !onAudit ? 'bg-stone-100 text-stone-900' : 'text-stone-500 hover:text-stone-800',
              )}
            >
              Scenarios
            </Link>
            <Link
              to="/demo/audit-log"
              className={cn(
                'px-3 py-1.5 rounded-lg transition-colors',
                onAudit ? 'bg-stone-100 text-stone-900' : 'text-stone-500 hover:text-stone-800',
              )}
            >
              Audit log
            </Link>
            <Link
              to="/"
              className="ml-2 px-3 py-1.5 rounded-lg text-stone-500 hover:text-stone-800 flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Patient app
            </Link>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
