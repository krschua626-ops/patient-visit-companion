import { getPatient, getStudy } from './contextAssembler.js'
import { isCompletedRecently } from './eproStore.js'
import type {
  EproAssessment,
  HomeContext,
  NextEproActivity,
  Patient,
  TimeOffset,
  TrackedSymptom,
} from './types.js'

export function assembleHomeContext(patientId: string, timeOffset: TimeOffset): HomeContext | null {
  const patient = getPatient(patientId)
  const study = getStudy()
  if (!patient) return null

  const epros = study.epro_assessments
  const symptomMap = new Map<string, TrackedSymptom>()
  for (const s of study.tracked_symptoms) symptomMap.set(s.id, s)

  const upcoming = epros
    .map((a) => buildEproActivity(a, patient, timeOffset))
    .filter((a): a is NextEproActivity => a !== null)
    .sort((a, b) => statusRank(a.status) - statusRank(b.status))

  const symptoms = patient.symptom_history.map((s) => {
    const meta = symptomMap.get(s.symptom_id)
    return {
      ...s,
      name: meta?.name ?? s.symptom_id,
      scale: meta?.scale ?? 'severity_4',
    }
  })

  const nextVisitInfo = computeNextVisit(patient, timeOffset)
  const greeting = buildGreeting(patient.first_name, timeOffset)

  return {
    patient,
    study: {
      short_title: study.short_title,
      sponsor: study.sponsor,
      coordinator_name: study.coordinator_name,
      coordinator_phone: study.coordinator_phone,
    },
    next_epro: upcoming[0] ?? null,
    upcoming_epros: upcoming,
    symptoms,
    next_visit: nextVisitInfo,
    greeting,
  }
}

function statusRank(s: NextEproActivity['status']): number {
  if (s === 'overdue') return 0
  if (s === 'due_now') return 1
  if (s === 'due_soon') return 2
  return 3
}

function buildEproActivity(
  a: EproAssessment,
  patient: Patient,
  timeOffset: TimeOffset,
): NextEproActivity | null {
  if (isCompletedRecently(patient.id, a.id, 60 * 60 * 1000)) {
    return {
      assessment: a,
      status: 'on_track',
      due_label: 'Completed just now',
      cta_label: 'View summary',
      last_completed_label: 'Completed moments ago',
    }
  }
  if (a.id === 'pre_visit_check') {
    if (timeOffset === 'days_plus_3') return null
    const status: NextEproActivity['status'] =
      timeOffset === 'morning_of'
        ? 'overdue'
        : timeOffset === 'days_minus_1'
          ? 'due_soon'
          : 'on_track'
    const dueLabel =
      timeOffset === 'morning_of'
        ? 'Due now — before your visit'
        : timeOffset === 'days_minus_1'
          ? 'Due tomorrow morning'
          : 'Due the morning of your visit'
    const cta =
      status === 'overdue' ? 'Complete check-in' : status === 'due_soon' ? 'Set a reminder' : 'View details'
    return {
      assessment: a,
      status,
      due_label: dueLabel,
      cta_label: cta,
      last_completed_label: patient.epro_state.pre_visit_check?.ever_completed
        ? `Last completed ${patient.epro_state.pre_visit_check.last_completed_days_ago ?? 0} days ago`
        : null,
    }
  }

  if (a.id === 'daily_symptom_diary') {
    const state = patient.epro_state.daily_symptom_diary ?? {}
    const hours = state.last_completed_hours_ago ?? 24
    const status: NextEproActivity['status'] =
      hours >= 22 ? 'due_now' : hours >= 18 ? 'due_soon' : 'on_track'
    const dueLabel =
      status === 'due_now' ? 'Due tonight' : status === 'due_soon' ? 'Due this evening' : 'Due tonight at 8 PM'
    const cta =
      status === 'on_track' ? 'View today' : status === 'due_soon' ? 'Start now (4 min)' : 'Complete now (4 min)'
    return {
      assessment: a,
      status,
      due_label: dueLabel,
      cta_label: cta,
      last_completed_label:
        hours <= 24 ? `Last completed ${formatHoursAgo(hours)}` : 'Not yet completed today',
      streak_days: state.streak_days,
    }
  }

  if (a.id === 'weekly_wellbeing') {
    const state = patient.epro_state.weekly_wellbeing ?? {}
    const days = state.last_completed_days_ago ?? 7
    const daysUntilDue = Math.max(0, 7 - days)
    const status: NextEproActivity['status'] =
      daysUntilDue === 0 ? 'due_now' : daysUntilDue <= 2 ? 'due_soon' : 'on_track'
    const dueLabel =
      daysUntilDue === 0
        ? 'Due today'
        : daysUntilDue === 1
          ? 'Due tomorrow'
          : `Due in ${daysUntilDue} days (Sunday)`
    const cta =
      status === 'on_track' ? 'View this week' : status === 'due_soon' ? 'Start (12 min)' : 'Complete now (12 min)'
    return {
      assessment: a,
      status,
      due_label: dueLabel,
      cta_label: cta,
      last_completed_label:
        days === 0 ? 'Completed today' : `Last completed ${days} day${days === 1 ? '' : 's'} ago`,
    }
  }

  return null
}

function formatHoursAgo(hours: number): string {
  if (hours < 1) return 'just now'
  if (hours === 1) return '1 hour ago'
  if (hours < 24) return `${hours} hours ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}

function buildGreeting(firstName: string, timeOffset: TimeOffset): string {
  if (timeOffset === 'morning_of') return `Good morning, ${firstName}`
  if (timeOffset === 'post_visit') return `How are you feeling, ${firstName}?`
  return `Welcome back, ${firstName}`
}

function computeNextVisit(patient: Patient, timeOffset: TimeOffset): HomeContext['next_visit'] {
  const study = getStudy()
  const visit = study.visits.find((v) => v.id === patient.current_visit_id)
  if (!visit) return null
  const labels: Record<TimeOffset, string> = {
    days_minus_3: 'in 3 days',
    days_minus_1: 'tomorrow',
    morning_of: 'today',
    post_visit: 'completed earlier today',
    days_plus_3: 'completed 3 days ago',
  }
  return {
    id: visit.id,
    name: visit.name,
    timing_label: labels[timeOffset],
    is_today: timeOffset === 'morning_of',
  }
}
