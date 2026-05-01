import { Router } from 'express'
import { getAuditLog, resetAuditLog } from '../auditLog.js'
import { resetRides } from '../rideStore.js'
import { resetCompletions } from '../eproStore.js'

export const auditRouter = Router()

auditRouter.get('/audit-log', (_req, res) => {
  res.json(getAuditLog())
})

auditRouter.post('/reset', (_req, res) => {
  resetAuditLog()
  resetRides()
  resetCompletions()
  res.json({ status: 'reset' })
})
