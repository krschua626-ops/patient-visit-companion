import { Router } from 'express'
import { getAuditLog, resetAuditLog } from '../auditLog.js'

export const auditRouter = Router()

auditRouter.get('/audit-log', (_req, res) => {
  res.json(getAuditLog())
})

auditRouter.post('/reset', (_req, res) => {
  resetAuditLog()
  res.json({ status: 'reset' })
})
