import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'

const badge = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border',
  {
    variants: {
      variant: {
        neutral: 'bg-stone-100 text-stone-700 border-stone-200',
        ready: 'bg-green-50 text-green-700 border-green-200',
        pending: 'bg-amber-50 text-amber-700 border-amber-200',
        attention: 'bg-red-50 text-red-700 border-red-200',
        info: 'bg-blue-50 text-blue-700 border-blue-200',
        confidence_high: 'bg-green-50 text-green-700 border-green-200',
        confidence_medium: 'bg-amber-50 text-amber-700 border-amber-200',
        confidence_low: 'bg-stone-100 text-stone-600 border-stone-200',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badge({ variant }), className)} {...props} />
}
