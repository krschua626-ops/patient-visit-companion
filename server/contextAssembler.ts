import procedureLibraryRaw from './data/procedureLibrary.json' with { type: 'json' }
import studyRaw from './data/study.json' with { type: 'json' }
import patientsRaw from './data/patients.json' with { type: 'json' }
import { getRidesForVisit } from './rideStore.js'
import type {
  Patient,
  PatientVisitContext,
  Procedure,
  Study,
  TimeOffset,
  Visit,
} from './types.js'

const procedureLibrary = procedureLibraryRaw as Record<string, Procedure>
const study = studyRaw as Study
const patients = patientsRaw as Record<string, Patient>

const TIMING_LABELS: Record<TimeOffset, { label: string; is_past: boolean; days_until: number | null }> = {
  days_minus_3: { label: 'in 3 days', is_past: false, days_until: 3 },
  days_minus_1: { label: 'tomorrow', is_past: false, days_until: 1 },
  morning_of: { label: 'today', is_past: false, days_until: 0 },
  post_visit: { label: 'completed earlier today', is_past: true, days_until: 0 },
  days_plus_3: { label: 'completed 3 days ago', is_past: true, days_until: -3 },
}

export function listPatients(): Patient[] {
  return Object.values(patients)
}

export function getPatient(patientId: string): Patient | null {
  return patients[patientId] ?? null
}

export function getStudy(): Study {
  return study
}

export function getVisit(visitId: string): Visit | null {
  return study.visits.find((v) => v.id === visitId) ?? null
}

function dedupeBy<T>(items: T[], key: (t: T) => string): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const item of items) {
    const k = key(item)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(item)
  }
  return out
}

export function assembleContext(
  patientId: string,
  visitId: string,
  timeOffset: TimeOffset,
): PatientVisitContext | null {
  const patient = patients[patientId]
  const visit = study.visits.find((v) => v.id === visitId)
  if (!patient || !visit) return null

  const procedures: Procedure[] = visit.procedures
    .map((code) => procedureLibrary[code])
    .filter((p): p is Procedure => Boolean(p))

  const total_duration_minutes = procedures.reduce(
    (sum, p) => sum + p.estimated_duration_minutes,
    0,
  )

  const pre_requirements = dedupeBy(
    procedures.flatMap((p) =>
      p.pre_requirements.map((r) => ({
        type: r.type,
        description: r.description,
        source_procedure: p.code,
      })),
    ),
    (r) => `${r.type}:${r.description}`,
  )

  const post_requirements = dedupeBy(
    procedures.flatMap((p) =>
      p.post_requirements
        .filter((r) => r.description)
        .map((r) => ({
          type: r.type,
          description: r.description as string,
          source_procedure: p.code,
        })),
    ),
    (r) => `${r.type}:${r.description}`,
  )

  const items_to_bring = dedupeBy(
    procedures.flatMap((p) =>
      p.items_to_bring.map((it) => ({
        description: it.description,
        source_procedure: p.code,
      })),
    ),
    (it) => it.description,
  )

  const timing = TIMING_LABELS[timeOffset]

  const outstanding_tasks = buildOutstandingTasks(timeOffset)

  const transportation = buildTransportationBlock(patient, visit, timeOffset, total_duration_minutes)

  const briefing_card = renderBriefingCard({
    patient,
    visit,
    procedures,
    total_duration_minutes,
    pre_requirements,
    items_to_bring,
    timing_label: timing.label,
  })

  return {
    patient,
    study: {
      short_title: study.short_title,
      sponsor: study.sponsor,
      indication: study.indication,
      investigational_product: study.investigational_product,
      site_name: study.site_name,
      coordinator_name: study.coordinator_name,
      coordinator_phone: study.coordinator_phone,
      after_hours_line: study.after_hours_line,
    },
    visit: {
      id: visit.id,
      name: visit.name,
      type: visit.type,
      study_day: visit.study_day,
      procedures,
      total_duration_minutes,
      pre_requirements,
      post_requirements,
      items_to_bring,
    },
    timing: { offset: timeOffset, ...timing },
    outstanding_tasks,
    transportation,
    briefing_card,
  }
}

