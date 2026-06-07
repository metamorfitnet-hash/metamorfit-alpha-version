# 🧪 Metamorfit Beta: End-to-End Testing Guide

This guide provides the exact steps and commands to verify that your Supabase, Sentry, Brevo, and Cloudflare infrastructure is correctly integrated and ready for users.

---

## 1. Infrastructure Initialization (Run Once)

Before testing, ensure your remote databases and secrets are set up.

### A. Apply D1 Schema
```bash
npx wrangler d1 execute METAMORFIT_DB --remote --file=schema.sql
```

### B. Upload Worker Secrets
Run each of these and paste the values from your `Implementation File.txt`:
```bash
npx wrangler secret put HMAC_SECRET
npx wrangler secret put SYSTEME_API_KEY
npx wrangler secret put BREVO_API_KEY
npx wrangler secret put SENTRY_DSN
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

---

## 2. Worker Health Check
Verify that the Worker can talk to KV, D1, and R2.

**Action**: Open your browser and visit:
`https://metamorfit-worker-beta.metamorfitnet.workers.dev/api/debug/health`

**Expected Result**:
```json
{
  "status": "ok",
  "systems": {
    "kv": "ok",
    "d1": "ok",
    "r2": "ok"
  }
}
```

---

## 3. PDF Pipeline & Brevo Email Test
Test the full "Lead to Email" flow using the included test script.

**Action**: Run the test script from the root:
```bash
node test-fetch.js
```

**Validation**:
1.  **Terminal**: Should output `SUCCESS! Job ID: <uuid>`.
2.  **Email**: Check your inbox (or the test email used) for a PDF attachment from `hello@metamorfit.com`.
3.  **Brevo Dashboard**: Go to **Transactional > Logs** to see the API request success.
4.  **D1**: Run `npx wrangler d1 execute METAMORFIT_DB --remote --command="SELECT * FROM user_plans"` to see the logged event.

---

## 4. Identity Sync & Gallery Test
Verify that Supabase Auth correctly links plans to users.

**Action**:
1.  Go to the frontend and **Sign In** (Magic Link).
2.  Once logged in, the app should call `/api/auth/sync`.
3.  Submit a new plan while logged in.

**Validation**:
- Visit the **Gallery** page. The new plan should appear instantly.
- The `user_plans` table in D1 should now have your Supabase `user_id` in the `supabase_id` column.

---

## 5. Admin Dashboard Test
Verify the secure analytics layer.

**Action**:
1.  Go to `https://metamorfit.pro/admin` (or your local dev URL).
2.  Enter the **Admin Password** from your secrets file.

**Expected Result**:
- The dashboard should unlock and show charts for "Total Plans", "Success Rate", and "Avg Latency".
- If the previous tests failed, you should see the error messages in the "Recent Critical Failures" table.

---

## 6. Sentry Error Tracking
Verify that failures are being captured.

**Action**:
1.  Temporarily change the `BREVO_API_KEY` in Wrangler to an invalid value.
2.  Run `node test-fetch.js` again (it will fail).
3.  Check your **Sentry Dashboard** under the `metamorfit-worker` project.

**Expected Result**:
- You should see a new issue: `Error: Brevo Error: 401`.
- It should include tags for the `jobId` and `userEmail`.
