import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Settings2 } from 'lucide-react'
import { useSession } from '../../state/sessionStore'
import { Badge } from '../ui/Badge'
import { TIME_OFFSET_LABELS } from '../../lib/types'

interface PageHeaderProps {
  title: string
  subtitle?: string
  trailing?: ReactNode
}

export function PageHeader({ title, subtitle, trailing }: PageHeaderProps) {
  const { patientId, timeOffset } = useSession()
  return (
    <div className="px-5 pt-6 pb-4 border-b border-stone-100 bg-white shrink-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="info" className="capitalize">{patientId}</Badge>
          <Badge variant="neutral">{TIME_OFFSET_LABELS[timeOffset]}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {trailing}
          <Link
            to="/demo"
            className="text-stone-400 hover:text-stone-600 transition-colors"
            aria-label="Demo console"
          >
            <Settings2 className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-stone-500 mt-1">{subtitle}</p>}
    </div>
  )
}
