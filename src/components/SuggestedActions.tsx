import { useNavigate } from 'react-router-dom'
import { ArrowRight, Phone, Send } from 'lucide-react'
import type { SuggestedAction } from '../lib/types'

interface SuggestedActionsProps {
  actions: SuggestedAction[]
  onPrompt: (text: string) => void
}

export function SuggestedActions({ actions, onPrompt }: SuggestedActionsProps) {
  const navigate = useNavigate()
  if (!actions.length) return null

  function handle(action: SuggestedAction) {
    if (action.kind === 'prompt') onPrompt(action.value)
    else if (action.kind === 'link') navigate(action.value)
    else if (action.kind === 'tel') window.location.href = `tel:${action.value}`
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {actions.map((a, i) => {
        const Icon = a.kind === 'tel' ? Phone : a.kind === 'link' ? ArrowRight : Send
        return (
          <button
            key={i}
            onClick={() => handle(a)}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-primary-300 hover:bg-primary-50/40 hover:text-primary-700 transition-colors"
          >
            <Icon className="h-3 w-3" strokeWidth={2.5} />
            {a.label}
          </button>
        )
      })}
    </div>
  )
}
