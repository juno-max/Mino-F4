import { toast as sonnerToast } from 'sonner'

/**
 * Toast notification utilities for MINO
 * Uses sonner for consistent, accessible toast notifications
 */

export const toast = {
  /**
   * Show a success toast
   */
  success: (message: string, options?: {
    description?: string
    action?: {
      label: string
      onClick: () => void
    }
    duration?: number
  }) => {
    return sonnerToast.success(message, {
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 4000,
    })
  },

  /**
   * Show an error toast
   */
  error: (message: string, options?: {
    description?: string
    action?: {
      label: string
      onClick: () => void
    }
    duration?: number
  }) => {
    return sonnerToast.error(message, {
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 6000,
    })
  },

  /**
   * Show an info toast
   */
  info: (message: string, options?: {
    description?: string
    action?: {
      label: string
      onClick: () => void
    }
    duration?: number
  }) => {
    return sonnerToast.info(message, {
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 4000,
    })
  },

  /**
   * Show a warning toast
   */
  warning: (message: string, options?: {
    description?: string
    action?: {
      label: string
      onClick: () => void
    }
    duration?: number
  }) => {
    return sonnerToast.warning(message, {
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 5000,
    })
  },

  /**
   * Show a loading toast
   */
  loading: (message: string, options?: {
    description?: string
    duration?: number
  }) => {
    return sonnerToast.loading(message, {
      description: options?.description,
      duration: options?.duration,
    })
  },

  /**
   * Show a promise toast that updates based on promise state
   */
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: Error) => string)
    }
  ) => {
    return sonnerToast.promise(promise, options)
  },

  /**
   * Dismiss a toast by ID
   */
  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId)
  },

  /**
   * Batch operation toasts
   */
  batch: {
    /**
     * Show toast for batch execution started
     */
    executionStarted: (batchName: string, totalJobs: number) => {
      return sonnerToast.info('Batch execution started', {
        description: `${batchName} - ${totalJobs} jobs queued`,
        duration: 3000,
      })
    },

    /**
     * Show toast for batch execution completed
     */
    executionCompleted: (batchName: string, stats: {
      totalJobs: number
      successJobs: number
      errorJobs: number
      duration: number
    }) => {
      const { totalJobs, successJobs, errorJobs, duration } = stats
      const durationMin = Math.floor(duration / 60000)
      const durationSec = Math.floor((duration % 60000) / 1000)
      const durationStr = durationMin > 0
        ? `${durationMin}m ${durationSec}s`
        : `${durationSec}s`

      if (errorJobs === 0) {
        return sonnerToast.success('Batch completed successfully', {
          description: `${batchName} - ${successJobs}/${totalJobs} jobs in ${durationStr}`,
          duration: 5000,
        })
      } else {
        return sonnerToast.warning('Batch completed with errors', {
          description: `${batchName} - ${successJobs} passed, ${errorJobs} failed (${durationStr})`,
          duration: 6000,
        })
      }
    },

    /**
     * Show toast for batch execution failed
     */
    executionFailed: (batchName: string, error: string) => {
      return sonnerToast.error('Batch execution failed', {
        description: `${batchName} - ${error}`,
        duration: 6000,
      })
    },

    /**
     * Show toast for batch paused
     */
    executionPaused: (batchName: string) => {
      return sonnerToast.info('Batch execution paused', {
        description: batchName,
        duration: 3000,
      })
    },

    /**
     * Show toast for batch resumed
     */
    executionResumed: (batchName: string) => {
      return sonnerToast.info('Batch execution resumed', {
        description: batchName,
        duration: 3000,
      })
    },
  },

  /**
   * Job operation toasts
   */
  job: {
    /**
     * Show toast for job completed
     */
    completed: (siteUrl: string, options?: {
      accuracy?: number
      onView?: () => void
    }) => {
      const description = options?.accuracy
        ? `${siteUrl} - ${options.accuracy}% accuracy`
        : siteUrl

      return sonnerToast.success('Job completed', {
        description,
        action: options?.onView ? {
          label: 'View',
          onClick: options.onView,
        } : undefined,
        duration: 4000,
      })
    },

    /**
     * Show toast for job failed
     */
    failed: (siteUrl: string, error: string, options?: {
      onRetry?: () => void
    }) => {
      return sonnerToast.error('Job failed', {
        description: `${siteUrl} - ${error}`,
        action: options?.onRetry ? {
          label: 'Retry',
          onClick: options.onRetry,
        } : undefined,
        duration: 6000,
      })
    },

    /**
     * Show toast for pattern detected
     */
    patternDetected: (pattern: string, count: number) => {
      return sonnerToast.warning('Error pattern detected', {
        description: `${pattern} occurred ${count} times`,
        duration: 5000,
      })
    },
  },

  /**
   * Export operation toasts
   */
  export: {
    /**
     * Show toast for export started
     */
    started: () => {
      return sonnerToast.loading('Exporting data...', {
        description: 'Preparing your export file',
      })
    },

    /**
     * Show toast for export completed
     */
    completed: (filename: string) => {
      return sonnerToast.success('Export completed', {
        description: `Downloaded ${filename}`,
        duration: 4000,
      })
    },

    /**
     * Show toast for export failed
     */
    failed: (error: string) => {
      return sonnerToast.error('Export failed', {
        description: error,
        duration: 5000,
      })
    },
  },
}
