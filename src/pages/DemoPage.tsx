import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RotateCcw,
  ScrollText,
  Smartphone,
  Play,
  Languages,
  ShieldAlert,
  HelpCircle,
  Coffee,
  Pill,
  Sparkles,
} from 'lucide-react'
import { Card, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { fetchPatients, resetServer } from '../lib/api'
import {
  resetSession,
  setSession,
  useSession,
} from '../state/sessionStore'
import { TIME_OFFSET_LABELS, type Patient, type TimeOffset } from '../lib/types'
import { SCENARIOS, type Scenario } from '../lib/scenarios'
import { cn } from '../lib/cn'

const SCENARIO_ICONS: Record<string, typeof Sparkles> = {
  anxious_first_timer: Sparkles,
  fasting_confusion: Coffee,
  med_question_escalation: Pill,
  symptom_hard_escalation: ShieldAlert,
  multilingual: Languages,
  out_of_scope: HelpCircle,
}

const TIME_OFFSETS: TimeOffset[] = [
  'days_minus_3',
  'days_minus_1',
  'morning_of',
  'post_visit',
  'days_plus_3',
]

export function DemoPage() {
  const navigate = useNavigate()
  const session = useSession()
  const [patients, setPatients] = useState<Patient[]>([])
  const [resetMsg, setResetMsg] = useState<string | null>(null)

  useEffect(() => {
    fetchPatients().then(setPatients).catch(() => undefined)
  }, [])

  function runScenario(s: Scenario) {
    setSession({
      patientId: s.patientId,
      visitId: s.visitId,
      timeOffset: s.timeOffset,
      checklist: {},
      messages: [],
      pendingPrompt: s.prompt,
    })
    navigate('/chat')
  }

  async function onReset() {
    await resetServer()
    resetSession()
    setResetMsg('All state cleared.')
    setTimeout(() => setResetMsg(null), 2000)
  }

  const currentPatient = patients.find((p) => p.id === session.patientId)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Demo console</h1>
        <p className="text-sm text-stone-500 mt-1">
          Switch persona and timing, or run a one-click scenario into the patient chat.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardBody className="py-5">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">
              Current state
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="info" className="text-sm py-1 px-3">
                {currentPatient?.name ?? session.patientId}
              </Badge>
              <span className="text-stone-300">·</span>
              <Badge variant="neutral" className="text-sm py-1 px-3">
                {session.visitId}
              </Badge>
              <span className="text-stone-300">·</span>
              <Badge variant="neutral" className="text-sm py-1 px-3">
                {TIME_OFFSET_LABELS[session.timeOffset]}
              </Badge>
              {currentPatient && (
                <span className="text-xs text-stone-500 ml-auto">
                  {currentPatient.language_label} · {currentPatient.cohort} ·{' '}
                  {currentPatient.concomitant_meds.length} conmeds
                </span>
              )}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-5 flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="flex-1"
            >
              <Smartphone className="h-4 w-4" /> Open patient app
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/demo/audit-log')}
              className="flex-1"
            >
              <ScrollText className="h-4 w-4" /> Audit log
            </Button>
          </CardBody>
        </Card>
      </div>

      <Section title="Scripted scenarios" subtitle="One click sets persona + timing and auto-sends the prompt.">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {SCENARIOS.map((s) => {
            const Icon = SCENARIO_ICONS[s.id] ?? Sparkles
            return (
              <button
                key={s.id}
                onClick={() => runScenario(s)}
                className="text-left rounded-2xl border border-stone-200 bg-white hover:border-primary-300 hover:shadow-sm transition-all p-4 group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-9 w-9 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900">{s.title}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{s.tagline}</p>
                  </div>
                  <Play className="h-3.5 w-3.5 text-stone-300 group-hover:text-primary-600 transition-colors mt-1.5" />
                </div>
                <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 rounded-lg px-2.5 py-2 mb-2 italic">
                  "{s.prompt}"
                </p>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  <span className="font-medium text-stone-600">Expected:</span> {s.outcome}
                </p>
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Switch persona">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {patients.map((p) => {
            const active = p.id === session.patientId
            return (
              <button
                key={p.id}
                onClick={() => setSession({ patientId: p.id, checklist: {}, messages: [] })}
                className={cn(
                  'text-left rounded-2xl border p-4 transition-colors',
                  active
                    ? 'border-primary-500 bg-primary-50/40 ring-2 ring-primary-500/20'
                    : 'border-stone-200 bg-white hover:border-stone-300',
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{p.name}</p>
                    <p className="text-xs text-stone-500">
                      {p.age} · {p.language_label} · {p.cohort}
                    </p>
                  </div>
                  {active && <Badge variant="info">Selected</Badge>}
                </div>
                <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                  {p.personality_notes}
                </p>
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Switch time-offset">
        <div className="flex flex-wrap gap-2">
          {TIME_OFFSETS.map((t) => {
            const active = t === session.timeOffset
            return (
              <button
                key={t}
                onClick={() => setSession({ timeOffset: t, messages: [] })}
                className={cn(
                  'rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary-500 bg-primary-600 text-white'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300',
                )}
              >
                {TIME_OFFSET_LABELS[t]}
              </button>
            )
          })}
        </div>
      </Section>

      <div className="border-t border-stone-200 pt-6 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcw className="h-3.5 w-3.5" /> Reset all state
        </Button>
        {resetMsg && <span className="text-xs text-green-700">{resetMsg}</span>}
      </div>
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
        {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
