# JOBS TABLE OPTIMIZATION - Jobs-to-be-Done (JTBD) Framework

**Date**: 2025-11-06
**Goal**: Redesign jobs table based on what users actually need to accomplish
**Principle**: Optimize for user goals, not technical data structure

---

## PART 1: USER JOBS-TO-BE-DONE ANALYSIS

### Primary Jobs Users Need to Accomplish

When a user looks at the jobs table, they want to:

1. **"Help me understand what's happening right now"**
   - Which jobs are actively running?
   - What's the overall progress?
   - Are there any problems I need to address?
   - **Priority**: CRITICAL - Users check this first

2. **"Show me what needs my attention"**
   - Which jobs failed and why?
   - Which jobs are blocked (CAPTCHA, login, etc.)?
   - Which jobs have low accuracy (<80%)?
   - Which jobs are taking too long?
   - **Priority**: CRITICAL - Action required

3. **"Let me see if the data extraction worked"**
   - What data was extracted from this job?
   - Does it match the ground truth?
   - Which fields are missing?
   - Is the data quality acceptable?
   - **Priority**: HIGH - Validation workflow

4. **"Help me find a specific job"**
   - Search by website URL
   - Filter by status (completed, failed, etc.)
   - Filter by accuracy level
   - Sort by various criteria
   - **Priority**: HIGH - Navigation

5. **"Let me take action on job(s)"**
   - Retry failed jobs
   - Export results
   - Mark as reviewed
   - Fix/verify ground truth
   - Bulk operations
   - **Priority**: MEDIUM - Workflow completion

6. **"Show me the input that was provided"**
   - What was the original URL/data?
   - What CSV row data exists?
   - What instructions were given?
   - **Priority**: LOW - Debugging context

### Secondary Jobs (Less Frequent)

7. **"Compare multiple jobs"**
   - See differences in extraction quality
   - Compare failed vs successful patterns
   - **Priority**: LOW - Analysis

8. **"Track execution performance"**
   - How long did each job take?
   - Which sites are slow?
   - **Priority**: LOW - Optimization

---

## PART 2: OPTIMAL INFORMATION HIERARCHY

Based on JTBD, here's the optimal order users should see information:

### Level 1: INSTANT RECOGNITION (0-100ms glance)
**Goal**: User scans table and immediately knows status

1. **Status Indicator** (leftmost, highly visible)
   - Visual: Color-coded dot with animation
   - Colors: Green (success), Red (failed), Blue (running, animated), Orange (blocked), Gray (queued)
   - Size: 12px, impossible to miss
   - Position: First column, before everything

2. **Website Identity** (primary identifier)
   - Large: Site name OR domain (whichever is clearer)
   - Format: "Amazon" or "amazon.com"
   - Style: Bold, 16px
   - Position: Second column, left-aligned

### Level 2: QUICK ASSESSMENT (100-500ms scan)
**Goal**: User understands if action needed

3. **Progress/Outcome** (immediate feedback)
   - Running: Progress bar + percentage + current step
   - Completed: Checkmark + completion percentage (85% complete)
   - Failed: X icon + error reason
   - Blocked: Lock icon + block reason (CAPTCHA, Login Required, etc.)
   - Format: Icon + Text + Bar (for running)
   - Position: Third column, 200px width

4. **Data Quality** (for completed jobs)
   - Accuracy: Large percentage with colored badge (100%, 85%, 45%)
   - Missing Fields: "3 of 15 fields missing" (if applicable)
   - Visual: Green ≥90%, Yellow 70-89%, Red <70%
   - Position: Fourth column, 150px width

### Level 3: DATA PREVIEW (500ms-2s examination)
**Goal**: User sees actual extracted data

5. **Key Output Fields** (most important data)
   - Show 3-4 most important extracted fields
   - Format: "Price: $49.99 | Rating: 4.5 ★ | Stock: In Stock"
   - Truncate to 40 chars each
   - Ground truth comparison icons (✓ × ⚠)
   - Position: Fifth column, flex-grow

### Level 4: CONTEXT & ACTIONS (on-demand)
**Goal**: User gets details or takes action

6. **Duration** (performance context)
   - Format: "2m 30s" or "45s"
   - Color: Green <1min, Yellow 1-5min, Red >5min
   - Position: Sixth column, 80px, right-aligned

7. **Actions Menu** (hover/focus)
   - Format: 3-dot menu icon
   - Reveals: View Details, Retry, Export, View Live (for running)
   - Position: Rightmost column, 60px

### Level 5: FULL DETAILS (expand or modal)
**Goal**: User inspects complete data

