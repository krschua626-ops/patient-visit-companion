import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface PhoneFrameProps {
  children: ReactNode
  className?: string
}

export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div className="min-h-screen w-full flex items-stretch sm:items-center justify-center sm:py-8 bg-stone-50">
      <div
        className={cn(
          'relative w-full max-w-[420px] min-h-screen sm:min-h-0 sm:h-[844px] bg-white sm:rounded-[2.25rem] sm:border sm:border-stone-200 sm:shadow-xl flex flex-col overflow-hidden',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
