'use client'

import { useState, ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface ButtonConfig {
  icon: LucideIcon | ReactNode
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  disabled?: boolean
  badge?: string | number
  tooltip?: string
}

interface ProgressiveButtonGroupProps {
  buttons: ButtonConfig[]
  showLabels?: boolean // Force show labels always
  size?: 'sm' | 'md' | 'lg'
  spacing?: 'tight' | 'normal' | 'loose'
}

/**
 * ProgressiveButtonGroup - Icon-first button group with hover labels
 *
 * Core UX Principle: Icon-First, Label-Second
 * - Shows icons by default
 * - Reveals labels on hover
 * - Compact by default, expansive on interaction
 *
 * @example
 * <ProgressiveButtonGroup
 *   buttons={[
 *     { icon: Edit, label: 'Instructions', onClick: handleEdit },
 *     { icon: CheckCircle, label: 'Ground Truth', onClick: handleGT },
 *     { icon: Download, label: 'Export', onClick: handleExport },
 *   ]}
 * />
 */
export function ProgressiveButtonGroup({
  buttons,
  showLabels = false,
  size = 'md',
  spacing = 'normal',
}: ProgressiveButtonGroupProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-10 px-3 text-sm',
    lg: 'h-12 px-4 text-base',
  }

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  const spacingClasses = {
    tight: 'gap-1',
    normal: 'gap-2',
    loose: 'gap-3',
  }

  const iconOnlyWidth = {
    sm: 'w-8',
    md: 'w-10',
    lg: 'w-12',
  }

  const getVariantClasses = (variant: ButtonConfig['variant'] = 'outline', disabled: boolean = false) => {
    if (disabled) {
      return 'bg-gray-100 text-gray-400 cursor-not-allowed'
    }

    const variants = {
      primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-fintech-sm',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-fintech-sm',
      outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700',
      ghost: 'hover:bg-gray-100 text-gray-700',
    }

    return variants[variant]
  }

  return (
    <div className={`flex items-center ${spacingClasses[spacing]}`}>
      {buttons.map((button, index) => {
        const isHovered = hoveredIndex === index
        const shouldShowLabel = showLabels || isHovered
        const IconComponent = button.icon as LucideIcon

        return (
          <button
            key={index}
            onClick={button.onClick}
            disabled={button.disabled}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`
              relative
              inline-flex items-center justify-center gap-2
              font-semibold
              rounded-md
              transition-all duration-200 ease-in-out
              ${sizeClasses[size]}
              ${getVariantClasses(button.variant, button.disabled)}
              ${shouldShowLabel ? 'min-w-[100px]' : iconOnlyWidth[size]}
            `}
            title={button.tooltip || button.label}
          >
            {/* Icon */}
            <IconComponent className={iconSizes[size]} />

            {/* Label - slides in on hover */}
            {shouldShowLabel && (
              <span
                className={`
                  whitespace-nowrap overflow-hidden
                  transition-all duration-200
                  ${isHovered ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0'}
                `}
              >
                {button.label}
              </span>
            )}

            {/* Badge */}
            {button.badge && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 flex items-center justify-center bg-emerald-600 text-white text-[10px] font-bold rounded-full">
                {button.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Compact variant - even smaller for dense UIs
 */
export function CompactButtonGroup({
  buttons,
  showLabels = false,
}: Omit<ProgressiveButtonGroupProps, 'size' | 'spacing'>) {
  return (
    <ProgressiveButtonGroup
      buttons={buttons}
      showLabels={showLabels}
      size="sm"
      spacing="tight"
    />
  )
}
