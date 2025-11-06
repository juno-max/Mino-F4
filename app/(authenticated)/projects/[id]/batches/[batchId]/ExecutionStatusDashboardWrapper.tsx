'use client'

/**
 * Client wrapper for ExecutionStatusDashboard to handle state
 */

import { useState } from 'react'
import { ExecutionStatusDashboard } from '@/components/batch-dashboard/ExecutionStatusDashboard'

export interface ExecutionStatusDashboardWrapperProps {
  totalJobs: number
  completedJobs: number
  failedJobs: number
  queuedJobs: number
  runningJobs: number
}

export function ExecutionStatusDashboardWrapper({
  totalJobs,
  completedJobs,
  failedJobs,
  queuedJobs,
  runningJobs,
}: ExecutionStatusDashboardWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [currentFilter, setCurrentFilter] = useState('all')

  return (
    <ExecutionStatusDashboard
      totalJobs={totalJobs}
      completedJobs={completedJobs}
      failedJobs={failedJobs}
      queuedJobs={queuedJobs}
      runningJobs={runningJobs}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      onStatusClick={setCurrentFilter}
      currentFilter={currentFilter}
    />
  )
}
