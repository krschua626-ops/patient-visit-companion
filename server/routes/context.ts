import { Router } from 'express'
import { assembleContext, listPatients, getStudy } from '../contextAssembler.js'
import type { TimeOffset } from '../types.js'

const VALID_OFFSETS: TimeOffset[] = [
  'days_minus_3',
  'days_minus_1',
  'morning_of',
  'post_visit',
  'days_plus_3',
]

export const contextRouter = Router()

contextRouter.get('/patient-context', (req, res) => {
  const { patientId, visitId, timeOffset } = req.query
  if (typeof patientId !== 'string' || typeof visitId !== 'string') {
    return res.status(400).json({ error: 'patientId and visitId are required' })
  }
  const offset = (typeof timeOffset === 'string' ? timeOffset : 'days_minus_3') as TimeOffset
  if (!VALID_OFFSETS.includes(offset)) {
    return res.status(400).json({ error: `Invalid timeOffset. Use one of: ${VALID_OFFSETS.join(', ')}` })
  }
  const ctx = assembleContext(patientId, visitId, offset)
  if (!ctx) return res.status(404).json({ error: 'Patient or visit not found' })
  return res.json(ctx)
})

contextRouter.get('/patients', (_req, res) => {
  res.json(listPatients())
})

contextRouter.get('/study', (_req, res) => {
  res.json(getStudy())
})
