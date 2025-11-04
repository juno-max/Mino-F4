import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

export function Card({ className = '', children, padding = 'md', ...props }: CardProps) {
  // Consistent padding scale
  const paddingClasses = {
    none: '',
    sm: 'p-4',   // 16px - compact content
    md: 'p-6',   // 24px - standard content
    lg: 'p-8',   // 32px - spacious content
  }

  return (
    <div
      className={`bg-white rounded-lg border border-stone-200 shadow-fintech-sm ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
