import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 ease-out rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap'

    const variants = {
      primary: 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-600 shadow-fintech-sm hover:shadow-fintech active:scale-98',
      secondary: 'bg-stone-100 text-stone-800 hover:bg-stone-200 focus:ring-stone-500',
      outline: 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-50 focus:ring-amber-600',
      ghost: 'bg-transparent text-stone-800 hover:bg-stone-100 focus:ring-stone-500',
      success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-600 shadow-fintech-sm hover:shadow-fintech active:scale-98',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 shadow-fintech-sm hover:shadow-fintech active:scale-98',
    }

    // Standardized sizes with consistent padding and height
    // All buttons meet minimum 44px touch target (sm can be 36px for compact UIs)
    const sizes = {
      sm: 'text-sm px-4 py-2 h-9 min-h-[36px]', // 36px minimum for small buttons
      md: 'text-base px-5 py-2.5 h-11 min-h-[44px]', // 44px standard touch target
      lg: 'text-base px-6 py-3 h-12 min-h-[48px]', // 48px for prominent actions
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