8. **Expandable Row** OR **Quick View Modal**
   - Full extracted data (all fields)
   - Ground truth comparison
   - Input data (CSV row)
   - Execution timeline
   - Screenshots
   - Error details

---

## PART 3: REDESIGNED TABLE STRUCTURE

### Column Layout (Optimized for JTBD)

```
┌──────┬──────────────────┬────────────────────────┬────────────┬──────────────────────────────────┬──────────┬─────────┐
│Status│ Website          │ Progress/Outcome       │ Accuracy   │ Key Data Preview                 │ Duration │ Actions │
├──────┼──────────────────┼────────────────────────┼────────────┼──────────────────────────────────┼──────────┼─────────┤
│ 🟢   │ Amazon Product   │ ✓ 100% Complete        │ 95% ✓      │ Price: $49.99 ✓ | Rating: 4.5 ✓ │ 1m 23s   │ •••     │
│      │ amazon.com/...   │ 15/15 fields           │            │ Stock: In Stock ✓                │          │         │
├──────┼──────────────────┼────────────────────────┼────────────┼──────────────────────────────────┼──────────┼─────────┤
│ 🔵   │ Best Buy Store   │ ⟳ 45% Running...       │ —          │ Extracting pricing...            │ 34s      │ 👁 Live │
│      │ bestbuy.com/...  │ Current: Getting price │            │                                  │          │         │
├──────┼──────────────────┼────────────────────────┼────────────┼──────────────────────────────────┼──────────┼─────────┤
│ 🔴   │ Target Listing   │ ✗ Failed               │ —          │ Error: Page timeout after 60s    │ 1m 02s   │ 🔄 Retry│
│      │ target.com/...   │ TIMEOUT                │            │                                  │          │         │
├──────┼──────────────────┼────────────────────────┼────────────┼──────────────────────────────────┼──────────┼─────────┤
│ 🟠   │ Walmart Page     │ 🔒 Blocked by CAPTCHA  │ —          │ Cannot proceed: CAPTCHA detected │ 12s      │ •••     │
│      │ walmart.com/...  │                        │            │                                  │          │         │
├──────┼──────────────────┼────────────────────────┼────────────┼──────────────────────────────────┼──────────┼─────────┤
│ 🟢   │ Etsy Shop        │ ⚠ 67% Partial          │ 67% ⚠      │ Price: $29.99 ✓ | Rating: — ×   │ 2m 45s   │ •••     │
│      │ etsy.com/...     │ 10/15 fields           │            │ Stock: — × | Seller: Shop1 ✓     │          │         │
└──────┴──────────────────┴────────────────────────┴────────────┴──────────────────────────────────┴──────────┴─────────┘
```

### Column Specifications

#### 1. Status Column (60px)
```typescript
interface StatusColumn {
  width: '60px'
  content: {
    dot: {
      size: '12px'
      colors: {
        success: 'bg-green-500'       // Completed successfully
        running: 'bg-blue-500 animate-pulse'  // Currently running
        failed: 'bg-red-500'          // Failed/error
        blocked: 'bg-orange-500'      // Blocked (CAPTCHA, etc.)
        queued: 'bg-gray-400'         // Waiting
        partial: 'bg-yellow-500'      // Partial completion
      }
    }
    checkbox: {
      position: 'bottom-left'
      size: '16px'
      showOnHover: true  // Only show when row hovered or selected
    }
  }
}
```

#### 2. Website Column (240px)
```typescript
interface WebsiteColumn {
  width: '240px'
  content: {
    primary: job.siteName || extractDomain(job.siteUrl)  // "Amazon Product"
    primaryStyle: {
      fontSize: '15px'
      fontWeight: 600
      color: 'text-gray-900'
      truncate: true
      maxWidth: '220px'
    }
    secondary: truncateMiddle(job.siteUrl, 35)  // "amazon.com/.../dp/B0..."
    secondaryStyle: {
      fontSize: '13px'
      color: 'text-gray-500'
      truncate: true
    }
    icon: {
      type: 'favicon'  // Show site favicon if available
      size: '16px'
      position: 'left'
    }
  }
}
```

