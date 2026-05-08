import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { Card, CardBody } from './ui/Card'
import { deleteReminder, fetchReminders } from '../lib/api'
import type { Reminder } from '../lib/types'

interface RemindersCardProps {
  patientId: string
  refreshKey?: number
}

export function RemindersCard({ patientId, refreshKey }: RemindersCardProps) {
  const [reminders, setReminders] = useState<Reminder[]>([])

  async function load() {
    try {
      setReminders(await fetchReminders(patientId))
    } catch {
      setReminders([])
    }
  }

  useEffect(() => {
    void load()
    const t = setInterval(() => void load(), 5000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, refreshKey])

  if (reminders.length === 0) return null

  async function onDelete(id: string) {
    await deleteReminder(patientId, id)
    void load()
  }

  return (
    <div>
      <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
        Your reminders
      </p>
      <Card>
        <CardBody className="py-2">
          <ul className="divide-y divide-stone-100">
            {reminders.map((r) => (
              <li key={r.id} className="flex items-start gap-3 py-2.5 first:pt-1 last:pb-1">
                <div className="h-7 w-7 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="h-3.5 w-3.5" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-900 leading-snug">{r.what}</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">{r.when_label}</p>
                </div>
                <button
                  onClick={() => void onDelete(r.id)}
                  aria-label="Dismiss reminder"
                  className="h-6 w-6 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}
