interface CompletionRecord {
  patientId: string
  assessmentId: string
  completedAtIso: string
}

const completions = new Map<string, CompletionRecord>()

function key(patientId: string, assessmentId: string): string {
  return `${patientId}::${assessmentId}`
}

export function markCompleted(patientId: string, assessmentId: string): CompletionRecord {
  const record: CompletionRecord = {
    patientId,
    assessmentId,
    completedAtIso: new Date().toISOString(),
  }
  completions.set(key(patientId, assessmentId), record)
  return record
}

export function getCompletion(patientId: string, assessmentId: string): CompletionRecord | null {
  return completions.get(key(patientId, assessmentId)) ?? null
}

export function isCompletedRecently(patientId: string, assessmentId: string, withinMs: number): boolean {
  const rec = getCompletion(patientId, assessmentId)
  if (!rec) return false
  return Date.now() - new Date(rec.completedAtIso).getTime() < withinMs
}

export function resetCompletions(): void {
  completions.clear()
}
