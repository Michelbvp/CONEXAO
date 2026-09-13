import { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export function Cartao({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-prata-200 bg-white shadow-card',
        className,
      )}
      {...props}
    />
  )
}