#### 3. Progress/Outcome Column (280px)
```typescript
interface ProgressOutcomeColumn {
  width: '280px'
  content: {
    // Different display based on status
    running: {
      progressBar: {
        percentage: job.progressPercentage  // 0-100
        color: 'bg-blue-500'
        height: '6px'
        showPercentage: true
      }
      currentStep: {
        text: job.currentStep  // "Getting price information..."
        style: 'text-sm text-gray-600'
        truncate: true
        maxLength: 35
      }
    }
    completed: {
      icon: 'CheckCircle'
      color: 'text-green-600'
      text: `${job.completionPercentage}% Complete`
      subtext: `${job.fieldsExtracted.length}/${totalFields} fields`
    }
    failed: {
      icon: 'XCircle'
      color: 'text-red-600'
      text: 'Failed'
      subtext: job.detailedStatus  // "TIMEOUT", "NETWORK_ERROR", etc.
    }
    blocked: {
      icon: 'Lock'
      color: 'text-orange-600'
      text: 'Blocked'
      subtext: formatBlockedReason(job.blockedReason)  // "CAPTCHA Required"
    }
    partial: {
      icon: 'AlertTriangle'
      color: 'text-yellow-600'
      text: `${job.completionPercentage}% Partial`
      subtext: `${job.fieldsMissing.length} fields missing`
    }
  }
}
```

#### 4. Accuracy Column (120px, only for completed/partial)
```typescript
interface AccuracyColumn {
  width: '120px'
  display: job.status === 'completed' || job.status === 'partial'
  content: {
    percentage: calculateAccuracy(job)  // 0-100
    badge: {
      colors: {
        high: 'bg-green-100 text-green-800 border-green-300'   // ≥90%
        medium: 'bg-yellow-100 text-yellow-800 border-yellow-300'  // 70-89%
        low: 'bg-red-100 text-red-800 border-red-300'  // <70%
      }
      format: '95%'
      icon: accuracy >= 90 ? '✓' : accuracy >= 70 ? '⚠' : '×'
    }
    subtext: hasGroundTruth ? `${matches}/${total} match` : null
  }
}
```

#### 5. Key Data Preview Column (flex-grow, min 300px)
```typescript
interface DataPreviewColumn {
  width: 'flex-grow'
  minWidth: '300px'
  content: {
    // Show 3-4 most important fields based on columnSchema
    fields: getMostImportantFields(job, columnSchema, 3)
    format: {
      display: 'inline'
      separator: ' | '
      each: {
        label: field.name + ':'
        value: truncate(field.value, 40)
        icon: hasGroundTruth ? getValidationIcon(field) : null
        // Icons: ✓ (match), × (mismatch), ⚠ (no GT), — (empty)
      }
    }
    examples: [
      'Price: $49.99 ✓ | Rating: 4.5 ★ ✓ | Stock: In Stock ✓',
      'Title: Product Name ✓ | Price: — × | Description: Lorem ipsum...',
      'Error: Page timeout after 60s',
      'Extracting pricing information...'
    ]
  }
}
```

#### 6. Duration Column (90px, right-aligned)
```typescript
interface DurationColumn {
  width: '90px'
  align: 'right'
  content: {
    duration: formatDuration(job.executionDurationMs)
    format: {
      short: '<1min' → 'XXs',
      medium: '1-60min' → 'Xm XXs',
      long: '>60min' → 'Xh Xm'
    }
    colors: {
      fast: 'text-green-600'     // <1 minute
      medium: 'text-yellow-600'  // 1-5 minutes
      slow: 'text-red-600'       // >5 minutes
      running: 'text-blue-600'   // Still running (live timer)
    }
    showTimer: job.status === 'running'  // Live updating timer
  }
}
```

#### 7. Actions Column (80px, right-aligned)
```typescript
interface ActionsColumn {
  width: '80px'
  align: 'right'
  content: {
    primary: {
      // Different primary action based on status
      running: {
        icon: 'Eye',
        label: 'Live',
        action: 'openLiveStream',
        color: 'text-blue-600'
      }
      completed: {
        icon: 'MoreVertical',
        label: '•••',
        action: 'openMenu'
      }
      failed: {
        icon: 'RotateCw',
        label: 'Retry',
        action: 'retryJob',
        color: 'text-orange-600'
      }
      blocked: {
        icon: 'MoreVertical',
        label: '•••',
        action: 'openMenu'
      }
    }
    menu: {
      items: [
        { icon: 'Eye', label: 'View Details', action: 'navigate' },
        { icon: 'ExternalLink', label: 'Open Site', action: 'openUrl' },
        { icon: 'Copy', label: 'Copy URL', action: 'copy' },
        { icon: 'RotateCw', label: 'Retry', action: 'retry', show: canRetry },
        { icon: 'Download', label: 'Export', action: 'export' },
        { divider: true },
        { icon: 'Trash2', label: 'Delete', action: 'delete', danger: true }
      ]
    }
  }
}
```

---

## PART 4: ENHANCED FILTERING & SEARCH

### Smart Filter Presets (Based on JTBD)

