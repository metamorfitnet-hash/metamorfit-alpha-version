-- Migration: Add Indexes and Error Categorization to user_plans
-- Target: Cloudflare D1 (METAMORFIT_DB)

-- 1. Add error_code column for Phase 6.6
ALTER TABLE user_plans ADD COLUMN error_code TEXT;

-- 2. Performance Indexes for Phase 3.1
CREATE INDEX IF NOT EXISTS idx_user_plans_created_at ON user_plans(created_at);
CREATE INDEX IF NOT EXISTS idx_user_plans_status ON user_plans(status);
CREATE INDEX IF NOT EXISTS idx_user_plans_user_email ON user_plans(user_email);
CREATE INDEX IF NOT EXISTS idx_user_plans_job_id ON user_plans(job_id);

-- 3. Verify Table Structure
-- .schema user_plans
