import { useEffect, useState } from 'react'
import { X, Check } from 'lucide-react'
import { Button } from './ui/Button'
import { completeEpro } from '../lib/api'
import { cn } from '../lib/cn'
import type { NextEproActivity } from '../lib/types'

interface EproSheetProps {
  open: boolean
  patientId: string
  activity: NextEproActivity | null
  onClose: () => void
  onCompleted: () => void
}

const ENTER_DURATION = 280
const EXIT_DURATION = 220

const SAMPLE_QUESTIONS: Record<string, Array<{ q: string; options: string[] }>> = {
  daily_symptom_diary: [
    { q: 'Overall, how would you rate your fatigue today?', options: ['None', 'Mild', 'Moderate', 'Severe'] },
    { q: 'Any nausea today?', options: ['None', 'Mild', 'Moderate', 'Severe'] },
    { q: 'How was your sleep last night?', options: ['Good', 'Fair', 'Poor'] },
  ],
  weekly_wellbeing: [
    { q: 'Have you been bothered by feeling tired or having little energy?', options: ['Not at all', 'A little', 'Quite a bit', 'Very much'] },
    { q: 'Have you had trouble doing your usual daily activities?', options: ['Not at all', 'A little', 'Quite a bit', 'Very much'] },
    { q: 'How would you rate your overall wellbeing this week?', options: ['Poor', 'Fair', 'Good', 'Excellent'] },
  ],
  pre_visit_check: [
    { q: 'Do you have any new symptoms you want the team to know about?', options: ['No', 'Yes — minor', 'Yes — significant'] },
    { q: 'Did you take all your medications as scheduled this week?', options: ['Yes', 'Mostly', 'Missed some doses'] },
    { q: 'Do you have any questions for the study team today?', options: ['No', 'Yes'] },
  ],
}

export function EproSheet({ open, patientId, activity, onClose, onCompleted }: EproSheetProps) {
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      setClosing(false)
      setAnswers({})
      setSubmitted(false)
    }
  }, [open, activity?.assessment.id])

  useEffect(() => {
    if (!open && mounted && !closing) {
      setClosing(true)
      const t = window.setTimeout(() => {
        setMounted(false)
        setClosing(false)
      }, EXIT_DURATION)
      return () => window.clearTimeout(t)
    }
    return undefined
  }, [open, mounted, closing])

  if (!mounted || !activity) return null

  const questions = SAMPLE_QUESTIONS[activity.assessment.id] ?? []
  const allAnswered = questions.every((_, i) => answers[i])

  function requestClose() {
    if (closing) return
    onClose()
  }

  async function submit() {
    setSubmitting(true)
    try {
      await completeEpro(patientId, activity!.assessment.id)
      setSubmitted(true)
      window.setTimeout(() => {
        onCompleted()
      }, 1100)
    } finally {
      setSubmitting(false)
    }
  }

  const backdropAnim = closing
    ? `fade-out ${EXIT_DURATION}ms ease-in forwards`
    : `fade-in ${ENTER_DURATION}ms ease-out forwards`
  const sheetAnim = closing
    ? `slide-down ${EXIT_DURATION}ms cubic-bezier(0.4, 0, 1, 1) forwards`
    : `slide-up ${ENTER_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`

  return (
    <div
      className="absolute inset-0 z-30 flex items-end justify-center bg-stone-900/40 backdrop-blur-sm"
      style={{ animation: backdropAnim }}
      onClick={requestClose}
    >
      <div
        className="w-full bg-white rounded-t-3xl border-t border-stone-200 max-h-[92%] overflow-y-auto shadow-xl will-change-transform"
        style={{ animation: sheetAnim }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-stone-300" />
        </div>

        {submitted ? (
          <div className="px-6 py-12 text-center">
            <div className="h-14 w-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-4">
              <Check className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-semibold text-stone-900 mb-1">Thanks, all set</h2>
            <p className="text-sm text-stone-600">
              Your responses have been sent to your study team.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 pt-2 pb-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-700">
                  {activity.assessment.instrument}
                </p>
                <h2 className="text-lg font-semibold text-stone-900 mt-0.5">
                  {activity.assessment.name}
                </h2>
              </div>
              <button
                onClick={requestClose}
                aria-label="Close"
                className="h-8 w-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="px-5 text-xs text-stone-500 mb-4">
              {activity.assessment.description} About {activity.assessment.estimated_minutes} minutes.
            </p>

            <div className="px-5 space-y-5 pb-3">
              {questions.map((qa, idx) => (
                <div key={idx}>
                  <p className="text-sm font-medium text-stone-900 mb-2">
                    <span className="text-stone-400 mr-1">{idx + 1}.</span>
                    {qa.q}
                  </p>
                  <div className="space-y-2">
                    {qa.options.map((opt) => {
                      const active = answers[idx] === opt
                      return (
                        <button
                          key={opt}
                          onClick={() => setAnswers((prev) => ({ ...prev, [idx]: opt }))}
                          className={cn(
                            'w-full text-left rounded-xl border px-3.5 py-2.5 text-sm transition-colors',
                            active
                              ? 'border-primary-500 bg-primary-50/50 text-stone-900'
                              : 'border-stone-200 text-stone-700 hover:border-stone-300',
                          )}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 pb-5 pt-2 sticky bottom-0 bg-white border-t border-stone-100">
              <Button
                onClick={submit}
                size="lg"
                className="w-full"
                disabled={!allAnswered || submitting}
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </Button>
              <p className="text-[11px] text-stone-500 mt-2 text-center">
                Demo: 3 sample questions stand in for the full instrument.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
