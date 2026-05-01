import { Outlet } from 'react-router-dom'
import { PhoneFrame } from './PhoneFrame'
import { BottomNav } from './BottomNav'
import { ChatFab } from './ChatFab'

export function PatientLayout() {
  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Outlet />
      </div>
      <ChatFab />
      <BottomNav />
    </PhoneFrame>
  )
}
