CREATE TABLE IF NOT EXISTS user_plans (
  id TEXT PRIMARY KEY,
  user_email TEXT,
  supabase_id TEXT,
  job_id TEXT,
  status TEXT,
  pdf_url TEXT,
  ai_latency_ms INTEGER,
  error_message TEXT,
  error_code TEXT,
  created_at INTEGER
);
