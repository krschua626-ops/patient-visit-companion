import { Link, useLocation } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'

export function ChatFab() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/chat')) return null
  return (
    <Link
      to="/chat"
      aria-label="Chat with your assistant"
      className="absolute right-5 bottom-[88px] h-14 w-14 rounded-full bg-primary-600 hover:bg-primary-700 active:bg-primary-700 text-white shadow-lg shadow-primary-600/25 flex items-center justify-center transition-colors"
    >
      <MessageCircle className="h-6 w-6" strokeWidth={2} />
    </Link>
  )
}