```typescript
interface SmartFilters {
  presets: [
    {
      id: 'needs-attention',
      label: '⚠️ Needs Attention',
      description: 'Failed, blocked, or low accuracy jobs',
      count: getCount(job =>
        job.status === 'failed' ||
        job.status === 'blocked' ||
        (job.accuracy && job.accuracy < 80)
      ),
      color: 'red',
      priority: 1
    },
    {
      id: 'running',
      label: '▶️ Running',
      description: 'Currently executing',
      count: getCount(job => job.status === 'running'),
      color: 'blue',
      priority: 2,
      liveUpdate: true
    },
    {
      id: 'completed-perfect',
      label: '✓ Perfect',
      description: '100% accuracy',
      count: getCount(job => job.completionPercentage === 100 && job.accuracy === 100),
      color: 'green',
      priority: 3
    },
    {
      id: 'partial',
      label: '⚡ Partial',
      description: 'Missing some fields',
      count: getCount(job => job.completionPercentage < 100 && job.completionPercentage > 0),
      color: 'yellow',
      priority: 4
    },
    {
      id: 'all',
      label: '📋 All Jobs',
      description: 'Show everything',
      count: jobs.length,
      color: 'gray',
      priority: 5
    }
  ]
}
```

### Advanced Filters Panel

```typescript
interface AdvancedFilters {
  sections: {
    status: {
      label: 'Status',
      options: [
        { value: 'running', label: 'Running', icon: 'Play', count: X },
        { value: 'completed', label: 'Completed', icon: 'CheckCircle', count: X },
        { value: 'failed', label: 'Failed', icon: 'XCircle', count: X },
        { value: 'blocked', label: 'Blocked', icon: 'Lock', count: X },
        { value: 'queued', label: 'Queued', icon: 'Clock', count: X },
        { value: 'partial', label: 'Partial', icon: 'AlertTriangle', count: X }
      ],
      multiSelect: true
    },
    accuracy: {
      label: 'Accuracy',
      type: 'range',
      min: 0,
      max: 100,
      step: 5,
      presets: [
        { label: 'High (≥90%)', value: [90, 100] },
        { label: 'Medium (70-89%)', value: [70, 89] },
        { label: 'Low (<70%)', value: [0, 69] }
      ]
    },
    duration: {
      label: 'Duration',
      options: [
        { value: 'fast', label: '< 1 minute', icon: 'Zap' },
        { value: 'medium', label: '1-5 minutes', icon: 'Clock' },
        { value: 'slow', label: '> 5 minutes', icon: 'AlertCircle' }
      ]
    },
    blockReason: {
      label: 'Block Reason',
      show: hasBlockedJobs,
      options: [
        { value: 'captcha', label: 'CAPTCHA', icon: 'Shield' },
        { value: 'login_required', label: 'Login Required', icon: 'LogIn' },
        { value: 'paywall', label: 'Paywall', icon: 'CreditCard' },
        { value: 'geo_blocked', label: 'Geo-blocked', icon: 'Globe' },
        { value: 'rate_limited', label: 'Rate Limited', icon: 'Activity' }
      ]
    },
    missingFields: {
      label: 'Missing Fields',
      type: 'multi-select',
      options: getAllFieldNames(columnSchema).map(field => ({
        value: field,
        label: field,
        count: countJobsMissingField(field)
      }))
    }
  }
}
```

### Search Enhancement

```typescript
interface EnhancedSearch {
  placeholder: 'Search by URL, domain, or job ID...',
  searchIn: [
    'siteUrl',
    'siteName',
    'inputId',
    'jobId',
    'extractedData'  // NEW: Search in extracted data values
  ],
  fuzzyMatch: true,  // Allow typos
  suggestions: true,  // Show common searches
  recentSearches: true,  // Show last 5 searches
  saveSearch: true  // Allow saving search queries
}
```

---

## PART 5: BULK ACTIONS OPTIMIZATION

### Selection Model

```typescript
interface SelectionModel {
  // Single selection: Click row
  singleClick: 'navigate' | 'select' | 'expand'  // User preference

  // Multi-selection modes
  modes: {
    checkbox: 'Click checkbox to select',
    shift: 'Shift+click to select range',
    cmd: 'Cmd+click to toggle selection',
    all: 'Select All button'
  }

  // Smart selection
  smartSelect: {
    'Select all needs-attention': 'Select failed + blocked + low accuracy',
    'Select all completed': 'Select all completed jobs',
    'Select all with missing fields': 'Select jobs missing specific field'
  }
}
```

### Bulk Actions Toolbar

