import { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
}

export function Badge({ variant = 'neutral', className = '', children, ...props }: BadgeProps) {
  const variants = {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-amber-50 text-amber-700',
    neutral: 'bg-stone-100 text-stone-700',
  }

  // Improved padding for better readability
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${variants[variant]} ${className}`}
      style={{ lineHeight: '1.5' }}
      {...props}
    >
      {children}
    </span>
  )
}
