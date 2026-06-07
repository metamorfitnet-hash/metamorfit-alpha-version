# Alpha Environment Deployment & Isolation Specification

**CONTEXT:** We are preparing to deploy our local Alpha branch to the new repository: `https://github.com/metamorfitnet-hash/metamorfit-alpha-version`. To prevent breaking our production systems, we must ensure absolute isolation from the Beta platform across environment configuration, database layers, and edge handlers.

Follow these verification steps sequentially. Do NOT perform any git operations until checking these configurations.

---

## STEP 1: Audit & Namespace Cloudflare Workers
We must make sure our Alpha workers push to dedicated Alpha endpoints on Cloudflare.

1. **`wrangler.toml` & `wrangler.jsonc` Check:**
   - Scan all worker packages (e.g., `packages/worker/`, `packages/pdf-orchestrator/`, `packages/macro-engine/`).
   - Ensure the `name` field is explicitly distinct from Beta. It should use an alpha suffix:
     - Example: `name = "metamorfit-worker-alpha"`
     - Example: `name = "metamorfit-pdf-orchestrator-alpha"`

2. **KV Namespace & R2 Bucket Binding Check:**
   - Verify that your KV namespaces and R2 storage bindings point strictly to alpha testing slots:
     ```toml
     # Example Alpha KV Binding
     [[kv_namespaces]]
     binding = "MM_LEDGER"
     id = "YOUR_ALPHA_SPECIFIC_KV_ID" # NOT your production Beta KV ID
     
     # Example Alpha R2 Binding
     [[r2_buckets]]
     binding = "PDF_BUCKET"
     bucket_name = "metamorfit-pdf-alpha" # NOT production Beta bucket
     ```

---

## STEP 2: Scrape for Hardcoded Production Production Tokens
Ensure no real live Beta Stripe credentials, private keys, or tracking tags accidentally leaked from local testing files into commit history.

1. Scan all configuration files (`.env`, `.env.local`, `.dev.vars`, `wrangler.toml`) within the repo path.
2. Ensure any active environment settings explicitly point to sandbox/test configurations:
   - `STRIPE_SECRET_KEY` → Must be a `sk_test_...` key.
   - `GOTENBERG_URL` → Verify it points strictly to our new Google Cloud Run URL (`https://gotenberg-alpha-15308390055.us-central1.run.app`).
3. Add any raw private credential files containing true production credentials (like your machine's global `.env.production` files) directly to your root `.gitignore` file so they cannot be tracked.

---

## STEP 3: Configure GitHub Deployment Origin
Once Steps 1 and 2 pass with absolute confidence, we initialize a clean git tree to target our isolated Alpha home on GitHub.

1. **Verify Git Identity:** Ensure the local repository git configuration tracks the Alpha pipeline.
2. **Execute Clean Remote Initialization:**
   ```bash
   git init
   git remote add origin [https://github.com/metamorfitnet-hash/metamorfit-alpha-version.git](https://github.com/metamorfitnet-hash/metamorfit-alpha-version.git)
   git checkout -b main