```typescript
interface BulkActionsToolbar {
  position: 'sticky-top',  // Sticks when scrolling
  show: selectedJobs.length > 0,
  content: {
    left: {
      count: `${selectedJobs.length} selected`,
      clearButton: 'Deselect All'
    },
    center: {
      actions: [
        {
          icon: 'Download',
          label: 'Export',
          action: 'exportSelected',
          formats: ['CSV', 'JSON', 'Excel']
        },
        {
          icon: 'RotateCw',
          label: 'Retry',
          action: 'retrySelected',
          show: selectedJobs.some(j => canRetry(j)),
          confirm: true
        },
        {
          icon: 'CheckSquare',
          label: 'Mark Reviewed',
          action: 'markReviewed',
          show: hasGroundTruth
        },
        {
          icon: 'Edit',
          label: 'Bulk Edit',
          action: 'openBulkEdit',
          show: hasGroundTruth
        },
        {
          icon: 'Trash2',
          label: 'Delete',
          action: 'deleteSelected',
          confirm: true,
          danger: true
        }
      ]
    }
  }
}
```

---

## PART 6: EXPANDABLE ROW DESIGN

### When to Show Expanded View

```typescript
interface ExpandableRow {
  trigger: 'click-chevron' | 'double-click-row' | 'keyboard-arrow',

  expandedContent: {
    layout: '2-column',  // Left: Details, Right: Preview

    leftColumn: {
      sections: [
        {
          title: 'Extracted Data',
          content: 'AllFieldsGrid'  // All extracted fields with GT comparison
        },
        {
          title: 'Input Data',
          content: 'CSVRowData',  // Original CSV row
          collapsible: true,
          defaultCollapsed: true
        },
        {
          title: 'Execution Details',
          content: {
            duration: formatDuration(job.executionDurationMs),
            startedAt: formatTime(job.startedAt),
            completedAt: formatTime(job.completedAt),
            retryCount: job.retryCount,
            sessionNumber: job.sessionNumber
          }
        }
      ]
    },

    rightColumn: {
      tabs: [
        {
          id: 'screenshot',
          label: 'Screenshot',
          content: 'ScreenshotViewer',  // Final screenshot
          default: true
        },
        {
          id: 'timeline',
          label: 'Timeline',
          content: 'ExecutionTimeline'  // Step-by-step execution
        },
        {
          id: 'error',
          label: 'Error Details',
          content: 'ErrorDisplay',
          show: job.status === 'failed'
        }
      ]
    },

    footer: {
      actions: [
        { label: 'View Full Details', action: 'navigate', primary: true },
        { label: 'Retry Job', action: 'retry', show: canRetry },
        { label: 'Export', action: 'export' }
      ]
    }
  }
}
```

### All Fields Grid (in expanded row)

```typescript
interface AllFieldsGrid {
  layout: 'grid',
  columns: 2,  // 2-column grid
  fields: columnSchema.map(col => ({
    label: col.name,
    value: job.extractedData?.[col.name],
    groundTruth: job.groundTruthData?.[col.name],
    comparison: {
      show: hasGroundTruth,
      match: value === groundTruth,
      icon: getValidationIcon(match),
      colors: {
        match: 'bg-green-50 border-green-200',
        mismatch: 'bg-red-50 border-red-200',
        noGT: 'bg-gray-50 border-gray-200',
        noValue: 'bg-gray-50 border-gray-200'
      }
    },
    actions: hasGroundTruth ? [
      { icon: 'Check', label: 'Accept as GT', action: 'acceptAsGroundTruth' },
      { icon: 'X', label: 'Mark Wrong', action: 'markWrong' },
      { icon: 'Edit', label: 'Edit', action: 'editField' }
    ] : null
  }))
}
```

---

## PART 7: REAL-TIME UPDATES & LIVE MONITORING

### WebSocket Integration

```typescript
interface RealTimeUpdates {
  // Connect to WebSocket for live updates
  connection: {
    url: 'ws://localhost:3001/ws',
    reconnect: true,
    heartbeat: 30000  // 30s ping
  },

  // Subscribe to batch updates
  subscribe: {
    topic: `batch:${batchId}:jobs`,
    events: [
      'job:status-changed',
      'job:progress-updated',
      'job:completed',
      'job:failed',
      'job:started'
    ]
  },

  // Update handling
  onUpdate: (event) => {
    // Optimistic UI update
    updateJobInTable(event.jobId, event.data)

    // Show toast for important events
    if (event.type === 'job:completed') {
      toast.success(`Job completed: ${event.data.siteName}`)
    }
    if (event.type === 'job:failed') {
      toast.error(`Job failed: ${event.data.siteName}`, {
        action: { label: 'Retry', onClick: () => retryJob(event.jobId) }
      })
    }
  },

  // Visual indicators
  indicators: {
    // Animated dot for running jobs
    runningAnimation: 'pulse',

    // Live progress bar updates
    progressBar: 'smooth-transition',

    // Row highlight on update
    updateFlash: 'bg-blue-50 duration-300',

    // Connection status indicator
    connectionStatus: {
      connected: 'Connected • Live updates active',
      disconnected: 'Disconnected • Polling every 5s',
      position: 'top-right'
    }
  }
}
```

