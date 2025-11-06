import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap'

    const variants = {
      primary: 'bg-[rgb(52,211,153)] text-white hover:bg-[rgb(16,185,129)] focus:ring-[rgb(52,211,153)] active:scale-[0.98]',
      secondary: 'bg-gray-100 text-black hover:bg-gray-200 focus:ring-gray-400',
      outline: 'border border-gray-300 bg-white text-black hover:bg-gray-50 focus:ring-[rgb(52,211,153)]',
      ghost: 'bg-transparent text-black hover:bg-gray-100 focus:ring-gray-400',
      success: 'bg-[rgb(34,197,94)] text-white hover:bg-green-600 focus:ring-[rgb(34,197,94)]',
      danger: 'bg-[rgb(239,68,68)] text-white hover:bg-red-600 focus:ring-[rgb(239,68,68)]',
    }

    const sizes = {
      sm: 'text-sm px-3 py-1.5 h-8 min-h-[32px]',
      md: 'text-sm px-4 py-2 h-10 min-h-[40px]',
      lg: 'text-base px-5 py-2.5 h-12 min-h-[48px]',
    }

    const classes = [baseStyles, variants[variant], sizes[size], className]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
