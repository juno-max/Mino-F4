# Product Mission

## Pitch

MINO is an Enterprise Web Agent Platform that helps power builders and business analysts create, validate, and deploy intelligent web automation workflows by teaching through natural demonstration and validating accuracy through systematic ground truth testing before production deployment.

## Users

### Primary Customers

- **Power Builders & No-Code Users**: Technical operators (50M professionals) - product engineers, data engineers, operations engineers at mid-to-enterprise companies who automate complex manual workflows feeding into core business systems
- **Business Analysts**: Domain experts who extract data from multiple websites at scale (competitive intelligence, market research, compliance monitoring) without coding
- **Digital Agencies**: Teams managing web scraping and automation projects for multiple clients requiring validated accuracy guarantees
- **Enterprise Teams**: Organizations requiring auditable automation workflows with 95%+ accuracy for business-critical decision-making

### User Personas

**Sarah, Data Operations Manager** (32-45 years old)
- **Role:** Operations Manager at mid-market SaaS company
- **Context:** Manages competitive intelligence gathering across 250+ competitor websites monthly for pricing strategy and product positioning
- **Pain Points:** Spends 5 hours monthly on manual data collection, existing scraping tools break when sites change without warning, can't verify accuracy before deploying at scale, engineering team has no bandwidth
- **Goals:** Automate data extraction with 95%+ accuracy, reduce manual QA time from hours to minutes, build workflows independently without engineering dependency

**Alex, Digital Agency Founder** (28-38 years old)
- **Role:** Founder/Technical Lead at boutique automation agency
- **Context:** Delivers custom web scraping solutions to 10+ enterprise clients simultaneously across pricing intelligence, restaurant market data, regulatory compliance
- **Pain Points:** Traditional scrapers require constant maintenance after site changes, clients demand accuracy guarantees upfront, hard to demonstrate ROI before full deployment, scaling to new clients is slow
- **Goals:** Build client workflows 10x faster, provide accuracy metrics in proposals, reduce ongoing maintenance costs, scale agency revenue without scaling headcount

**Marcus, Enterprise Business Analyst** (35-50 years old)
- **Role:** Senior Business Analyst at Fortune 500 retail company
- **Context:** Tracks competitor pricing and product availability across 835 retail locations for weekly executive reports
- **Pain Points:** Manual workflow takes 20+ hours weekly, data quality issues impact executive decisions, procurement team demands 100% accuracy, current tools don't handle cart-level pricing logic
- **Goals:** Automate weekly intelligence gathering, guarantee data accuracy for executive reporting, free up time for strategic analysis instead of data collection

## The Problem

### Manual Web Workflows Don't Scale

Power users spend 15-20 hours per week manually collecting data from websites that could be automated. For ClassPass pricing intelligence (835 venues), this means 5 hours of manual work monthly. For Coca-Cola restaurant beverage tracking (1M+ locations), survey samples cover <1% of market. This time-consuming process is expensive, error-prone, and prevents teams from focusing on analysis and decision-making. **Our Solution:** MINO enables users to teach workflows once through natural demonstration (10 minutes), then deploy at scale with 98.6% time reduction (5hr → 10min monthly).

### Existing Automation Tools Break Without Warning

Traditional web scrapers fail when websites update their structure, often without notification, leading to incomplete or incorrect data that impacts business decisions. Users can't proactively validate accuracy before deployment. For NextEra Energy utility rate monitoring, missed changes result in compliance penalties. For competitive pricing intelligence, stale data leads to incorrect strategic decisions. **Our Solution:** MINO's ground truth testing system validates accuracy on sample sites (10-50) before production, ensuring confidence in results with measurable accuracy metrics (60% → 95% improvement).

### No Clear Path from 60% to 95% Accuracy

Current tools don't provide systematic feedback on why extractions fail or how to improve accuracy. Users struggle to iterate from "mostly working" to "production-ready" without trial and error. Black-box AI tools claim "90% success" without transparency. Visual builders offer limited debugging. Traditional scrapers require technical knowledge to fix. **Our Solution:** MINO's failure pattern analysis identifies specific issues (e.g., "Monthly price extraction failing on 12 sites - check both pricing page and cart"), suggests targeted refinements, and tracks accuracy improvement attribution per change.

