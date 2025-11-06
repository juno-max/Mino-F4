import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg' | 'none'
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive'
}

export function Card({ className = '', children, padding = 'md', variant = 'default', ...props }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-sm',
    elevated: 'bg-white shadow-md border-0',
    outlined: 'bg-white border-2 border-gray-300',
    interactive: 'bg-white border border-gray-200 hover:shadow-lg hover:border-emerald-300 hover:-translate-y-0.5 cursor-pointer transition-all duration-200'
  }

  return (
    <div
      className={`rounded-lg ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-4 py-3 border-b border-gray-100 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ className = '', children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm text-gray-600 mt-1 ${className}`} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-4 py-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-4 py-3 border-t border-gray-100 flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  )
}
