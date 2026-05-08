import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ArrowRight } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardBody } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { EproCard } from '../components/EproCard'
import { EproSheet } from '../components/EproSheet'
import { RemindersCard } from '../components/RemindersCard'
import { useSession } from '../state/sessionStore'
import { useHomeContext } from '../lib/useHomeContext'
import type { NextEproActivity } from '../lib/types'

export function HomePage() {
  const { patientId, timeOffset } = useSession()
  const { data, loading, error, refetch } = useHomeContext(patientId, timeOffset)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetActivity, setSheetActivity] = useState<NextEproActivity | null>(null)

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

  const { patient, study, next_epro, upcoming_epros, next_visit, greeting } = data
  const otherEpros = upcoming_epros
    .filter((e) => e.assessment.id !== next_epro?.assessment.id)
    .slice(0, 2)

  function openSheet(activity: NextEproActivity) {
    setSheetActivity(activity)
    setSheetOpen(true)
  }

  return (
    <>
      <PageHeader title={greeting} subtitle={`${study.short_title} · ${patient.cohort}`} />

      <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-24">
        <RemindersCard patientId={patient.id} />

        {next_epro && (
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
              Up next for you
            </p>
            <EproCard activity={next_epro} onTap={() => openSheet(next_epro)} />
          </div>
        )}

        {otherEpros.length > 0 && (
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
              Also coming up
            </p>
            <div className="space-y-2">
              {otherEpros.map((e) => (
                <EproCard
                  key={e.assessment.id}
                  activity={e}
                  onTap={() => openSheet(e)}
                  variant="secondary"
                />
              ))}
            </div>
          </div>
        )}

        {next_visit && (
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
              Your study visit
            </p>
            <Link to="/visit" className="block group">
              <Card className="overflow-hidden transition-shadow group-hover:shadow-md">
                <CardBody className="py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary-50 text-primary-700 border border-primary-100 flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-stone-900">{next_visit.name}</p>
                        {next_visit.is_today && (
                          <Badge variant="info" className="text-[10px]">
                            Today
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 capitalize">
                        {next_visit.timing_label}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-stone-300 group-hover:text-primary-600 transition-colors" />
                  </div>
                </CardBody>
              </Card>
            </Link>
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

      <EproSheet
        open={sheetOpen}
        patientId={patient.id}
        activity={sheetActivity}
        onClose={() => setSheetOpen(false)}
        onCompleted={() => {
          setSheetOpen(false)
          void refetch()
        }}
      />
    </>
  )
}