### Trust Gap Between Teaching and Production

Users can't verify their automation works correctly before running it on hundreds or thousands of sites. This uncertainty leads to either over-validation (manual spot-checking 50+ results) or under-confidence in production data quality. Enterprise teams need auditable accuracy for executive reporting. Agencies need proof for client proposals. **Our Solution:** MINO's systematic ground truth validation provides measurable accuracy metrics (overall + per-column) before scaling, eliminating the trust gap with transparent execution traces and confidence scoring.

## Differentiators

### Conversational Teaching Paradigm

Unlike traditional scrapers that require CSS selectors or XPath expressions, and unlike visual builders with complex drag-and-drop configuration, MINO learns by watching users perform their workflow naturally through screen sharing. Users teach by doing, not by coding or configuring. This results in 10x faster workflow creation (10 minutes vs. days of development) and eliminates technical barriers - power builders who understand business logic can automate without writing code.

### Systematic Ground Truth Validation

Unlike competitors (Octoparse, Apify, traditional scrapers) that run workflows blindly and hope for the best, MINO requires validation on sample sites with known-correct answers before production deployment. CSV-based ground truth management enables accuracy measurement (overall + per-column metrics) and failure pattern detection. This systematic testing approach provides accuracy guarantees (90-95% after 3-5 refinements) and identifies specific issues before scaling, resulting in measurable confidence and eliminating production surprises.

### Transparent Accuracy Improvement Loop

Unlike black-box AI agent platforms that provide vague "90% success" claims without explanation, MINO shows exactly where and why extractions fail, groups similar failures into actionable patterns, and suggests specific instruction refinements with expected accuracy impact. This transparent iteration process enables users to systematically improve from 60% baseline to 95%+ accuracy through 3-5 guided refinements with full attribution tracking (version control shows which changes improved accuracy), rather than trial-and-error guesswork.

## Key Features

### Phase 1: Project Setup & Configuration

- **Natural Language Task Description**: Describe what data to extract conversationally - AI interprets intent, extracts required fields, and suggests clarifications. Template library with examples for common use cases (pricing, contacts, products).
- **Smart CSV Upload with GT Detection**: Drag-and-drop CSV upload with automatic ground truth column detection (recognizes `gt_`, `ground_truth_`, `expected_` prefixes). Real-time validation checks URLs, detects column types, shows data quality warnings, suggests batch names.
- **Intelligent Schema Generation**: Auto-generate output schema from task description and GT columns. Visual schema builder with field cards, type inference, template schemas (Pricing, Contact, Product), validation against task intent.
- **Data Preview & Validation**: Enhanced preview table showing input columns (from CSV) and output columns (to be filled by agents). Auto-map CSV to schema fields with confidence scores, detect anomalies and duplicates, validate required fields present.
- **Smart Test Run Configuration**: Recommend 20-job test with diverse sampling (not just first 20). Cost and time estimates, pre-flight validation checks, 5-second countdown before execution.

### Phase 2: Real-Time Execution & Initial Results

- **Live Execution Viewer**: Watch 4-6 agents working concurrently in split-screen view. Real-time status streaming shows current URL, last action, next step for each agent. Stop/pause controls, early failure detection, adaptive rate limiting.
- **Live Results Streaming**: Results populate row-by-row as jobs complete via WebSocket (no polling). Status indicators (✅ Complete, ⚠ Partial, ❌ Failed), confidence scores, automatic anomaly detection, smart column ordering.
- **Enhanced Session Detail View**: Comprehensive session playback with screenshot timeline, timestamped tool calls, agent reasoning explanations. Compare sessions side-by-side, match tool calls to screenshots, business logic transparency with confidence scores.
- **Ground Truth Setting from Sessions** ⭐: Select any subset of extracted data as GT directly from session view. Click "Set as GT ★" button, edit GT fields inline, track GT source (CSV/session/manual), GT appears with ⭐ icon in results table.
- **Quick Analytics Dashboard**: Success breakdown (Complete/Partial/Failed), per-field accuracy if GT exists, common failure patterns with suggestions, predicted full dataset performance.

### Phase 3: Refinement & Iteration Loop

