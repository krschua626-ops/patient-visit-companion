import { SourcePill } from './SourcePill'
import { EscalationCard } from './EscalationCard'
import { cn } from '../lib/cn'
import type { ChatMessage } from '../lib/types'

interface ChatBubbleProps {
  message: ChatMessage
  coordinatorName: string
  coordinatorPhone: string
}

export function ChatBubble({ message, coordinatorName, coordinatorPhone }: ChatBubbleProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary-600 text-white px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[88%] space-y-2">
        <div
          className={cn(
            'rounded-2xl rounded-bl-sm bg-white border border-stone-200 px-3.5 py-2.5 text-sm leading-relaxed text-stone-800 whitespace-pre-wrap',
            message.isPending && 'text-stone-400',
            message.isError && 'border-red-200 bg-red-50 text-red-700',
          )}
        >
          {message.isPending ? (
            <span className="inline-flex gap-1">
              <Dot delay={0} />
              <Dot delay={150} />
              <Dot delay={300} />
            </span>
          ) : (
            message.content
          )}
        </div>

        {!message.isPending && message.grounding_sources && message.grounding_sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.grounding_sources.map((s, i) => (
              <SourcePill key={i} label={s} />
            ))}
          </div>
        )}

        {!message.isPending && message.escalation_recommended && (
          <EscalationCard
            summary={message.escalation_summary}
            coordinatorName={coordinatorName}
            coordinatorPhone={coordinatorPhone}
          />
        )}
      </div>
    </div>
  )
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-stone-400 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    />
  )
}
