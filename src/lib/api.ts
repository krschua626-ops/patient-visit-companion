import type {
  AuditEntry,
  ChatResponse,
  ChatTurn,
  HomeContext,
  Patient,
  PatientVisitContext,
  Reminder,
  Ride,
  RideLeg,
  TimeOffset,
} from './types'

export async function fetchPatientContext(
  patientId: string,
  visitId: string,
  timeOffset: TimeOffset,
): Promise<PatientVisitContext> {
  const url = `/api/patient-context?patientId=${patientId}&visitId=${visitId}&timeOffset=${timeOffset}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Context fetch failed (${r.status})`)
  return r.json()
}

export async function fetchPatients(): Promise<Patient[]> {
  const r = await fetch('/api/patients')
  if (!r.ok) throw new Error(`Patients fetch failed (${r.status})`)
  return r.json()
}

export async function fetchHomeContext(
  patientId: string,
  timeOffset: TimeOffset,
): Promise<HomeContext> {
  const r = await fetch(`/api/home-context?patientId=${patientId}&timeOffset=${timeOffset}`)
  if (!r.ok) throw new Error(`Home context fetch failed (${r.status})`)
  return r.json()
}

export async function completeEpro(patientId: string, assessmentId: string): Promise<void> {
  const r = await fetch(`/api/epro/${patientId}/${assessmentId}/complete`, { method: 'POST' })
  if (!r.ok) throw new Error(`Complete failed (${r.status})`)
}

export async function fetchReminders(patientId: string): Promise<Reminder[]> {
  const r = await fetch(`/api/reminders/${patientId}`)
  if (!r.ok) throw new Error(`Reminders fetch failed (${r.status})`)
  return r.json()
}

export async function deleteReminder(patientId: string, id: string): Promise<void> {
  await fetch(`/api/reminders/${patientId}/${id}`, { method: 'DELETE' })
}

export async function fetchAuditLog(): Promise<AuditEntry[]> {
  const r = await fetch('/api/audit-log')
  if (!r.ok) throw new Error(`Audit log fetch failed (${r.status})`)
  return r.json()
}

export async function postChat(args: {
  patientId: string
  visitId: string
  timeOffset: TimeOffset
  message: string
  history: ChatTurn[]
}): Promise<ChatResponse> {
  const r = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  if (!r.ok) {
    const data = await r.json().catch(() => ({}))
    throw new Error(data.error || `Chat failed (${r.status})`)
  }
  return r.json()
}

export async function resetServer(): Promise<void> {
  await fetch('/api/reset', { method: 'POST' })
}

export async function bookRide(args: {
  patientId: string
  visitId: string
  timeOffset: TimeOffset
  leg: RideLeg
  scheduled_pickup_iso?: string
  vehicle_preference?: Ride['vehicle_preference']
  with_caregiver?: boolean
  wheelchair_accessible?: boolean
  notes_for_driver?: string
}): Promise<Ride> {
  const r = await fetch('/api/transportation/book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  if (!r.ok) {
    const data = await r.json().catch(() => ({}))
    throw new Error(data.error || `Booking failed (${r.status})`)
  }
  return r.json()
}

export async function fetchRide(
  patientId: string,
  visitId: string,
  leg: RideLeg,
  timeOffset: TimeOffset,
): Promise<Ride | null> {
  const r = await fetch(
    `/api/transportation/${patientId}/${visitId}/${leg}?timeOffset=${timeOffset}`,
  )
  if (r.status === 404) return null
  if (!r.ok) throw new Error(`Ride fetch failed (${r.status})`)
  return r.json()
}

export async function cancelRide(
  patientId: string,
  visitId: string,
  leg: RideLeg,
): Promise<Ride> {
  const r = await fetch(`/api/transportation/${patientId}/${visitId}/${leg}/cancel`, {
    method: 'POST',
  })
  if (!r.ok) throw new Error(`Cancel failed (${r.status})`)
  return r.json()
}
