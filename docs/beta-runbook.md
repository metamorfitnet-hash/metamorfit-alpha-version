# 📖 Metamorfit Beta: Operational Runbook

This runbook operationalizes the `BETA_TESTING_GUIDE.md` into a concrete workflow for developers and testers.

---

## 1. Infrastructure Initialization
Prepare the Cloudflare and Supabase environments.

### Steps:
1.  **Apply D1 Schema**:
    ```bash
    ./scripts/d1-apply-schema.sh
    ```
    *Expected Output*: `✅ Schema applied successfully.`

2.  **Upload Secrets**:
    Run these manually and provide values from `Implementation File.txt`:
    ```bash
    npx wrangler secret put HMAC_SECRET
    npx wrangler secret put SYSTEME_API_KEY
    npx wrangler secret put BREVO_API_KEY
    npx wrangler secret put SENTRY_DSN
    npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
    ```

3.  **Apply Supabase Schema**:
    Copy `supabase_schema.sql` into the Supabase SQL Editor.

### Troubleshooting:
- **D1 Failure**: Check `wrangler.toml` for correct `database_id`.
- **Secret Error**: Ensure you are in the project root and `wrangler` is logged in.
- **Supabase Error**: Check if RLS is already enabled or if table names conflict.

---

## 2. Worker Health Check
Verify the Worker's internal connections.

### Steps:
- Open: `https://metamorfit-worker-beta.metamorfitnet.workers.dev/api/debug/health`

### Expected Output:
```json
{
  "status": "ok",
  "systems": { "kv": "ok", "d1": "ok", "r2": "ok" }
}
```

### Troubleshooting:
- **500 Error**: One of the bindings (KV, D1, R2) is missing in `wrangler.toml`.
- **404 Error**: The Worker is not deployed. Run `cd packages/worker; npx wrangler deploy`.

---

## 3. PDF Pipeline & Brevo Email Test
Test the full generation and delivery flow.

### Steps:
1.  **Run Test**:
    ```bash
    ./scripts/test-pdf-pipeline.sh
    ```
    *Expected Output*: `SUCCESS! Job ID: <uuid>`

2.  **Verify DB**:
    ```bash
    ./scripts/d1-list-user-plans.sh
    ```
    *Expected Output*: A row with the corresponding `job_id` and status `emailing` or `completed`.

### Troubleshooting:
- **Brevo 401**: `BREVO_API_KEY` is incorrect or missing.
- **Satori/Renderer Error**: Check Worker logs via `npx wrangler tail`.

---

## 4. Identity Sync & Gallery Test
Verify Supabase-to-Worker authentication and data linking.

### Steps:
1.  Log in to the frontend.
2.  Submit a plan.
3.  Check the "Gallery" page.

### Troubleshooting:
- **No plans in gallery**: Check if `/api/auth/sync` was called and if `supabase_id` is being correctly populated in D1.
- **Auth Error**: Verify `NEXT_PUBLIC_SUPABASE_URL` and `ANON_KEY` in `.env.local`.

---

## 5. Admin Dashboard Test
Verify observability and secure admin access.

### Steps:
- Visit `/admin` and enter the password from `Implementation File.txt`.

### Troubleshooting:
- **Invalid Password**: Ensure `ADMIN_PASSWORD` is set in Vercel/Env.
- **Stats not loading**: Check if the Worker's `/api/admin/stats` route is reachable.

---

## 6. Sentry Error Tracking
Ensure runtime errors are captured.

### Steps:
1.  Break the `BREVO_API_KEY` temporarily.
2.  Run `./scripts/test-pdf-pipeline.sh`.
3.  Verify the error appears in your Sentry dashboard.

### Troubleshooting:
- **No error in Sentry**: Check if `SENTRY_DSN` is correctly set in Wrangler secrets.
- **Frontend Sentry missing**: Ensure `apps/web` has the `@sentry/nextjs` package and config files.
