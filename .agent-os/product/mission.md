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

### Core Features

- **Conversational Workflow Capture**: Teach MINO your workflow by performing it naturally while screen sharing - no code, CSS selectors, XPath, or technical configuration required. Split-screen observation panel tracks actions with minimal interruption.
- **Ground Truth Testing**: Validate accuracy on sample sites (10-50) with known-correct answers before deploying to full batches. Upload CSV with ground truth columns, compare expected vs. actual results, measure overall + per-column accuracy.
- **Batch CSV Management**: Upload spreadsheets with URLs and optional ground truth data (auto-detect GT columns), manage multiple batches per project, track validation coverage metrics, handle 250-1000+ sites efficiently.
- **Real-time Accuracy Metrics**: View overall accuracy percentage, per-column breakdown, success/partial/failed counts during test and production runs. Track execution time, cost per site, completion rates.
- **Failure Pattern Analysis**: Automatically group similar failures (e.g., 12 sites failing on "Monthly price" extraction), identify root causes through pattern recognition, receive specific actionable suggestions for instruction refinements.

### Refinement & Deployment Features

- **Instruction Version Control**: Track all instruction changes over time with version numbers and change descriptions, compare versions side-by-side with diff view, rollback to previous versions if accuracy degrades, measure accuracy impact per refinement cycle.
- **Iterative Testing Workflow**: Re-test on same sample sites after refinements to measure improvement delta, visualize accuracy trends over iterations (60% → 75% → 85% → 95%), track iteration counter and time-to-production-ready.
- **Production Deployment Pipeline**: Deploy validated workflows at scale (batch graduation: 50 → 100 → full) with confidence, monitor real-time progress with ETA calculation, pause/resume executions, handle failures gracefully with automatic retry logic, cost and time estimates upfront.
- **Result Export & Management**: Export results to CSV/JSON for analysis, filter and sort by accuracy/status/execution time, retry failed sites individually or in bulk, paginated result tables for large batches.

### Analytics & Monitoring Features

- **Performance Dashboard**: Track execution time trends over iterations, success rates over time (detect accuracy degradation), cost per site metrics and ROI calculation, proactive alerts for performance issues.
- **Proactive Recommendations**: Detect when site structures change (accuracy drop signals), suggest workflow updates and re-training, schedule systematic re-validation reminders, provide optimization tips based on execution patterns.
- **Historical Comparison**: Compare batch results over time to identify accuracy regressions, track instruction effectiveness across versions, measure ROI (time savings: 5hr → 10min monthly, cost reduction, accuracy improvements).
- **Knowledge Base Integration**: Save successful workflow patterns as reusable templates, access common issues and solutions library, view best practices documentation, contribute learnings to platform knowledge base.
