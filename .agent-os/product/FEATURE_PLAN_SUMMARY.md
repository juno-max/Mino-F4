# MINO v2 - Feature Plan Executive Summary

**Version**: 2.0
**Date**: 2025-11-05
**Current Status**: Ground Truth System 85% Complete

---

## Overview

This document summarizes the comprehensive feature plan for MINO v2, a web scraping testing and accuracy validation platform.

---

## Remaining Features (6 Total)

### ✅ **1. Ground Truth Management System** - 85% Complete

**What's Done**:
- Database schema for column-level metrics
- Bulk editing API and UI (table-based editor)
- Column metrics visualization with progress bars
- Enhanced visual diff with similarity scoring

**What's Left** (2-3 days):
- Historical trend tracking
- Trend chart visualization

**Why It Matters**: Core feature that enables users to measure and improve accuracy

---

### 🔄 **2. Accuracy Analytics Dashboard** - Not Started

**Estimate**: 3-4 days

**What**: Single-page dashboard showing:
- Overall accuracy at a glance
- Accuracy distribution (how many jobs at each level)
- Column performance ranking (worst to best)
- Common error patterns
- 7-day trend chart
- Quick actions (bulk edit failed, export, re-run)

**Why It Matters**: Users need a high-level view before drilling into details

**Key Screens**:
```
┌─────────────────────────────────────────┐
│ Overall: 82%  |  164/200 Jobs  |  ↑ +7% │
│─────────────────────────────────────────│
│ Distribution: [===90%][==70%][=50%]     │
│ Worst Column: shipping_cost (45%)       │
│ Best Column: product_name (95%)         │
│ Trend: ↗️ Improving                      │
└─────────────────────────────────────────┘
```

---

### 🔄 **3. Batch Export Enhancement** - Not Started

**Estimate**: 4-5 days

**What**: Export execution results in multiple formats:
- CSV, JSON, Excel with column selection
- Include/exclude ground truth comparison
- Filter before export (only failed jobs, date range, etc.)
- Batch download all screenshots as ZIP
- Export history with re-download capability

**Why It Matters**: Users need to share results with stakeholders and create reports

**Key Flow**:
1. User clicks "Export" → Dialog opens
2. Selects format (CSV), columns (8 of 12)
3. Checks "Include GT Comparison"
4. Preview: "200 jobs, 8 columns, ~1.2 MB"
5. Clicks "Export" → Progress bar
6. Download link appears → User downloads

---

### 🔄 **4. Screenshot Playback System** - Not Started

**Estimate**: 3-4 days

**What**: Timeline-based playback of execution screenshots:
- Scrubber to navigate frames
- Play/pause with speed control (0.5x, 1x, 2x)
- Keyboard shortcuts (space, arrows, F for fullscreen)
- Annotations showing what was extracted
- Download individual frame or full sequence
- Side-by-side comparison of two executions

**Why It Matters**: Critical for debugging - see what the agent saw

**Key UI**:
```
┌─────────────────────────────────────────┐
│        [Screenshot Image]               │
│ ◄ ▶ ❚❚ [═══●═════] 3/12  ⚡🔍↗️⬇️       │
│ Timeline: ●───●───●───●───●             │
│           Load  Click  Extract  Done    │
└─────────────────────────────────────────┘
```

---

### 🔄 **5. Instruction Versioning** - Not Started

**Estimate**: 3-4 days

**What**: Track and compare instruction versions:
- Create new versions with change descriptions
- View version history with accuracy for each
- Compare two versions side-by-side (text diff + accuracy delta)
- Set production version
- Revert to previous version
- Tag versions ("production", "experiment", "v2.0")

**Why It Matters**: Users iterate on instructions - need to track what works

**Key Features**:
- Version history: v1 (62%) → v2 (68%) → v3 (75%) → v4 (82%)
- Compare v3 vs v4: +7% overall, +12% on price column
- Text diff showing what changed
- "Set as Production" button

---

### 🔄 **6. Advanced Filtering & Search** - Not Started

**Estimate**: 3-4 days

**What**: Powerful filtering to find specific jobs:
- Filter by status, accuracy range, has GT, date
- Full-text search across URLs and data
- Combine multiple filters (AND/OR logic)
- Save filter presets ("Failed with GT", "Needs Review")
- URL state for sharing filtered views
- Keyboard shortcuts (/ for search, Cmd+K for quick filters)

