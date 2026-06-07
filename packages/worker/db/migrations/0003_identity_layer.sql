-- Migration: Add supabase_id to user_plans for Identity Layer integration
-- Target: Cloudflare D1 (METAMORFIT_DB)

ALTER TABLE user_plans ADD COLUMN supabase_id TEXT;

-- Index for fast lookup by auth id
CREATE INDEX IF NOT EXISTS idx_user_plans_supabase_id ON user_plans(supabase_id);
