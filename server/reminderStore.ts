export interface Reminder {
  id: string
  patient_id: string
  what: string
  when_iso: string
  when_label: string
  created_at_iso: string
  source: 'chat' | 'manual'
  status: 'active' | 'completed' | 'cancelled'
}

const reminders = new Map<string, Reminder>()

export function createReminder(args: {
  patient_id: string
  what: string
  when_iso: string
  when_label: string
  source?: Reminder['source']
}): Reminder {
  const reminder: Reminder = {
    id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    patient_id: args.patient_id,
    what: args.what,
    when_iso: args.when_iso,
    when_label: args.when_label,
    created_at_iso: new Date().toISOString(),
    source: args.source ?? 'chat',
    status: 'active',
  }
  reminders.set(reminder.id, reminder)
  return reminder
}

export function listReminders(patientId: string): Reminder[] {
  return Array.from(reminders.values())
    .filter((r) => r.patient_id === patientId && r.status === 'active')
    .sort((a, b) => new Date(a.when_iso).getTime() - new Date(b.when_iso).getTime())
}

export function deleteReminder(id: string): boolean {
  const r = reminders.get(id)
  if (!r) return false
  r.status = 'cancelled'
  reminders.set(id, r)
  return true
}

export function resetReminders(): void {
  reminders.clear()
}
