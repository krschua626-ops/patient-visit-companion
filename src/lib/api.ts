import type { ChatResponse, ChatTurn, PatientVisitContext, Patient, AuditEntry, TimeOffset } from './types'

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