### Live Job Monitoring

```typescript
interface LiveJobMonitoring {
  // Click "Live" button on running job
  trigger: 'click-live-button',

  // Opens drawer/modal with live stream
  display: 'drawer',  // Side drawer, doesn't leave page

  content: {
    header: {
      title: job.siteName || job.siteUrl,
      status: 'Running',
      progress: job.progressPercentage,
      timer: 'Live updating elapsed time'
    },

    body: {
      sections: [
        {
          title: 'Live Browser Stream',
          content: 'iframe',  // job.streamingUrl
          height: '400px'
        },
        {
          title: 'Current Step',
          content: job.currentStep,
          update: 'live'  // Updates in real-time
        },
        {
          title: 'Progress',
          content: 'ProgressBar with steps list',
          update: 'live'
        },
        {
          title: 'Extracted So Far',
          content: 'Field list with checkmarks',
          update: 'live'
        }
      ]
    },

    footer: {
      actions: [
        { label: 'Stop Job', action: 'stopJob', danger: true },
        { label: 'View Full Page', action: 'navigate' }
      ]
    }
  }
}
```

---

## PART 8: KEYBOARD SHORTCUTS & ACCESSIBILITY

### Keyboard Navigation

```typescript
interface KeyboardShortcuts {
  navigation: {
    'ArrowDown': 'Move to next row',
    'ArrowUp': 'Move to previous row',
    'Enter': 'Open selected job details',
    'Space': 'Toggle selection',
    'Escape': 'Clear selection / Close modal',
    'Tab': 'Navigate between table elements'
  },

  actions: {
    'R': 'Retry selected job(s)',
    'E': 'Export selected job(s)',
    'D': 'Delete selected job(s) (with confirmation)',
    'L': 'Open live view (if running)',
    'Cmd+A': 'Select all visible jobs',
    'Cmd+D': 'Deselect all',
    'Cmd+F': 'Focus search'
  },

  filters: {
    '1': 'Show Needs Attention',
    '2': 'Show Running',
    '3': 'Show Completed',
    '4': 'Show All'
  },

  help: {
    trigger: '?',
    display: 'Modal with all shortcuts listed'
  }
}
```

### Accessibility Features

```typescript
interface A11yFeatures {
  // ARIA labels
  labels: {
    table: 'Jobs execution table',
    row: (job) => `Job for ${job.siteName}, status ${job.status}`,
    statusDot: (status) => `Status: ${status}`,
    progressBar: (pct) => `Progress: ${pct}%`,
    actionButton: (action) => `${action} this job`
  },

  // Keyboard focus
  focus: {
    visibleRing: 'ring-2 ring-emerald-500 ring-offset-2',
    skipLinks: 'Skip to filters | Skip to table',
    trapInModal: true
  },

  // Screen reader announcements
  liveRegions: {
    updates: 'aria-live="polite"',  // Job status changes
    alerts: 'aria-live="assertive"'  // Errors, important changes
  },

  // Color contrast
  contrast: {
    text: 'WCAG AAA (7:1)',
    statusDots: 'WCAG AA (4.5:1)',
    badges: 'WCAG AA (4.5:1)'
  },

  // Touch targets
  minSize: '44px',  // All interactive elements
  spacing: '8px'  // Between targets
}
```

---

## PART 9: RESPONSIVE DESIGN

### Mobile Layout (<768px)

**Problem**: Table doesn't work on mobile
**Solution**: Switch to card-based layout

