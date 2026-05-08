import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { contextRouter } from './routes/context.js'
import { auditRouter } from './routes/audit.js'
import { chatRouter } from './routes/chat.js'
import { transportationRouter } from './routes/transportation.js'
import { remindersRouter } from './routes/reminders.js'
import procedureLibrary from './data/procedureLibrary.json' with { type: 'json' }
import study from './data/study.json' with { type: 'json' }
import patients from './data/patients.json' with { type: 'json' }

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    data: {
      procedures: Object.keys(procedureLibrary).length,
      visits: study.visits.length,
      patients: Object.keys(patients).length,
    },
  })
})

app.use('/api', contextRouter)
app.use('/api', auditRouter)
app.use('/api', chatRouter)
app.use('/api', transportationRouter)
app.use('/api', remindersRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
