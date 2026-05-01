import { Clock, ChevronRight, Flame, ClipboardList, AlertCircle } from 'lucide-react'
import { Card, CardBody } from './ui/Card'
import { Badge } from './ui/Badge'
import { cn } from '../lib/cn'
import type { NextEproActivity } from '../lib/types'

interface EproCardProps {
  activity: NextEproActivity
  onTap: () => void
  variant?: 'primary' | 'secondary'
}

const STATUS_BADGE: Record<NextEproActivity['status'], { label: string; tone: 'attention' | 'pending' | 'info' | 'ready' }> = {
  overdue: { label: 'Due now', tone: 'attention' },
  due_now: { label: 'Due now', tone: 'pending' },
  due_soon: { label: 'Due soon', tone: 'pending' },
  on_track: { label: 'On track', tone: 'ready' },
}

export function EproCard({ activity, onTap, variant = 'primary' }: EproCardProps) {
  const isPrimary = variant === 'primary'
  const status = STATUS_BADGE[activity.status]
  const isUrgent = activity.status === 'overdue' || activity.status === 'due_now'
  const isCompleted = activity.cta_label === 'View summary'

  return (
    <Card
      className={cn(
        'overflow-hidden transition-shadow hover:shadow-md',
        isPrimary ? '' : 'shadow-none',
      )}
    >
      <button onClick={onTap} className="w-full text-left">
        {isPrimary && (
          <div
            className={cn(
              'border-b px-5 py-4',
              isCompleted
                ? 'bg-green-50/60 border-green-100'
                : isUrgent
                  ? 'bg-amber-50/60 border-amber-100'
                  : 'bg-gradient-to-br from-primary-50 via-white to-stone-50 border-stone-100',
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
                  isCompleted
                    ? 'bg-white border border-green-200 text-green-700'
                    : isUrgent
                      ? 'bg-white border border-amber-200 text-amber-700'
                      : 'bg-white border border-stone-200 text-primary-600',
                )}
              >
                {isUrgent ? (
                  <AlertCircle className="h-4 w-4" strokeWidth={2} />
                ) : (
                  <ClipboardList className="h-4 w-4" strokeWidth={2} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-stone-900">{activity.assessment.name}</p>
                  <Badge variant={status.tone} className="text-[10px]">
                    {status.label}
                  </Badge>
                </div>
                <p className="text-xs text-stone-600 mt-0.5">{activity.due_label}</p>
              </div>
            </div>
          </div>
        )}
        <CardBody className={cn('py-3.5', !isPrimary && 'py-3')}>
          {isPrimary ? (
            <>
              <p className="text-xs text-stone-600 leading-relaxed mb-3">
                {activity.assessment.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-stone-500 min-w-0">
                  <span className="flex items-center gap-1 shrink-0">
                    <Clock className="h-3 w-3" />
                    {activity.assessment.estimated_minutes} min
                  </span>
                  {activity.streak_days && activity.streak_days > 0 && (
                    <span className="flex items-center gap-1 text-amber-700 shrink-0">
                      <Flame className="h-3 w-3 fill-amber-500 text-amber-500" />
                      {activity.streak_days}-day streak
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-primary-700 shrink-0 ml-2">
                  <span>{activity.cta_label}</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
              {activity.last_completed_label && (
                <p className="text-[11px] text-stone-400 mt-2">{activity.last_completed_label}</p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate">
                  {activity.assessment.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                  <span className="flex items-center gap-1 shrink-0">
                    <Clock className="h-3 w-3" />
                    {activity.assessment.estimated_minutes} min
                  </span>
                  <span className="text-stone-300">·</span>
                  <span className="truncate">{activity.due_label}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-stone-300 shrink-0" />
            </div>
          )}
        </CardBody>
      </button>
    </Card>
  )
}
