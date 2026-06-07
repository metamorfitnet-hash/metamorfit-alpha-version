#!/bin/bash
# List all user plans from the remote D1 database
echo "📊 Fetching user plans from METAMORFIT_DB..."
npx wrangler d1 execute METAMORFIT_DB --remote --command="SELECT * FROM user_plans ORDER BY created_at DESC LIMIT 10"