**Why It Matters**: Users need to find the needle in the haystack (e.g., "show me all failed jobs with GT between 50-70% accuracy from last week")

**Key UI**:
```
┌─────────────────────────────────────────┐
│ Quick Filters:                          │
│ [Failed with GT] [Needs Review]         │
│                                         │
│ Status: ☑ Error ☐ Running               │
│ Ground Truth: [With GT Only ▼]         │
│ Accuracy: [━━●━━━━] 50%-80%             │
│ Search: [nike shoes_______________]    │
│                                         │
│ [Clear All]  [Save Preset]             │
└─────────────────────────────────────────┘
```

---

## User Personas & Their Needs

### 🎯 QA Engineer (Primary User)
**Needs**: Validate accuracy, set ground truth, identify failures
**Top Features**: GT Management, Analytics Dashboard, Export

### 📊 Data Analyst
**Needs**: Understand patterns, create reports, measure improvement
**Top Features**: Analytics Dashboard, Export, Trend Tracking

### 👔 Product Manager
**Needs**: Track progress over time, compare versions
**Top Features**: Trend Tracking, Version Comparison, Analytics

### 💻 Developer
**Needs**: Debug failures, improve instructions
**Top Features**: Screenshot Playback, Filtering, Version Comparison

---

## Implementation Roadmap

### ✅ **Phase 1: Complete GT System** (1 week) - 85% Done
- [x] Schema, APIs, UI ✅
- [ ] Trend tracking 🔄 (2-3 days)

### **Phase 2: Analytics & Export** (1.5 weeks)
- Analytics Dashboard (3-4 days)
- Export System (4-5 days)

**Impact**: High - enables reporting

### **Phase 3: Instruction Versioning** (1 week)
- Version management (3-4 days)

**Impact**: High - enables iteration

### **Phase 4: Screenshot Playback** (1 week)
- Playback UI (3-4 days)

**Impact**: Medium-High - critical for debugging

### **Phase 5: Advanced Filtering** (1 week)
- Filtering system (3-4 days)

**Impact**: Medium - improves UX

**Total Time**: ~5.5 weeks (28 days)

---

## Success Metrics

### Adoption
- 80%+ use bulk GT editing
- 60%+ export results regularly
- 50%+ create multiple instruction versions

### Performance
- Dashboard < 2s load time
- Export < 1 min for 1000 jobs
- Playback smooth (30+ fps)

### Accuracy Improvement
- Users reach 80%+ accuracy within 3 iterations
- Average +10-15% per instruction version

---

## Technical Highlights

### Performance
- Caching: 5-min cache for metrics
- Indexes: Composite indexes on (batch_id, status)
- Async: Background jobs for export, metrics calculation
- CDN: Screenshots served from CDN

### Security
- Row-level security
- S3 presigned URLs with 24hr expiry
- CSV validation and size limits (50MB)

### Architecture
- REST for CRUD, GraphQL for complex queries
- WebSocket for live updates
- Redis for caching
- S3 for file storage

---

## Current State vs. Target State

### Current (v1.0)
- ✅ Project and batch management
- ✅ CSV upload with GT detection
- ✅ Job execution with EVA agent
- ✅ Basic result viewing
- ✅ Live execution monitoring
- ⚠️ Limited GT management (85% done)
- ❌ No analytics dashboard
- ❌ No export functionality
- ❌ No playback UI
- ❌ No version tracking
- ❌ No filtering

### Target (v2.0)
- ✅ Everything from v1.0
- ✅ Complete GT system with trends
- ✅ Comprehensive analytics
- ✅ Multi-format export
- ✅ Screenshot playback
- ✅ Instruction versioning
- ✅ Advanced filtering

**Result**: Production-ready accuracy validation platform

---

## Next Steps

1. **Finish Phase 1** (2-3 days)
   - Complete trend tracking
   - Test end-to-end GT workflow

2. **Start Phase 2** (1.5 weeks)
   - Build analytics dashboard
   - Implement export system

3. **Continue sequentially** through Phases 3-5

**Target Launch**: v2.0 complete in ~6 weeks
