import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '../lib/cn'
import type { SymptomEntry, SymptomSeverity } from '../lib/types'

const SEVERITY_TO_SCORE: Record<SymptomSeverity, number> = {
  none: 0,
  good: 0,
  mild: 1,
  fair: 1,
  moderate: 2,
  poor: 2,
  severe: 3,
}

const SEVERITY_DOT_COLOR: Record<0 | 1 | 2 | 3, string> = {
  0: 'bg-green-500',
  1: 'bg-yellow-400',
  2: 'bg-orange-500',
  3: 'bg-red-500',
}

const SEVERITY_LABEL: Record<SymptomSeverity, string> = {
  none: 'None',
  good: 'Good',
  mild: 'Mild',
  fair: 'Fair',
  moderate: 'Moderate',
  poor: 'Poor',
  severe: 'Severe',
}

const SEVERITY_TEXT: Record<0 | 1 | 2 | 3, string> = {
  0: 'text-green-700',
  1: 'text-amber-700',
  2: 'text-orange-700',
  3: 'text-red-700',
}

interface SymptomRowProps {
  symptom: SymptomEntry & { name: string; scale?: 'severity_4' | 'severity_4_inverse' }
  inverse?: boolean
}

export function SymptomRow({ symptom, inverse }: SymptomRowProps) {
  const isInverse = inverse ?? symptom.scale === 'severity_4_inverse'
  const score = SEVERITY_TO_SCORE[symptom.current_severity] as 0 | 1 | 2 | 3
  const textColor = SEVERITY_TEXT[score]
  const label = SEVERITY_LABEL[symptom.current_severity]

  const TrendIcon =
    symptom.trend === 'improving'
      ? isInverse
        ? TrendingUp
        : TrendingDown
      : symptom.trend === 'worsening'
        ? isInverse
          ? TrendingDown
          : TrendingUp
        : Minus

  const trendLabel =
    symptom.trend === 'improving'
      ? 'Improving'
      : symptom.trend === 'worsening'
        ? 'Worsening'
        : 'Steady'
  const trendTone =
    symptom.trend === 'improving'
      ? 'text-green-700'
      : symptom.trend === 'worsening'
        ? 'text-red-700'
        : 'text-stone-500'

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-sm font-medium text-stone-900 truncate">{symptom.name}</p>
          <span className={cn('text-xs font-medium', textColor)}>{label}</span>
        </div>
        <Sparkline values={symptom.last_seven_days} inverse={isInverse} />
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <TrendIcon className={cn('h-3.5 w-3.5', trendTone)} strokeWidth={2.5} />
        <span className={cn('text-[11px] font-medium', trendTone)}>{trendLabel}</span>
      </div>
    </div>
  )
}

interface SymptomEntry7 {
  values: SymptomSeverity[]
  inverse: boolean
}

function Sparkline({ values, inverse }: SymptomEntry7) {
  return (
    <div className="flex items-end gap-1 h-5">
      {values.map((v, i) => {
        const score = SEVERITY_TO_SCORE[v] as 0 | 1 | 2 | 3
        const displayScore = inverse ? (3 - score) as 0 | 1 | 2 | 3 : score
        const dotColor = SEVERITY_DOT_COLOR[displayScore]
        const heightPct = 25 + score * 25
        return (
          <div key={i} className="flex-1 flex items-end h-full">
            <div className={cn('w-full rounded-sm', dotColor)} style={{ height: `${heightPct}%` }} />
          </div>
        )
      })}
    </div>
  )
}
