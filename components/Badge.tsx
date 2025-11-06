import { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'error' | 'info' | 'neutral' | 'outline' | 'incomplete' | 'complete'
}

export function Badge({ variant = 'neutral', className = '', children, ...props }: BadgeProps) {
  const variants = {
    complete: 'bg-emerald-100 text-emerald-700',
    success: 'bg-emerald-100 text-emerald-700',
    incomplete: 'bg-orange-100 text-orange-700',
    warning: 'bg-orange-100 text-orange-700',
    danger: 'bg-red-100 text-red-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-50 text-blue-700',
    neutral: 'bg-gray-100 text-gray-700',
    outline: 'border border-gray-300 bg-white text-gray-700',
  }

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
