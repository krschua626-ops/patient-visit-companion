import { BookOpen } from 'lucide-react'

export function SourcePill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[11px] font-medium border border-stone-200">
      <BookOpen className="h-2.5 w-2.5" strokeWidth={2.5} />
      {label}
    </span>
  )
}
