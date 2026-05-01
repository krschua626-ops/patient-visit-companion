import { Routes, Route } from 'react-router-dom'
import { PatientLayout } from './components/layout/PatientLayout'
import { DemoLayout } from './components/layout/DemoLayout'
import { HomePage } from './pages/HomePage'
import { VisitPage } from './pages/VisitPage'
import { ChatPage } from './pages/ChatPage'
import { DemoPage } from './pages/DemoPage'
import { AuditLogPage } from './pages/AuditLogPage'

export default function App() {
  return (
    <Routes>
      <Route element={<PatientLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/visit/:visitId" element={<VisitPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Route>
      <Route element={<DemoLayout />}>
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/demo/audit-log" element={<AuditLogPage />} />
      </Route>
    </Routes>
  )
}
