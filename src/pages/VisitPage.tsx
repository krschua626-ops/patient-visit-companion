import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Check } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardBody } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useSession, toggleChecklistItem } from '../state/sessionStore'
import { usePatientContext, formatDuration } from '../lib/usePatientContext'
import { cn } from '../lib/cn'

export function VisitPage() {
  const { visitId } = useParams()
  const navigate = useNavigate()
  const { patientId, timeOffset, checklist } = useSession()
  const { data, loading, error } = usePatientContext(patientId, visitId ?? 'V3', timeOffset)

  if (loading) {
    return (
      <>
        <PageHeader title="Visit" />
        <div className="flex-1 overflow-y-auto p-5 text-stone-400 text-sm">Loading…</div>
      </>
    )
  }
  if (error || !data) {
    return (
      <>
        <PageHeader title="Visit" />
        <div className="flex-1 overflow-y-auto p-5 text-red-600 text-sm">{error ?? 'Failed to load'}</div>
      </>
    )
  }

  const { visit, timing } = data
  const checklistItems = visit.pre_requirements

  return (
    <>
      <PageHeader
        title={visit.name}
        subtitle={`${timing.label.charAt(0).toUpperCase()}${timing.label.slice(1)} · ${formatDuration(visit.total_duration_minutes)}`}
        trailing={
          <button
            onClick={() => navigate(-1)}
            className="text-stone-400 hover:text-stone-600 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-24">
        <Section label="What's happening">
          <Card>
            <CardBody className="py-2">
              <ul className="divide-y divide-stone-100">
                {visit.procedures.map((p) => (
                  <li key={p.code} className="py-3 first:pt-1 last:pb-1">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <span className="text-sm font-medium text-stone-900">
                        {p.patient_friendly_name}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-stone-500 shrink-0 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {p.estimated_duration_minutes} min
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      {p.plain_language_description}
                    </p>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </Section>

        {checklistItems.length > 0 && (
          <Section
            label="How to prepare"
            trailing={
              <Badge variant="info" className="text-[10px]">
                {checklistItems.filter((_, i) => checklist[`prep_${i}`]).length}/
                {checklistItems.length} done
              </Badge>
            }
          >
            <Card>
              <CardBody className="py-2">
                <ul>
                  {checklistItems.map((item, i) => {
                    const id = `prep_${i}`
                    const done = !!checklist[id]
                    return (
                      <li key={id}>
                        <button
                          onClick={() => toggleChecklistItem(id)}
                          className="w-full flex items-start gap-3 py-3 text-left hover:bg-stone-50 -mx-1 px-1 rounded-lg transition-colors"
                        >
                          <span
                            className={cn(
                              'h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center mt-0.5 transition-colors',
                              done
                                ? 'bg-primary-600 border-primary-600 text-white'
                                : 'border-stone-300',
                            )}
                          >
                            {done && <Check className="h-3 w-3" strokeWidth={3} />}
                          </span>
                          <span
                            className={cn(
                              'text-sm leading-relaxed',
                              done ? 'text-stone-400 line-through' : 'text-stone-800',
                            )}
                          >
                            {item.description}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </CardBody>
            </Card>
          </Section>
        )}

        {visit.items_to_bring.length > 0 && (
          <Section label="What to bring">
            <Card>
              <CardBody className="py-2">
                <ul className="divide-y divide-stone-100">
                  {visit.items_to_bring.map((item, i) => (
                    <li key={i} className="py-2.5 first:pt-1 last:pb-1 text-sm text-stone-800">
                      {item.description}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </Section>
        )}

        {visit.post_requirements.length > 0 && (
          <Section label="What to expect after">
            <Card>
              <CardBody className="py-2">
                <ul className="divide-y divide-stone-100">
                  {visit.post_requirements.map((r, i) => (
                    <li key={i} className="py-2.5 first:pt-1 last:pb-1 text-sm text-stone-800">
                      {r.description}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </Section>
        )}
      </div>
    </>
  )
}

function Section({
  label,
  trailing,
  children,
}: {
  label: string
  trailing?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">{label}</p>
        {trailing}
      </div>
      {children}
    </div>
  )
}
