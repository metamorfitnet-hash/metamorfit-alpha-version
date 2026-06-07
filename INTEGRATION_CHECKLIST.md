# 🚀 Metamorfit Beta: Final Integration Checklist

This document outlines the remaining accounts you need to set up and the specific credentials required to activate the "Stable Beta" features we implemented today.

---

## 1. Supabase (Identity & Auth)
We have integrated Supabase for the **Identity Layer** and **User Gallery**.
*   **Step 1**: Go to [supabase.com](https://supabase.com) and create a new project called `metamorfit-beta`.
*   **Step 2**: Go to **Project Settings > API**.
*   **Information Needed**:
    *   `NEXT_PUBLIC_SUPABASE_URL`: (Paste here or in Vercel)
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Paste here or in Vercel)
    *   `SUPABASE_SERVICE_ROLE_KEY`: (🚨 Private - Put this in Vercel/Wrangler Secrets only)

---

## 2. Sentry (Observability)
We have wrapped the Worker and Frontend in Sentry for real-time error tracking.
*   **Step 1**: Create an account at [sentry.io](https://sentry.io).
*   **Step 2**: Create two projects: `metamorfit-web` (Next.js) and `metamorfit-worker` (Cloudflare).
*   **Information Needed**:
    *   `SENTRY_DSN`: (For the Worker - run `npx wrangler secret put SENTRY_DSN`)
    *   `NEXT_PUBLIC_SENTRY_DSN`: (For the Frontend - put in Vercel)

---

## 3. Fly.io (Gotenberg PDF Engine)
Your Gotenberg instance is currently running at `https://metamorfit-v2.fly.dev`.
*   **Step 1**: Ensure you have access to the [fly.io](https://fly.io) dashboard to monitor the health of the PDF engine.
*   **Action**: No new keys needed, but keep an eye on the "Usage" to ensure it's within free/hobby tier limits.

---

## 4. Environment Variables Summary
To make the app live, ensure these variables are set in your **Vercel Dashboard** (for the web app) and via **Wrangler Secrets** (for the worker).

### 🌐 Vercel (Frontend)
| Key | Value |
|---|---|
| `WORKER_URL` | `https://metamorfit-worker-beta.metamorfitnet.workers.dev` |
| `HMAC_SECRET` | (Your random 32-char string) |
| `ADMIN_PASSWORD` | (Felipe's secret login) |
| `NEXT_PUBLIC_SUPABASE_URL` | (From Step 1) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (From Step 1) |

### ⚡ Wrangler (Worker)
Run `npx wrangler secret put <KEY>` for each:
| Key | Purpose |
|---|---|
| `HMAC_SECRET` | Must match Vercel exactly |
| `SYSTEME_API_KEY` | For CRM Sync |
| `RESEND_API_KEY` | For Email Delivery |
| `SENTRY_DSN` | For Error Tracking |

---

## ✅ Next Steps for Felipe
1.  **Paste the keys** into this chat once the accounts are open.
2.  **I will verify** the connection using our new `/api/debug/health` route.
3.  **Close the laptop** and get some rest—the heavy lifting is done!
