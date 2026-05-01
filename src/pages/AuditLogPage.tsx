import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, RefreshCw, ShieldAlert } from 'lucide-react'
import { Card, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { fetchAuditLog } from '../lib/api'
import type { AuditEntry } from '../lib/types'
import { TIME_OFFSET_LABELS } from '../lib/types'
import { cn } from '../lib/cn'

export function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  async function load() {
    setLoading(true)
    try {
      const data = await fetchAuditLog()
      setEntries(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    const t = setInterval(() => void load(), 5000)
    return () => clearInterval(t)
  }, [])

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Audit log</h1>
          <p className="text-sm text-stone-500 mt-1">
            Every chat turn, with retrieved context, grounding, confidence, and escalation. Auto-refreshes every 5s.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
        </Button>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <p className="text-sm text-stone-500">
              No chat turns yet. Run a scenario from the demo console to generate audit entries.
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[28px_140px_100px_1fr_110px_90px_70px] items-center gap-3 px-4 py-2.5 border-b border-stone-200 bg-stone-50 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
            <span></span>
            <span>Time</span>
            <span>Patient</span>
            <span>Message</span>
            <span>Confidence</span>
            <span>Escalation</span>
            <span className="text-right">Latency</span>
          </div>
          <ul className="divide-y divide-stone-100">
            {entries.map((e) => {
              const isOpen = expanded.has(e.id)
              const ts = new Date(e.timestamp)
              return (
                <li key={e.id}>
                  <button
                    onClick={() => toggle(e.id)}
                    className="w-full grid grid-cols-[28px_140px_100px_1fr_110px_90px_70px] items-center gap-3 px-4 py-3 hover:bg-stone-50 text-left transition-colors"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-stone-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-stone-400" />
                    )}
                    <span className="text-xs text-stone-600">
                      {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="text-sm text-stone-800 capitalize">{e.patient_id}</span>
                    <span className="text-sm text-stone-700 truncate">{e.user_message}</span>
                    <span>
                      <Badge
                        variant={
                          e.confidence === 'high'
                            ? 'confidence_high'
                            : e.confidence === 'medium'
                              ? 'confidence_medium'
                              : 'confidence_low'
                        }
                      >
                        {e.confidence}
                      </Badge>
                    </span>
                    <span>
                      {e.escalation_recommended ? (
                        <Badge variant="attention">
                          <ShieldAlert className="h-3 w-3" /> Yes
                        </Badge>
                      ) : (
                        <span className="text-xs text-stone-400">—</span>
                      )}
                    </span>
                    <span className="text-xs text-stone-500 text-right tabular-nums">{e.latency_ms}ms</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 pt-1 bg-stone-50/50 border-t border-stone-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailBlock label="Retrieved context" value={e.retrieved_context_summary} />
                        <DetailBlock label="System prompt" value={e.system_prompt_summary} />
                        <DetailBlock
                          label="Visit / time"
                          value={`${e.visit_id} · ${TIME_OFFSET_LABELS[e.time_offset]}`}
                        />
                        <DetailBlock label="Grounding sources" value={e.grounding_sources.join(' · ') || '—'} />
                        <DetailBlock label="User message" value={e.user_message} fullWidth />
                        <DetailBlock label="Reply" value={e.reply} fullWidth />
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}

function DetailBlock({
  label,
  value,
  fullWidth,
}: {
  label: string
  value: string
  fullWidth?: boolean
}) {
  return (
    <div className={cn(fullWidth && 'md:col-span-2')}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mb-1">{label}</p>
      <p className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  )
}
