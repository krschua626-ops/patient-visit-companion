import { Link } from 'react-router-dom'
import { Calendar, Clock, MapPin, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardBody } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { TransportationCard } from '../components/TransportationCard'
import { useSession } from '../state/sessionStore'
import { usePatientContext, formatDuration } from '../lib/usePatientContext'

function greetingFor(name: string): string {
  const h = new Date().getHours()
  if (h < 12) return `Good morning, ${name}`
  if (h < 18) return `Good afternoon, ${name}`
  return `Good evening, ${name}`
}

export function HomePage() {
  const { patientId, visitId, timeOffset } = useSession()
  const { data, loading, error, refetch } = usePatientContext(patientId, visitId, timeOffset)

  if (loading) {
    return (
      <>
        <PageHeader title="Home" />
        <div className="flex-1 overflow-y-auto p-5 text-stone-400 text-sm">Loading…</div>
      </>
    )
  }
  if (error || !data) {
    return (
      <>
        <PageHeader title="Home" />
        <div className="flex-1 overflow-y-auto p-5 text-red-600 text-sm">{error ?? 'Failed to load'}</div>
      </>
    )
  }

  const { patient, visit, timing, study, outstanding_tasks } = data
  const filteredTasks = outstanding_tasks.filter((t) => t.id !== 'transport_arranged')
  const pending = filteredTasks.filter((t) => t.status === 'pending').length
  const isPast = timing.is_past
  const greeting = greetingFor(patient.first_name)

  return (
    <>
      <PageHeader title={greeting} subtitle={`${study.short_title} · ${patient.cohort}`} />

      <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-24">
        <div>
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
            {isPast ? 'Most recent visit' : 'Your next visit'}
          </p>
          <Link
            to={`/visit/${visit.id}`}
            className="block group"
          >
            <Card className="overflow-hidden transition-shadow group-hover:shadow-md">
              <div className="bg-gradient-to-br from-primary-50 to-white border-b border-stone-100 px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-stone-500 mb-0.5">{visit.name}</p>
                    <p className="text-lg font-semibold text-stone-900 capitalize">
                      {timing.label}
                    </p>
                  </div>
                  {isPast ? (
                    <Badge variant="ready">
                      <CheckCircle2 className="h-3 w-3" /> Complete
                    </Badge>
                  ) : pending === 0 ? (
                    <Badge variant="ready">
                      <CheckCircle2 className="h-3 w-3" /> Ready
                    </Badge>
                  ) : (
                    <Badge variant="pending">
                      <AlertCircle className="h-3 w-3" /> {pending} to do
                    </Badge>
                  )}
                </div>
              </div>
              <CardBody className="pt-4 pb-4 space-y-2.5">
                <div className="flex items-center gap-3 text-sm text-stone-700">
                  <Calendar className="h-4 w-4 text-stone-400 shrink-0" />
                  <span>Study day {visit.study_day}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-stone-700">
                  <Clock className="h-4 w-4 text-stone-400 shrink-0" />
                  <span>About {formatDuration(visit.total_duration_minutes)} at the clinic</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-stone-700">
                  <MapPin className="h-4 w-4 text-stone-400 shrink-0" />
                  <span>{study.site_name}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-stone-100 flex items-center justify-between text-sm font-medium text-primary-700">
                  <span>View briefing</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardBody>
            </Card>
          </Link>
        </div>

        {timeOffset !== 'days_plus_3' && (
          <TransportationCard context={data} timeOffset={timeOffset} onChanged={refetch} />
        )}

        {!isPast && pending > 0 && (
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
              Before your visit
            </p>
            <Card>
              <CardBody className="py-3.5">
                <ul className="divide-y divide-stone-100">
                  {filteredTasks.map((t) => (
                    <li key={t.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                      {t.status === 'done' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <div className="h-5 w-5 shrink-0 rounded-full border-2 border-amber-400 mt-0.5" />
                      )}
                      <span
                        className={
                          t.status === 'done'
                            ? 'text-sm text-stone-400 line-through'
                            : 'text-sm text-stone-800'
                        }
                      >
                        {t.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>
        )}

        <Card className="bg-stone-50/60 border-stone-200">
          <CardBody className="py-4 text-xs text-stone-500 leading-relaxed">
            Need to reach your study team? Call{' '}
            <span className="text-stone-900 font-medium">{study.coordinator_name}</span> at{' '}
            <a
              href={`tel:${study.coordinator_phone}`}
              className="text-primary-600 font-medium"
            >
              {study.coordinator_phone}
            </a>
            .
          </CardBody>
        </Card>
      </div>
    </>
  )
}
