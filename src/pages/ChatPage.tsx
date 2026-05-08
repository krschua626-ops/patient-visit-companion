import { useEffect, useMemo, useRef, useState } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ChatBubble } from '../components/ChatBubble'
import {
  appendMessage,
  setPendingPrompt,
  updateMessage,
  useSession,
} from '../state/sessionStore'
import { usePatientContext } from '../lib/usePatientContext'
import { postChat } from '../lib/api'
import type { ChatMessage, ChatTurn } from '../lib/types'

const DEFAULT_SUGGESTIONS = [
  'What should I bring?',
  'How long will it take?',
  'Can I have coffee tomorrow morning?',
]

const SUGGESTIONS_BY_OFFSET: Partial<Record<string, string[]>> = {
  morning_of: [
    'What do I do when I get there?',
    'Can I have my morning coffee?',
    "I'm a little nervous, what's going to happen?",
  ],
  days_minus_1: [
    "What should I bring tomorrow?",
    'When does my fast start?',
    'Can I take my regular medications?',
  ],
  days_minus_3: [
    "I'm nervous about this visit, what's going to happen?",
    'How long will I be at the clinic?',
    'What should I bring?',
  ],
  post_visit: [
    'What should I watch for tonight?',
    'When is my next visit?',
    'Can I drive after the infusion?',
  ],
}

export function ChatPage() {
  const session = useSession()
  const { patientId, visitId, timeOffset, messages, pendingPrompt } = session
  const { data } = usePatientContext(patientId, visitId, timeOffset)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const sendingRef = useRef(false)

  const suggestions = useMemo(
    () => SUGGESTIONS_BY_OFFSET[timeOffset] ?? DEFAULT_SUGGESTIONS,
    [timeOffset],
  )

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  async function send(text: string) {
    if (!text.trim() || sendingRef.current) return
    sendingRef.current = true
    setInput('')

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text.trim(),
    }
    const pendingMsg: ChatMessage = {
      id: `pending_${Date.now()}`,
      role: 'assistant',
      content: '',
      isPending: true,
    }
    appendMessage(userMsg)
    appendMessage(pendingMsg)

    const history: ChatTurn[] = messages
      .filter((m) => !m.isPending && !m.isError)
      .map((m) => ({ role: m.role, content: m.content }))

    try {
      const res = await postChat({
        patientId,
        visitId,
        timeOffset,
        message: text.trim(),
        history,
      })
      updateMessage(pendingMsg.id, {
        isPending: false,
        content: res.reply,
        confidence: res.confidence,
        escalation_recommended: res.escalation_recommended,
        escalation_summary: res.escalation_summary,
        grounding_sources: res.grounding_sources,
        suggested_actions: res.suggested_actions,
        highlights: res.highlights,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      updateMessage(pendingMsg.id, { isPending: false, isError: true, content: msg })
    } finally {
      sendingRef.current = false
    }
  }

  useEffect(() => {
    if (pendingPrompt) {
      void send(pendingPrompt)
      setPendingPrompt(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt])

  const showSuggestions = messages.length === 0 && !pendingPrompt

  return (
    <>
      <PageHeader
        title="Your assistant"
        subtitle={data ? `${data.visit.name} · ${data.timing.label}` : undefined}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {showSuggestions && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-gradient-to-br from-primary-50 to-stone-50 border border-primary-100 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-primary-600" />
                <span className="text-sm font-semibold text-stone-900">
                  Hi {data?.patient.first_name ?? ''} — how can I help?
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                I'm here to help you understand and prepare for your{' '}
                {data?.visit.name}. I'll always point you to your study team for medical
                questions.
              </p>
            </div>

            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide pt-2">
              Try asking
            </p>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full text-left rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-800 hover:border-primary-300 hover:bg-primary-50/40 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <ChatBubble
            key={m.id}
            message={m}
            coordinatorName={data?.study.coordinator_name ?? 'your study coordinator'}
            coordinatorPhone={data?.study.coordinator_phone ?? ''}
            onPrompt={(t) => void send(t)}
          />
        ))}
      </div>

      <div className="border-t border-stone-200 bg-white/95 backdrop-blur p-3 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void send(input)
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your visit…"
            className="flex-1 h-11 rounded-2xl border border-stone-300 bg-white px-4 text-sm placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:border-primary-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="h-11 w-11 rounded-full bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center disabled:opacity-40 disabled:bg-stone-300 transition-colors"
            aria-label="Send"
          >
            <Send className="h-[18px] w-[18px]" />
          </button>
        </form>
      </div>
    </>
  )
}
