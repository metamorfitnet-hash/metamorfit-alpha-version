#!/bin/bash
# Apply the D1 schema to the remote database
echo "🚀 Applying D1 schema to METAMORFIT_DB..."
npx wrangler d1 execute METAMORFIT_DB --remote --file=schema.sql
echo "✅ Schema applied successfully."