```typescript
interface MobileLayout {
  display: 'cards',  // Not table

  card: {
    layout: 'vertical',
    sections: [
      {
        // Header: Website + Status
        display: 'flex',
        content: [
          { type: 'statusDot', size: '12px' },
          { type: 'websiteName', weight: 'bold', truncate: true },
          { type: 'menu', align: 'right' }
        ]
      },
      {
        // Body: Progress/Outcome
        content: 'ProgressOutcome'  // Same as desktop column
      },
      {
        // Footer: Key data + duration
        display: 'flex',
        content: [
          { type: 'keyDataPreview', truncate: 1line },
          { type: 'duration', align: 'right' }
        ]
      }
    ],

    actions: {
      // Tap card to expand
      tap: 'expand',
      // Swipe left for actions
      swipeLeft: 'showActionsButtons',  // [Retry] [Delete] [Export]
      // Swipe right for selection
      swipeRight: 'select'
    }
  },

  filters: {
    display: 'drawer',  // Bottom drawer on mobile
    trigger: 'floating-filter-button'  // Bottom-right FAB
  },

  search: {
    position: 'sticky-top',
    collapsed: true,  // Show icon only, expand on tap
    fullWidth: true
  }
}
```

### Tablet Layout (768px - 1024px)

**Strategy**: Simplified table, fewer columns

```typescript
interface TabletLayout {
  display: 'table',
  columns: [
    'Status',  // Keep
    'Website',  // Keep
    'Progress/Outcome',  // Keep
    'Key Data Preview',  // Keep (shorter)
    'Actions'  // Keep
    // Hide: Accuracy, Duration (show in expanded row)
  ],

  expandableRows: true,  // Use expansion for hidden columns

  filters: {
    display: 'collapsible-panel',  // Above table
    defaultCollapsed: true
  }
}
```

---

## PART 10: PERFORMANCE OPTIMIZATION

### Virtual Scrolling

**Problem**: 10,000 jobs = slow rendering
**Solution**: Only render visible rows

```typescript
interface VirtualScrolling {
  library: 'react-virtual' | 'tanstack-virtual',

  config: {
    estimateSize: 72,  // Estimated row height in px
    overscan: 5,  // Render 5 extra rows above/below viewport
    scrollMargin: 100  // Start rendering N px before visible
  },

  benefits: {
    initialRender: '~50 rows instead of 10,000',
    scrollPerformance: '60 FPS smooth scrolling',
    memoryUsage: '90% reduction'
  }
}
```

### Optimistic Updates

```typescript
interface OptimisticUpdates {
  // Update UI immediately, then sync with server
  pattern: 'optimistic',

  examples: {
    retry: {
      // 1. User clicks Retry
      // 2. Immediately show "Queued" status
      // 3. Send API request
      // 4. Update with real status when response arrives
      immediate: () => updateJobStatus(jobId, 'queued'),
      apiCall: () => retryJob(jobId),
      onSuccess: (result) => updateJobStatus(jobId, result.status),
      onError: (error) => {
        revertJobStatus(jobId)
        toast.error('Retry failed')
      }
    },

    delete: {
      immediate: () => removeJobFromTable(jobId),
      apiCall: () => deleteJob(jobId),
      onError: () => {
        restoreJobInTable(jobId)
        toast.error('Delete failed')
      }
    }
  }
}
```

### Data Fetching Strategy

```typescript
interface DataFetching {
  initial: {
    // Load first page only (50 jobs)
    method: 'server-component',  // Next.js SSR
    data: 'first-50-jobs'
  },

  pagination: {
    type: 'infinite-scroll',  // Load more on scroll
    pageSize: 50,
    prefetch: true  // Prefetch next page when near bottom
  },

  realtime: {
    // Only fetch running jobs frequently
    runningJobs: {
      method: 'websocket',
      updateInterval: 'push'  // Server pushes updates
    },

    // Other jobs fetch less often
    completedJobs: {
      method: 'polling',
      interval: 30000  // Every 30s
    }
  },

  caching: {
    // Cache job data
    strategy: 'swr',  // Stale-while-revalidate
    ttl: 60000,  // 1 minute
    revalidateOnFocus: true
  }
}
```

---

## PART 11: IMPLEMENTATION PLAN

### Phase 1: Core Table Redesign (Week 1)

**Tasks**:
1. Create new column components
   - StatusColumn.tsx
   - WebsiteColumn.tsx
   - ProgressOutcomeColumn.tsx
   - AccuracyColumn.tsx
   - DataPreviewColumn.tsx
   - DurationColumn.tsx
   - ActionsColumn.tsx

2. Build new JobsTableV3.tsx
   - Use new column components
   - Implement JTBD-based order
   - Add keyboard navigation
   - Add selection model

3. Replace current table
   - Update batch dashboard page
   - Migrate data fetching logic
   - Test with real data

**Deliverable**: New table with optimized column order

---

### Phase 2: Smart Filters & Search (Week 1-2)

**Tasks**:
1. Create SmartFiltersBar component
   - Preset filters (Needs Attention, Running, etc.)
   - Live counts
   - Active state management

2. Enhance search
   - Add fuzzy matching
   - Search in extracted data
   - Recent searches

