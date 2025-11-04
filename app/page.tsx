'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Menu, Search, Filter, ChevronDown, Play, Pause, Settings, Eye, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/Table'
import { Badge } from '@/components/Badge'
import { CollapsiblePanel } from '@/components/CollapsiblePanel'
import { MenuSidebar } from '@/components/MenuSidebar'
import { ProjectInstructionsSidebar } from '@/components/ProjectInstructionsSidebar'
import { mockMenuData } from '@/lib/menu-data'
import { defaultInstructionsData } from '@/lib/project-instructions-data'

interface Job {
  id: string
  batchId: string
  projectId: string
  inputId: string
  siteUrl: string
  siteName: string | null
  goal: string
  status: 'queued' | 'running' | 'completed' | 'error'
  csvRowData: Record<string, any> | null
  groundTruthData: Record<string, any> | null
  hasGroundTruth: boolean
  isEvaluated: boolean
  evaluationResult: 'pass' | 'fail' | null
  createdAt: string
  updatedAt: string
  sessions?: Array<{
    id: string
    extractedData: Record<string, any> | null
    status: string
  }>
}

interface Execution {
  id: string
  batchId: string
  status: string
  totalJobs: number
  completedJobs: number
}

interface Project {
  id: string
  name: string
}

export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectIdFromUrl = searchParams.get('projectId')

  const [jobs, setJobs] = useState<Job[]>([])
  const [executions, setExecutions] = useState<Execution[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectIdFromUrl)
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [selectedCount, setSelectedCount] = useState(0)
  const [rangeSelectOpen, setRangeSelectOpen] = useState(false)
  const [rangeValue, setRangeValue] = useState('')
  const [stealthMode, setStealthMode] = useState(false)
  const [menuPanelOpen, setMenuPanelOpen] = useState(false)
  const [instructionsPanelOpen, setInstructionsPanelOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [evaluationFilter, setEvaluationFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<string>('status')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects')
        if (res.ok) {
          const data = await res.json()
          setProjects(data)
          // Auto-select first project if none selected
          if (!selectedProjectId && data.length > 0) {
            setSelectedProjectId(data[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
      }
    }
    fetchProjects()
  }, [])

  // Fetch jobs and executions when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch jobs
        const jobsRes = await fetch(`/api/projects/${selectedProjectId}/jobs`)
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json()
          setJobs(jobsData)
        }

        // Fetch executions
        const execRes = await fetch(`/api/projects/${selectedProjectId}/executions`)
        if (execRes.ok) {
          const execData = await execRes.json()
          setExecutions(execData)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    fetchData()

    // Poll for updates every 5 seconds if there are running jobs
    const interval = setInterval(() => {
      const hasRunningJobs = jobs.some(j => j.status === 'running' || j.status === 'queued')
      if (hasRunningJobs) {
        fetchData()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedProjectId])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Get data columns from first job's CSV data or extracted data
  const dataColumns = jobs.length > 0 && jobs[0].csvRowData
    ? Object.keys(jobs[0].csvRowData).filter(key => key !== 'url' && key !== 'URL' && !key.toLowerCase().includes('ground_truth'))
    : []

  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDirection('asc')
    }
  }

  // Filter and sort jobs
  const filteredJobs = jobs
    .filter(job => {
      if (statusFilter !== 'all' && job.status !== statusFilter) return false
      if (evaluationFilter !== 'all') {
        if (evaluationFilter === 'not_evaluated' && job.isEvaluated) return false
        if (evaluationFilter === 'pass' && job.evaluationResult !== 'pass') return false
        if (evaluationFilter === 'fail' && job.evaluationResult !== 'fail') return false
      }
      if (searchTerm && !job.inputId.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      // Priority sorting: running first, then completed, then others
      const statusPriority = { running: 0, completed: 1, queued: 2, error: 3 }
      const aPriority = statusPriority[a.status] ?? 4
      const bPriority = statusPriority[b.status] ?? 4

      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }

      // Then sort by selected column
      let comparison = 0
      if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status)
      } else if (sortBy === 'jobId') {
        comparison = a.inputId.localeCompare(b.inputId)
      } else if (sortBy === 'evaluation') {
        const aEval = a.evaluationResult || 'zzz'
        const bEval = b.evaluationResult || 'zzz'
        comparison = aEval.localeCompare(bEval)
      } else {
        // Sort by data column
        const aVal = String(a.sessions?.[0]?.extractedData?.[sortBy] || a.csvRowData?.[sortBy] || '')
        const bVal = String(b.sessions?.[0]?.extractedData?.[sortBy] || b.csvRowData?.[sortBy] || '')
        comparison = aVal.localeCompare(bVal)
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

  // Calculate stats
  const stats = {
    totalJobs: jobs.length,
    running: jobs.filter(j => j.status === 'running').length,
    queued: jobs.filter(j => j.status === 'queued').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    error: jobs.filter(j => j.status === 'error').length,
    groundTruth: jobs.filter(j => j.hasGroundTruth).length,
    evaluated: jobs.filter(j => j.isEvaluated).length,
    pass: jobs.filter(j => j.evaluationResult === 'pass').length,
    fail: jobs.filter(j => j.evaluationResult === 'fail').length,
    passRate: jobs.filter(j => j.isEvaluated).length > 0
      ? Math.round((jobs.filter(j => j.evaluationResult === 'pass').length / jobs.filter(j => j.isEvaluated).length) * 100)
      : 0
  }

  // Run all jobs function
  const handleRunAllJobs = async () => {
    if (!selectedProjectId) return

    try {
      // Find the first batch for this project
      const batch = jobs[0]?.batchId
      if (!batch) {
        alert('No batch found for this project')
        return
      }

      const response = await fetch(`/api/projects/${selectedProjectId}/batches/${batch}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleSize: jobs.length })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Started execution for ${data.jobIds?.length || 0} jobs`)
        // Refresh data
        window.location.reload()
      } else {
        alert('Failed to start execution')
      }
    } catch (error) {
      console.error('Error running jobs:', error)
      alert('Error running jobs')
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Top Header Bar */}
      <header className="border-b border-stone-200 bg-white shadow-fintech-sm sticky top-0 z-20">
        <div className="px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMenuPanelOpen(true)}
                className="lg:flex"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="text-xl font-semibold text-stone-900">MINO</div>

              {/* Project Selector */}
              {projects.length > 0 && (
                <div className="ml-4">
                  <Select
                    value={selectedProjectId || ''}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    size="sm"
                    className="min-w-[200px]"
                  >
                    <option value="">Select Project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInstructionsPanelOpen(true)}
                className="hidden lg:flex"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <span className="text-sm text-stone-600 hidden sm:inline">Jane Cher</span>
              <div className="h-9 w-9 rounded-full bg-amber-600 flex items-center justify-center text-white text-sm font-medium">
                JC
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full Width */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Content Header */}
          <div className="border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold text-stone-900">
                {projects.find(p => p.id === selectedProjectId)?.name || 'Jobs'}
              </h1>
              <span className="text-sm text-stone-500">
                {loading ? 'Loading...' : `${filteredJobs.length} jobs`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => selectedProjectId && router.push(`/projects/${selectedProjectId}/batches/new`)}
                disabled={!selectedProjectId}
              >
                Upload CSV
              </Button>
              <Button variant="outline" size="sm">
                Export
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="px-4 sm:px-6 py-4 lg:py-5 space-y-4 lg:space-y-5">
              {/* Stats Grid */}
              <div className={`transition-fintech ${isScrolled ? 'bg-white border border-stone-200 rounded-lg p-4 shadow-fintech-sm' : 'grid grid-cols-1 md:grid-cols-3 gap-4'}`}>
                {isScrolled ? (
                  // Collapsed view
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-xs text-stone-500">Total Jobs</span>
                        <div className="font-semibold text-lg text-stone-900">{stats.totalJobs.toLocaleString()}</div>
                      </div>
                      <div className="h-8 w-px bg-stone-200" />
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-stone-600">Completed: <strong className="text-stone-900">{stats.completed.toLocaleString()}</strong></span>
                        <span className="text-stone-600">Error: <strong className="text-stone-900">{stats.error.toLocaleString()}</strong></span>
                      </div>
                      <div className="h-8 w-px bg-stone-200" />
                      <div>
                        <span className="text-xs text-stone-500">Ground Truth</span>
                        <div className="font-semibold text-lg text-stone-900">{stats.groundTruth}</div>
                      </div>
                      <span className="text-sm text-stone-600">
                        Pass Rate: <strong className="text-stone-900">{stats.passRate}%</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-stone-600 whitespace-nowrap">
                        Concurrency:
                      </label>
                      <Input type="number" defaultValue="20" size="sm" className="w-16" />
                      <Button size="sm" onClick={handleRunAllJobs}>
                        <Play className="h-3 w-3 mr-1" />
                        Run All
                      </Button>
                      <Button size="sm" variant="outline">
                        <Pause className="h-3 w-3 mr-1" />
                        Pause All
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Expanded view
                  <>
                    <div className="md:col-span-2">
                      <Card>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                            Total Jobs
                          </h3>
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-stone-600 whitespace-nowrap">
                              Concurrency:
                            </label>
                            <Input type="number" defaultValue="20" size="sm" className="w-20" />
                            <Button size="sm" onClick={handleRunAllJobs}>
                              <Play className="h-4 w-4 mr-1" />
                              Run All
                            </Button>
                            <Button size="sm" variant="outline">
                              <Pause className="h-4 w-4 mr-1" />
                              Pause All
                            </Button>
                          </div>
                        </div>
                        <div className="metric-large mb-6 text-stone-900">{stats.totalJobs.toLocaleString()}</div>
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-stone-500 mb-1">Running</div>
                            <div className="text-lg font-semibold text-stone-900">{stats.running} ({stats.totalJobs > 0 ? Math.round((stats.running / stats.totalJobs) * 100) : 0}%)</div>
                          </div>
                          <div>
                            <div className="text-xs text-stone-500 mb-1">Queued</div>
                            <div className="text-lg font-semibold text-stone-900">{stats.queued} ({stats.totalJobs > 0 ? Math.round((stats.queued / stats.totalJobs) * 100) : 0}%)</div>
                          </div>
                          <div>
                            <div className="text-xs text-stone-500 mb-1">Completed</div>
                            <div className="text-lg font-semibold text-green-600">{stats.completed.toLocaleString()} ({stats.totalJobs > 0 ? Math.round((stats.completed / stats.totalJobs) * 100) : 0}%)</div>
                          </div>
                          <div>
                            <div className="text-xs text-stone-500 mb-1">Error</div>
                            <div className="text-lg font-semibold text-red-600">{stats.error.toLocaleString()} ({stats.totalJobs > 0 ? Math.round((stats.error / stats.totalJobs) * 100) : 0}%)</div>
                          </div>
                        </div>
                      </Card>
                    </div>

                    <Card>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                          Ground Truth
                        </h3>
                        <Button size="sm" variant="success">
                          Set Expected
                        </Button>
                      </div>
                      <div className="metric-large text-green-600 mb-6">{stats.groundTruth}</div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-600">Evaluated</span>
                          <span className="font-semibold text-stone-900">{stats.evaluated}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-600">Pass</span>
                          <span className="font-semibold text-green-600">{stats.pass}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-600">Fail</span>
                          <span className="font-semibold text-red-600">{stats.fail}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-3 border-t border-stone-200">
                          <span className="text-stone-600">Pass Rate</span>
                          <span className="font-semibold text-stone-900">{stats.passRate}%</span>
                        </div>
                      </div>
                    </Card>
                  </>
                )}
              </div>

              {/* Filters and Actions */}
              <div className="mb-6 lg:mb-8">
                <div className="flex items-center gap-3 lg:gap-4 mb-4 lg:mb-5 flex-wrap">
                  {/* Filters Toggle */}
                  <button
                    onClick={() => setFiltersOpen(!filtersOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-stone-100 rounded-lg transition-fintech text-sm font-medium text-stone-700 min-h-[44px]"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                    <ChevronDown className={`h-4 w-4 transition-fintech ${filtersOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Selection Controls */}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">Select All</Button>
                    <span className="text-stone-700">|</span>
                    <Button variant="ghost" size="sm">Deselect All</Button>
                    {!rangeSelectOpen ? (
                      <Button variant="outline" size="sm" onClick={() => setRangeSelectOpen(true)}>
                        Select Range
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setRangeSelectOpen(false)}>
                          Hide Range
                        </Button>
                        <Input
                          placeholder="e.g., 10-1000 or 1,5,10-20"
                          value={rangeValue}
                          onChange={(e) => setRangeValue(e.target.value)}
                          size="sm"
                          className="w-64"
                        />
                        <Button size="sm">Apply</Button>
                      </div>
                    )}
                    <Button variant="success" size="sm">
                      Edit Expected Values
                    </Button>
                  </div>

                  {/* Selected Actions */}
                  {selectedCount > 0 && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Button size="sm">
                        Run Selected ({selectedCount})
                      </Button>
                      <Button size="sm" variant="success">
                        Evaluate Selected ({selectedCount})
                      </Button>
                    </div>
                  )}
                </div>

                {/* Filter Dropdowns */}
                {filtersOpen && (
                  <div className="flex gap-4 items-center p-5 lg:p-6 bg-stone-100 rounded-lg flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        size="md"
                      >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="error">Error</option>
                        <option value="running">Running</option>
                        <option value="queued">Queued</option>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <Select
                        value={evaluationFilter}
                        onChange={(e) => setEvaluationFilter(e.target.value)}
                        size="md"
                      >
                        <option value="all">All Evaluation</option>
                        <option value="pass">Pass</option>
                        <option value="fail">Fail</option>
                        <option value="not_evaluated">Not Evaluated</option>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[300px] relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-600 pointer-events-none" />
                      <Input
                        placeholder="Search by Input ID"
                        size="md"
                        className="pl-11"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Data Table */}
              {loading ? (
                <Card className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                  <p className="text-stone-600">Loading jobs...</p>
                </Card>
              ) : filteredJobs.length === 0 ? (
                <Card className="text-center py-12">
                  <p className="text-stone-600">No jobs found</p>
                  {!selectedProjectId && projects.length > 0 && (
                    <p className="text-sm text-stone-500 mt-2">Select a project to view jobs</p>
                  )}
                </Card>
              ) : (
                <Card className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <input type="checkbox" className="rounded border-stone-300 text-amber-600 focus:ring-amber-600" />
                        </TableHead>
                        <TableHead
                          onClick={() => handleSort('status')}
                          className="cursor-pointer hover:bg-stone-50"
                        >
                          <div className="flex items-center gap-1">
                            Status
                            {sortBy === 'status' && (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>View Job</TableHead>
                        <TableHead
                          onClick={() => handleSort('jobId')}
                          className="cursor-pointer hover:bg-stone-50"
                        >
                          <div className="flex items-center gap-1">
                            JOB ID
                            {sortBy === 'jobId' && (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            )}
                          </div>
                        </TableHead>
                        {dataColumns.map(col => (
                          <TableHead
                            key={col}
                            onClick={() => handleSort(col)}
                            className="cursor-pointer hover:bg-stone-50"
                          >
                            <div className="flex items-center gap-1">
                              {col}
                              {sortBy === col && (
                                sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                              )}
                            </div>
                          </TableHead>
                        ))}
                        <TableHead
                          onClick={() => handleSort('evaluation')}
                          className="cursor-pointer hover:bg-stone-50"
                        >
                          <div className="flex items-center gap-1">
                            Evaluation
                            {sortBy === 'evaluation' && (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            )}
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJobs.map((job) => {
                        // Get extracted data from the latest session
                        const latestSession = job.sessions?.[0]
                        const extractedData = latestSession?.extractedData || {}
                        const csvData = job.csvRowData || {}

                        return (
                          <TableRow
                            key={job.id}
                            className="cursor-pointer hover:bg-stone-50"
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox" className="rounded border-stone-300 text-amber-600 focus:ring-amber-600" />
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                job.status === 'completed' ? 'success' :
                                job.status === 'error' ? 'danger' :
                                job.status === 'running' ? 'warning' :
                                'default'
                              }>
                                {job.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/projects/${job.projectId}/jobs/${job.id}`)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-stone-900">
                              {job.inputId}
                            </TableCell>
                            {dataColumns.map(col => {
                              // Show extracted data if available, otherwise show CSV data, otherwise show dash
                              const value = extractedData[col] || csvData[col] || '-'
                              const gtValue = job.groundTruthData?.[col]
                              const matches = gtValue != null && String(value).toLowerCase() === String(gtValue).toLowerCase()

                              return (
                                <TableCell
                                  key={col}
                                  className={matches ? 'text-green-700 font-medium' : 'text-stone-900'}
                                >
                                  {String(value)}
                                  {gtValue != null && !matches && (
                                    <span className="block text-xs text-stone-500">
                                      Expected: {String(gtValue)}
                                    </span>
                                  )}
                                </TableCell>
                              )
                            })}
                            <TableCell>
                              {job.isEvaluated ? (
                                <Badge variant={job.evaluationResult === 'pass' ? 'success' : 'danger'}>
                                  {job.evaluationResult}
                                </Badge>
                              ) : (
                                <span className="text-stone-500 text-xs">Not evaluated</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Slide-out Panels */}
      <CollapsiblePanel
        position="left"
        title="Menu"
        width="w-80"
        isOpen={menuPanelOpen}
        onClose={() => setMenuPanelOpen(false)}
      >
        <MenuSidebar
          projects={mockMenuData}
          stealthMode={stealthMode}
          onStealthToggle={setStealthMode}
        />
      </CollapsiblePanel>

      <CollapsiblePanel
        position="right"
        title="Project Instructions"
        width="w-96"
        isOpen={instructionsPanelOpen}
        onClose={() => setInstructionsPanelOpen(false)}
      >
        <ProjectInstructionsSidebar
          data={defaultInstructionsData}
          showActions={false}
        />
      </CollapsiblePanel>
    </div>
  )
}
