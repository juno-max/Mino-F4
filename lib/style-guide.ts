/**
 * MINO UI Style Guide
 * Based on modern fintech products (Ramp, Square, Mercury, Robinhood)
 * 
 * Design Principles:
 * - Clean, professional, trustworthy
 * - Generous whitespace
 * - Clear visual hierarchy
 * - Consistent spacing system
 * - Accessible color contrast
 */

export const styleGuide = {
  // Color Palette - Modern Fintech
  colors: {
    // Primary - Trustworthy blue (inspired by Ramp, Mercury)
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Main brand color
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    // Success - Green (universal for positive actions)
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    // Warning - Amber (cautions, pending states)
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    // Error - Red (destructive actions, errors)
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    // Neutral Grays - Professional foundation
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },

  // Typography Scale
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.05em' }],      // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }],                            // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],                              // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }],                           // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],                            // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],                            // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],                       // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],                         // 36px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Spacing Scale (4px base unit)
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    base: '0.375rem', // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Shadows (subtle, professional)
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // Component Styles
  components: {
    button: {
      base: 'inline-flex items-center justify-center font-medium transition-all duration-200 ease-out rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
      sizes: {
        sm: 'text-sm px-3 py-1.5 h-8',
        md: 'text-sm px-4 py-2 h-10',
        lg: 'text-base px-6 py-3 h-12',
      },
      variants: {
        primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-sm',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
        outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
        success: 'bg-success-500 text-white hover:bg-success-600 focus:ring-success-500 shadow-sm',
        danger: 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500 shadow-sm',
      },
    },
    card: {
      base: 'bg-white rounded-lg border border-gray-200 shadow-sm',
      padding: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    input: {
      base: 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors',
      error: 'border-error-300 focus:ring-error-500 focus:border-error-500',
    },
    table: {
      base: 'w-full border-collapse',
      header: 'bg-gray-50 border-b border-gray-200',
      cell: 'px-4 py-3 text-sm text-gray-900',
      headerCell: 'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider',
    },
    badge: {
      base: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variants: {
        success: 'bg-success-100 text-success-800',
        warning: 'bg-warning-100 text-warning-800',
        error: 'bg-error-100 text-error-800',
        info: 'bg-primary-100 text-primary-800',
        neutral: 'bg-gray-100 text-gray-800',
      },
    },
  },
}

// Design Tokens Export
export const tokens = {
  // Semantic Colors
  background: {
    default: styleGuide.colors.gray[50],
    card: '#ffffff',
    muted: styleGuide.colors.gray[100],
  },
  text: {
    primary: styleGuide.colors.gray[900],
    secondary: styleGuide.colors.gray[600],
    muted: styleGuide.colors.gray[500],
    inverse: '#ffffff',
  },
  border: {
    default: styleGuide.colors.gray[200],
    muted: styleGuide.colors.gray[100],
  },
}

