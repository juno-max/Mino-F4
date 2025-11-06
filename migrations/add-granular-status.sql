-- Migration: Add Granular Status Tracking
-- Date: 2025-11-05
-- Purpose: Add detailed status fields for better UX and error visibility

-- Add columns to jobs table
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS detailed_status TEXT,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS fields_extracted TEXT[],
ADD COLUMN IF NOT EXISTS fields_missing TEXT[],
ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS failure_category TEXT;

-- Add columns to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS detailed_status TEXT,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS fields_extracted TEXT[],
ADD COLUMN IF NOT EXISTS fields_missing TEXT[],
ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN jobs.detailed_status IS 'Granular status: completed, partial, blocked, timeout, failed, validation_failed, not_found';
COMMENT ON COLUMN jobs.blocked_reason IS 'Reason for blocked status: captcha, login_required, paywall, geo_blocked, rate_limited, cloudflare';
COMMENT ON COLUMN jobs.fields_extracted IS 'Array of successfully extracted field names';
COMMENT ON COLUMN jobs.fields_missing IS 'Array of field names that failed to extract';
COMMENT ON COLUMN jobs.completion_percentage IS 'Percentage of fields successfully extracted (0-100)';
COMMENT ON COLUMN jobs.failure_category IS 'Category of failure: extraction_failed, page_error, network_error, timeout, blocked';

COMMENT ON COLUMN sessions.detailed_status IS 'Granular status: completed, partial, blocked, timeout, failed, validation_failed, not_found';
COMMENT ON COLUMN sessions.blocked_reason IS 'Reason for blocked status: captcha, login_required, paywall, geo_blocked, rate_limited, cloudflare';
COMMENT ON COLUMN sessions.fields_extracted IS 'Array of successfully extracted field names';
COMMENT ON COLUMN sessions.fields_missing IS 'Array of field names that failed to extract';
COMMENT ON COLUMN sessions.completion_percentage IS 'Percentage of fields successfully extracted (0-100)';