- **Conversational Instruction Refinement**: Describe problems in natural language - AI translates to instruction updates. Preview changes with before/after diff, dry run on sample jobs (3-5), see predicted impact before applying.
- **Quick Review Mode**: Keyboard-driven result review ([→] next, [✓] correct, [✗] incorrect, [★] set GT). Prioritized queue shows low-confidence results first, side-by-side result + screenshot view, learns from user corrections.
- **Instruction Version Control**: All instruction changes tracked with version numbers, accuracy impact, and descriptions. Side-by-side version comparison with diff view, performance trending chart, one-click rollback if accuracy degrades.
- **Change Impact Preview**: Before rerunning, see predicted outcomes vs current results. Test new instructions on samples, selective rerun options (all/failed/subset), AI predicts change impact with confidence.
- **Scale Decision Intelligence**: Confidence-based recommendations (refine more vs scale up). Risk assessment warns if test quality <85%, phased rollout option (50 → 100 → full), auto-pause if accuracy drops during full run.

### Phase 4: Ground Truth Evaluation & Accuracy Optimization ⭐

> See **GT_FEATURES_ROADMAP.md** for complete details on all GT-related features

- **Multiple GT Setting Pathways** (5 ways):
  1. Bulk CSV upload with GT columns
  2. Select from session JSON output (any subset)
  3. Manual field-by-field editing
  4. Quick review keyboard shortcut ([★])
  5. Click-to-set from results table
- **Automatic GT Evaluation**: On GT creation, immediately evaluate existing sessions. Result-level indicators (✓ Match, ≈ Close, ✗ Mismatch), field-level accuracy breakdown, detailed mismatch explanations.
- **Fuzzy Matching & Smart Comparison**: Currency normalization ($99 vs $99.00), text normalization (whitespace, case), date format variations, unit conversions, context-aware comparison logic per data type.
- **Accuracy Dashboard with GT Metrics**: Large accuracy percentage display with trend indicators, horizontal bar charts per field showing individual field accuracy, version comparison showing accuracy delta per iteration, error pattern analysis with grouped failures and AI-powered suggestions.
- **GT Management Features**: GT version history tracking all changes, GT source indicators (CSV/session/manual/review/click), GT edit history with timestamps and reasons, GT coverage metrics per batch (% jobs with GT).

### Navigation & Persistent Features

- **Hierarchical Side Panel Navigation**: Always-visible project selector, batch list with GT indicators (🎯), breadcrumb trail (Project → Batch → Session), context preservation on navigation, smart project suggestions.
- **Universal Search & Filtering**: Search across projects/batches/sessions, filter by status/date/accuracy/GT availability, save filter presets, fuzzy search with typo tolerance.
- **Export & Integration**: Export to CSV/JSON/Excel with GT columns included, select columns to export, API access for workflow automation, preserve metadata in exports.

### Analytics & Continuous Improvement

- **Performance Dashboard**: Execution time trends, success rates over time, cost per site metrics, accuracy degradation detection alerts, ROI calculation (time savings, cost reduction, accuracy improvements).
- **Proactive Recommendations**: Detect site structure changes via accuracy drops, suggest workflow updates and re-training, scheduled re-validation reminders, optimization tips based on execution patterns, predict when workflows need updating.
- **Historical Comparison & Learning**: Compare batch results over time, identify accuracy regressions, track instruction effectiveness across versions, platform-wide pattern learning, suggest successful patterns from similar projects.

---

## Implementation Status (MINO V2)

### ✅ Completed Features (Current State)
- Project and batch CRUD operations
- CSV upload with batch creation
- EVA agent integration for web automation
- Job execution with session tracking
- Real-time job status monitoring
- Ground truth data storage in database
- Basic evaluation (pass/fail indicators)
- Results table with filters and sorting
- Session detail view with screenshots
- API routes for all core operations

### 🚧 In Progress
- Navigation side panel (structure exists, needs enhancement)
- GT setting from session output (schema ready, UI needed)
- Accuracy metrics dashboard (data calculated, visualization needed)
- Instruction versioning (database ready, UI incomplete)

### 📋 Planned (Next 12 Weeks)
See **FEATURE_ROADMAP.md** and **GT_FEATURES_ROADMAP.md** for staged implementation plan with stage gates and rollback strategy.