function buildTransportationBlock(
  patient: Patient,
  visit: Visit,
  timeOffset: TimeOffset,
  total_duration_minutes: number,
): PatientVisitContext['transportation'] {
  const tx = study.transportation
  const px = patient.transportation
  const visitStart = anchorVisitTime(timeOffset)
  const outboundPickup = new Date(visitStart.getTime() - tx.default_pickup_buffer_minutes * 60_000)
  const returnPickup = new Date(
    visitStart.getTime() +
      total_duration_minutes * 60_000 +
      tx.post_visit_pickup_buffer_minutes * 60_000,
  )

  const rides = getRidesForVisit(patient.id, visit.id)

  return {
    sponsor_paid: tx.sponsor_paid,
    provider: tx.provider,
    home_address: px.home_address,
    site_address: tx.site_address,
    default_vehicle_preference: px.default_vehicle_preference,
    wheelchair_accessible_required: px.wheelchair_accessible_required,
    caregiver_default: px.ride_with_caregiver_default && Boolean(patient.caregiver),
    suggested_outbound_pickup_iso: outboundPickup.toISOString(),
    suggested_return_pickup_iso: returnPickup.toISOString(),
    policy_summary: tx.policy_summary,
    outbound_ride: rides.outbound,
    return_ride: rides.return,
  }
}

function anchorVisitTime(timeOffset: TimeOffset): Date {
  const now = new Date()
  const visit = new Date(now)
  visit.setHours(9, 30, 0, 0)
  switch (timeOffset) {
    case 'days_minus_3':
      visit.setDate(visit.getDate() + 3)
      break
    case 'days_minus_1':
      visit.setDate(visit.getDate() + 1)
      break
    case 'morning_of':
      break
    case 'post_visit':
      break
    case 'days_plus_3':
      visit.setDate(visit.getDate() - 14)
      break
  }
  return visit
}

function buildOutstandingTasks(
  timeOffset: TimeOffset,
): Array<{ id: string; label: string; status: 'pending' | 'done' }> {
  if (timeOffset === 'post_visit' || timeOffset === 'days_plus_3') {
    return [
      { id: 'epro_morning', label: 'Pre-visit ePRO questionnaire', status: 'done' },
      { id: 'fasting_check', label: 'Fasting confirmed', status: 'done' },
      { id: 'transport_arranged', label: 'Transportation arranged', status: 'done' },
    ]
  }
  if (timeOffset === 'morning_of') {
    return [
      { id: 'epro_morning', label: 'Complete morning ePRO questionnaire', status: 'pending' },
      { id: 'fasting_check', label: 'Confirm 8-hour fast complete', status: 'done' },
      { id: 'transport_arranged', label: 'Transportation arranged', status: 'done' },
    ]
  }
  if (timeOffset === 'days_minus_1') {
    return [
      { id: 'epro_morning', label: 'Complete pre-visit ePRO (due tomorrow morning)', status: 'pending' },
      { id: 'fasting_check', label: 'Begin fasting tonight at 11 PM', status: 'pending' },
      { id: 'transport_arranged', label: 'Transportation arranged', status: 'done' },
    ]
  }
  return [
    { id: 'epro_morning', label: 'Complete pre-visit ePRO (due morning of visit)', status: 'pending' },
    { id: 'transport_arranged', label: 'Confirm transportation', status: 'pending' },
    { id: 'meds_list', label: 'Update your medication list', status: 'pending' },
  ]
}

function renderBriefingCard(args: {
  patient: Patient
  visit: Visit
  procedures: Procedure[]
  total_duration_minutes: number
  pre_requirements: Array<{ description: string }>
  items_to_bring: Array<{ description: string }>
  timing_label: string
}): string {
  const { patient, visit, procedures, total_duration_minutes, pre_requirements, items_to_bring, timing_label } = args
  const hours = Math.floor(total_duration_minutes / 60)
  const mins = total_duration_minutes % 60
  const duration =
    hours > 0
      ? `about ${hours} hour${hours > 1 ? 's' : ''}${mins ? ` and ${mins} minutes` : ''}`
      : `about ${mins} minutes`

  const proceduresList = procedures
    .map((p) => `- ${p.patient_friendly_name}`)
    .join('\n')

  const prepList = pre_requirements.length
    ? pre_requirements.map((r) => `- ${r.description}`).join('\n')
    : '- No special preparation required.'

  const bringList = items_to_bring.length
    ? items_to_bring.map((it) => `- ${it.description}`).join('\n')
    : '- Just yourself and your photo ID.'

  return `# ${visit.name}

Hi ${patient.first_name} — your ${visit.name} is **${timing_label}**.
Plan for **${duration}** at the clinic.

## What's happening at this visit
${proceduresList}

## How to prepare
${prepList}

## What to bring
${bringList}
`
}
