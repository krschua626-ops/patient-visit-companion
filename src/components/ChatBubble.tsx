import { CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react'
import { SourcePill } from './SourcePill'
import { EscalationCard } from './EscalationCard'
import { MessageContent } from './MessageContent'
import { HighlightChips } from './HighlightChips'
import { SuggestedActions } from './SuggestedActions'
import { ReminderConfirmCard } from './ReminderConfirmCard'
import { cn } from '../lib/cn'
import type { ChatMessage } from '../lib/types'

interface ChatBubbleProps {
  message: ChatMessage
  coordinatorName: string
  coordinatorPhone: string
  onPrompt: (text: string) => void
}

const CONFIDENCE_LABEL: Record<'high' | 'medium' | 'low', string> = {
  high: 'High confidence',
  medium: 'Some uncertainty',
  low: 'Low confidence',
}

const CONFIDENCE_TONE: Record<'high' | 'medium' | 'low', string> = {
  high: 'text-green-700',
  medium: 'text-amber-700',
  low: 'text-stone-500',
}

export function ChatBubble({ message, coordinatorName, coordinatorPhone, onPrompt }: ChatBubbleProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary-600 text-white px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    )
  }

  const ConfidenceIcon =
    message.confidence === 'high'
      ? CheckCircle2
      : message.confidence === 'medium'
        ? AlertCircle
        : HelpCircle

  return (
    <div className="flex justify-start">
      <div className="max-w-[88%] space-y-2">
        <div
          className={cn(
            'rounded-2xl rounded-bl-sm bg-white border border-stone-200 px-3.5 py-3 text-sm leading-relaxed text-stone-800',
            message.isPending && 'text-stone-400 py-2.5',
            message.isError && 'border-red-200 bg-red-50 text-red-700 py-2.5',
          )}
        >
          {message.isPending ? (
            <span className="inline-flex gap-1">
              <Dot delay={0} />
              <Dot delay={150} />
              <Dot delay={300} />
            </span>
          ) : message.isError ? (
            <span className="whitespace-pre-wrap">{message.content}</span>
          ) : (
            <>
              {message.highlights && message.highlights.length > 0 && (
                <HighlightChips highlights={message.highlights} />
              )}
              <MessageContent text={message.content} />
            </>
          )}
        </div>

        {!message.isPending && !message.isError && message.created_reminders && message.created_reminders.length > 0 && (
          <ReminderConfirmCard reminders={message.created_reminders} />
        )}

        {!message.isPending && !message.isError && message.suggested_actions && message.suggested_actions.length > 0 && (
          <SuggestedActions actions={message.suggested_actions} onPrompt={onPrompt} />
        )}

        {!message.isPending && !message.isError && (
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {message.grounding_sources && message.grounding_sources.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                {message.grounding_sources.map((s, i) => (
                  <SourcePill key={i} label={s} />
                ))}
              </div>
            ) : (
              <span />
            )}
            {message.confidence && (
              <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium', CONFIDENCE_TONE[message.confidence])}>
                <ConfidenceIcon className="h-3 w-3" strokeWidth={2.5} />
                {CONFIDENCE_LABEL[message.confidence]}
              </span>
            )}
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
