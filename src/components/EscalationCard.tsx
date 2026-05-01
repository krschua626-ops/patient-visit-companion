import { useState } from 'react'
import { Phone, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react'

interface EscalationCardProps {
  summary: string | undefined
  coordinatorName: string
  coordinatorPhone: string
}

export function EscalationCard({ summary, coordinatorName, coordinatorPhone }: EscalationCardProps) {
  const [showSummary, setShowSummary] = useState(false)
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 mt-3">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <ShieldAlert className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-900">Let's loop in your study team</p>
          <p className="text-xs text-stone-600 mt-0.5">
            {coordinatorName} can answer this best.
          </p>
        </div>
      </div>

      <a
        href={`tel:${coordinatorPhone}`}
        className="mt-3 flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-700 text-white text-sm font-medium transition-colors"
      >
        <Phone className="h-4 w-4" strokeWidth={2.5} />
        Call {coordinatorPhone}
      </a>

      {summary && (
        <>
          <button
            onClick={() => setShowSummary((s) => !s)}
            className="mt-3 flex items-center gap-1 text-xs font-medium text-amber-800 hover:text-amber-900"
          >
            {showSummary ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showSummary ? 'Hide' : 'Preview'} what your coordinator will see
          </button>
          {showSummary && (
            <div className="mt-2 rounded-lg bg-white border border-amber-200 p-3 text-xs text-stone-700 leading-relaxed">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mb-1">
                Handoff summary
              </p>
              {summary}
            </div>
          )}
        </>
      )}
    </div>
  )
}
