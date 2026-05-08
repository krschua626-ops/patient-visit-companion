import { Bell, Check } from 'lucide-react'
import type { CreatedReminder } from '../lib/types'

export function ReminderConfirmCard({ reminders }: { reminders: CreatedReminder[] }) {
  if (!reminders.length) return null
  return (
    <div className="rounded-2xl border border-green-200 bg-green-50/70 p-3 mt-2">
      <div className="flex items-start gap-2.5">
        <div className="h-7 w-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0">
          <Check className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-green-900 mb-1">
            {reminders.length === 1 ? 'Reminder set' : `${reminders.length} reminders set`}
          </p>
          <ul className="space-y-1">
            {reminders.map((r, i) => (
              <li key={i} className="flex items-center gap-1.5 text-xs text-stone-700">
                <Bell className="h-3 w-3 text-green-700 shrink-0" />
                <span className="font-medium text-stone-900 truncate">{r.what}</span>
                <span className="text-stone-400">·</span>
                <span className="text-stone-500 shrink-0">{r.when_label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
