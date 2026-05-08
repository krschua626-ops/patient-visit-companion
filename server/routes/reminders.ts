import { Router } from 'express'
import { createReminder, deleteReminder, listReminders } from '../reminderStore.js'

export const remindersRouter = Router()

remindersRouter.get('/reminders/:patientId', (req, res) => {
  res.json(listReminders(req.params.patientId))
})

remindersRouter.post('/reminders/:patientId', (req, res) => {
  const { what, when_iso, when_label } = req.body as {
    what?: string
    when_iso?: string
    when_label?: string
  }
  if (!what || !when_iso || !when_label) {
    return res.status(400).json({ error: 'what, when_iso, when_label required' })
  }
  const r = createReminder({
    patient_id: req.params.patientId,
    what,
    when_iso,
    when_label,
    source: 'manual',
  })
  res.json(r)
})

remindersRouter.delete('/reminders/:patientId/:id', (req, res) => {
  const ok = deleteReminder(req.params.id)
  res.json({ ok })
})
