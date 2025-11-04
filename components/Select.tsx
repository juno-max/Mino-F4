import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  error?: boolean
  size?: 'sm' | 'md'
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error = false, size = 'md', className = '', children, ...props }, ref) => {
    const errorStyles = error
      ? 'border-red-300 focus:ring-red-600 focus:border-red-600'
      : 'border-stone-300 focus:ring-amber-600 focus:border-amber-600'

    // Standardized select sizes matching Input component
    const sizes = {
      sm: 'text-sm px-3.5 py-2 h-10 min-h-[40px]',
      md: 'text-base px-4 py-2.5 h-11 min-h-[44px]',
    }

    return (
      <select
        ref={ref}
        className={`w-full rounded-lg border bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 transition-fintech ${errorStyles} ${sizes[size]} ${className}`}
        style={{ lineHeight: '1.5' }}
        {...props}
      >
        {children}
      </select>
    )
  }
)

Select.displayName = 'Select'