3. Advanced filters panel
   - Accuracy range slider
   - Duration filters
   - Missing fields multi-select
   - Block reason filters

**Deliverable**: Powerful filtering system

---

### Phase 3: Bulk Actions & Selection (Week 2)

**Tasks**:
1. Create BulkActionsToolbar component
   - Sticky positioning
   - Action buttons
   - Selection count

2. Implement selection modes
   - Checkbox selection
   - Shift+click range selection
   - Cmd+click toggle
   - Smart selection presets

3. Build bulk action handlers
   - Bulk export (CSV/JSON/Excel)
   - Bulk retry
   - Bulk delete with confirmation
   - Bulk mark reviewed

**Deliverable**: Efficient bulk operations

---

### Phase 4: Expandable Rows (Week 2)

**Tasks**:
1. Create ExpandableRow component
   - 2-column layout
   - All fields grid
   - Screenshot viewer
   - Execution timeline

2. Build AllFieldsGrid
   - 2-column responsive grid
   - Ground truth comparison
   - Field-level actions
   - Copy/edit capabilities

3. Add expand/collapse animations
   - Smooth height transition
   - Keyboard support (arrow keys)

**Deliverable**: Detailed inline expansion

---

### Phase 5: Real-Time Updates (Week 3)

**Tasks**:
1. Enhance WebSocket integration
   - Subscribe to job events
   - Handle reconnection
   - Show connection status

2. Implement live updates
   - Optimistic UI updates
   - Smooth progress animations
   - Update flash effects
   - Toast notifications

3. Build LiveJobDrawer
   - Live browser stream iframe
   - Real-time progress
   - Current step updates
   - Stop job button

**Deliverable**: Live monitoring

---

### Phase 6: Mobile & Responsive (Week 3)

**Tasks**:
1. Create MobileJobCard component
   - Card-based layout
   - Swipe gestures
   - Tap to expand

2. Build responsive filters
   - Bottom drawer on mobile
   - Floating action button
   - Collapsible panel on tablet

3. Test on devices
   - iPhone (various sizes)
   - Android phones
   - iPad/tablets

**Deliverable**: Mobile-optimized experience

---

### Phase 7: Performance & Polish (Week 4)

**Tasks**:
1. Implement virtual scrolling
   - Install react-virtual
   - Configure row heights
   - Test with 10k+ jobs

2. Add keyboard shortcuts
   - Implement shortcut handlers
   - Build help modal (?)
   - Add visual indicators

3. Accessibility audit
   - ARIA labels
   - Keyboard navigation
   - Screen reader testing
   - Color contrast check

4. Performance optimization
   - Memoize components
   - Optimize re-renders
   - Lazy load images
   - Code splitting

**Deliverable**: Production-ready table

---

## PART 12: SUCCESS METRICS

### User Experience Metrics

1. **Time to Understand Status** (<2 seconds)
   - User can scan table and know what's happening
   - Measured: Eye-tracking or user testing

2. **Time to Find Specific Job** (<5 seconds)
   - Using search or filters
   - Measured: Task completion time

3. **Time to Take Action** (<3 clicks)
   - Retry, export, view details
   - Measured: Click depth analysis

4. **Perceived Performance** (instant)
   - Optimistic updates feel instant
   - Measured: User satisfaction survey

### Technical Metrics

1. **Initial Render** (<100ms)
   - First 50 rows render fast
   - Measured: Performance API

2. **Scroll Performance** (60 FPS)
   - Smooth scrolling with virtual scroll
   - Measured: Chrome DevTools FPS meter

3. **Bundle Size** (<50KB gzipped)
   - Table components optimized
   - Measured: webpack-bundle-analyzer

4. **Accessibility Score** (100/100)
   - Lighthouse accessibility audit
   - Measured: Automated testing

---

## CONCLUSION

This comprehensive redesign focuses on **what users need to accomplish** rather than just displaying technical data. The new table:

✅ **Answers questions at a glance** - Status, progress, quality immediately visible
✅ **Prioritizes actionable information** - Failed/blocked jobs stand out
✅ **Shows data that matters** - Key extracted fields, not just metadata
✅ **Enables quick actions** - Retry, export, view live in 1-2 clicks
✅ **Scales to thousands of jobs** - Virtual scrolling, smart filtering
✅ **Works everywhere** - Responsive mobile, tablet, desktop
✅ **Feels fast** - Optimistic updates, real-time sync
✅ **Accessible to all** - Keyboard navigation, screen readers

The result: A table that **helps users get their job done**, not just displays data.

---

**END OF JOBS TABLE JTBD OPTIMIZATION PLAN**
