interface HighlightChipsProps {
  highlights: string[]
}

export function HighlightChips({ highlights }: HighlightChipsProps) {
  if (!highlights.length) return null
  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {highlights.map((h, i) => (
        <span
          key={i}
          className="inline-flex items-center rounded-lg bg-primary-50 border border-primary-100 px-2.5 py-1 text-[11px] font-medium text-primary-800"
        >
          {h}
        </span>
      ))}
    </div>
  )
}
