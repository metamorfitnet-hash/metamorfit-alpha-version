-- npx wrangler d1 execute metamorfit-analytics-beta --local --file=./db/schema.sql

CREATE TABLE IF NOT EXISTS plan_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jobId TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  fullName TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);
