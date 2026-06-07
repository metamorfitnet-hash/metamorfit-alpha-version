# 🏗️ Metamorfit Beta: Comprehensive Technical Audit

---

## 1. Full Architecture Description

The Metamorfit Beta is a highly decoupled, serverless, and edge-native application designed around an asynchronous, event-driven pipeline.

**Frontend Structure:**
The frontend is a Next.js 15 application utilizing the modern App Router (`apps/web`). It acts as the presentation layer, collecting user data (like metabolic stats and goals) through React components like the `EmailGateModal`.

**API Proxy Layer:**
Instead of exposing the backend worker directly to the public, the frontend utilizes Next.js API routes (e.g., `/api/send-pdf`) configured to run on the Vercel Edge Runtime. This layer validates incoming data, signs the payload using an HMAC secret, and acts as a secure, fast proxy to the backend.

**Backend Structure (The Core Worker):**
The operational heart of the app is a Cloudflare Worker (`packages/worker`). It uses manual routing in `index.ts` to handle various endpoints. Its primary job is orchestration. When it receives a request, it generates a `jobId`, initializes database records, and immediately returns an HTTP 202 (Accepted) response to free up the client.

**The Async Pipeline (ctx.waitUntil):**
The true magic happens post-response via Cloudflare's `ctx.waitUntil()`. The worker executes a sequential background pipeline:
1. **AI Generation Layer**: Calls Cloudflare's Workers AI to generate a custom metabolic explanation using a Llama-3 model.
2. **PDF Rendering Layer**: Converts raw data into HTML using React (`renderToStaticMarkup`), then posts that HTML to a headless Gotenberg service hosted on Fly.io to generate the PDF bytes.
3. **Storage Layer**: Saves the PDF bytes directly to a Cloudflare R2 bucket.
4. **Email Dispatch Layer**: Formats an HTML email (using `@react-email`) and dispatches it via the Brevo API with the R2-generated PDF attached.
5. **CRM Integration Layer**: Fires a request to Systeme.io to create a contact profile and apply relevant marketing tags.

**State & Storage:**
The system uses **Cloudflare KV** as an ephemeral scratchpad to track the real-time status of the pipeline (so the frontend can poll it). It uses **Cloudflare D1** (SQLite) to persistently log the job metrics, errors, and latency. Separately, **Supabase** handles user authentication and maintains a mirrored profile/plan database via PostgreSQL.

---

## 2. Tools & Services — Deep Explanation

### Vercel & Edge Runtime
Hosts the Next.js frontend. The API routes are explicitly set to `export const runtime = "edge"`, meaning they execute on V8 isolates rather than Node.js servers. This is optimal as it prevents cold starts and bypasses Vercel's standard 10-second serverless timeout.

### Cloudflare Workers
The main backend engine. It orchestrates the entire async pipeline flawlessly. It is highly optimized, scaling instantly globally, and is heavily instrumented with Sentry for error tracking.

### Cloudflare KV
Used for `JOB_STATUS` and `MEAL_CACHE`. Optimal use case: the frontend polls KV for status updates, which is incredibly fast and cheap for read-heavy operations.

### Cloudflare D1
Used as the relational logging database (`METAMORFIT_DB`). It tracks `user_plans` (job IDs, latency, error codes).

### Cloudflare R2
Used for storing generated PDFs (`PDF_STORAGE`). Highly optimal—S3 compatible but with zero egress fees.

### Supabase
Used for Auth and persistent user profiles (`supabase_schema.sql`). It utilizes Row Level Security (RLS) to ensure users only see their own plans.

### Fly.io & Gotenberg
Gotenberg is an API-driven PDF generator utilizing headless Chromium. Because Chromium is too heavy for a Cloudflare Worker, it is containerized and hosted on Fly.io (`packages/gotenberg`). **Configuration Risk:** The `fly.toml` is currently configured with `auto_stop_machines = true`, meaning the machine shuts down when idle.

### Cloudflare Workers AI
Utilized via `env.AI.run("@cf/meta/llama-3.1-8b-instruct")` in `aiService.ts` to generate dynamic, personalized explanations of the user's macros.

### Brevo (Email Provider)
The transactional email provider. Configured in `emailService.ts` to send the final PDF via REST API. (Note: `resend` is listed in your `package.json`, but Brevo is the actual provider used in the code).

### Systeme.io (CRM)
The CRM provider. The `crmService.ts` intelligently handles tag application and contact creation, gracefully catching 409 (Conflict) errors if the contact already exists to resolve their ID.

### Sentry (Observability)
Fully integrated across the stack (Client, Next.js Server, Edge, and Cloudflare Worker). In the worker, explicit `Sentry.captureException()` and breadcrumbs are used to track failures deep inside the background pipeline.

---

## 3. Workers & Projects — Full Mapping

Based on the workspace, there are effectively three backend environments defined:

### 1. `packages/worker` (The Cloudflare Worker - Active/Production)
- **What it does:** The primary API and pipeline orchestrator.
- **Inputs:** Validated JSON payloads containing user biometrics.
- **Outputs:** HTTP 202, PDF files (to R2), Emails (via Brevo), CRM data (to Systeme.io).
- **Status:** **Active**. This is the true production backend.

### 2. `packages/gotenberg` (Fly.io Service - Active/Dependency)
- **What it does:** A microservice dedicated purely to turning HTML into PDF bytes.
- **Inputs:** Multipart form data (HTML string).
- **Outputs:** PDF binary stream.
- **Status:** **Active**. The Cloudflare Worker depends entirely on this.

### 3. `packages/pdf-worker` (Fly.io Node Server - Redundant/Legacy)
- **What it does:** A Node.js server using Hono, designed to run the *entire* pipeline (PDF rendering, email sending) directly on Fly.io instead of Cloudflare.
- **Status:** **Redundant/Conflicting**. This represents an alternate architectural path (running the backend on Node instead of Edge). It currently conflicts with the Cloudflare Worker architecture. **It should be removed** to prevent developer confusion and fragmented logic.

---

## 4. Free Tier Analysis

### Cloudflare Ecosystem (Workers, KV, D1, R2)
Exceptionally safe. The free tiers here (100k requests/day for Workers, generous reads for KV/D1, no egress for R2) mean you can scale this significantly before paying a dime. Usage is highly optimal.

### Supabase
The free tier supports 500MB of database space and 50,000 MAU for authentication. Safe for Beta, but requires monitoring if the user base explodes.

### Fly.io (Gotenberg)
Free tier allows up to 3 shared-cpu-1x VMs with 256MB RAM. **Risk:** Headless Chromium (Gotenberg) is memory-intensive. PDF rendering under load might exceed 256MB, causing Out-Of-Memory (OOM) crashes on the free tier.

### Brevo
The free tier is strictly limited to **300 emails per day**. **High Risk:** If a marketing campaign goes viral, the pipeline will hard-fail on the email stage once this limit is hit.

---

## 5. Limitations, Bottlenecks, and Reliability Risks

### Gotenberg Cold Starts (Performance Risk)
Because `auto_stop_machines = true` is set in the Fly.toml, the PDF renderer goes to sleep. The first user to request a plan after a period of inactivity will trigger a machine wake-up. This adds 3-10 seconds to the pipeline. If the wake-up is too slow, the Cloudflare Worker's fetch request to Gotenberg might time out.

### Split-Brain Database (Data Consistency Risk)
You have relational data living in two places: Cloudflare D1 (`METAMORFIT_DB`) tracks worker jobs, and Supabase tracks user identities and a mirrored `user_plans` table. If the Cloudflare pipeline succeeds but fails to sync that status to Supabase, your frontend UI (which reads from Supabase) will be out of sync with reality.

### KV Polling Mechanism (Scalability Risk)
The frontend constantly pings the `/api/status/:jobId` endpoint every few seconds. While KV handles this easily, it generates unnecessary network traffic and provides a clunky UX compared to a persistent connection.

### OOM Risk on Fly.io (Stability Risk)
If multiple users request PDFs at the exact same millisecond, the Gotenberg container on a minimal RAM tier will likely crash, failing the PDF generation stage.

### Brevo Rate Limit (Scale Bottleneck)
The 300 emails/day free tier cap is a hard ceiling. There is no fallback or queue mechanism in the current architecture to handle overflow gracefully.

### Redundant Dependency: `resend` Package
The `resend` package (v6.10.0) is listed in `packages/worker/package.json` as a dependency, but the actual email sending logic in `emailService.ts` uses the Brevo API via raw `fetch()`. This is dead weight in the bundle.

---

## 6. End‑to‑End System Flow

1. **User Action**: A user interacts with the `EmailGateModal` on the Next.js frontend, entering their name, email, and macro data, then clicks "Generate".
2. **API Proxy**: The Next.js Edge route `/api/send-pdf` receives the JSON. It validates the presence of an email and name, uses `HMAC_SECRET` to cryptographically sign the payload with a timestamp, and forwards it to the Cloudflare Worker.
3. **Worker Initialization**: The Cloudflare Worker verifies the HMAC signature. It generates a unique `jobId`, writes an initial "pending" state to D1 and KV, and immediately fires a `202 Accepted` response back down the chain to the user.
4. **Frontend Waiting**: The user sees a loading spinner. The frontend begins polling the `/api/status/:jobId` endpoint.
5. **Background Pipeline (`ctx.waitUntil`)**:
   - **AI**: Calls Cloudflare Llama 3 to write a personalized paragraph about the user's macros.
   - **HTML to PDF**: React converts the data into an HTML string. This is POSTed to the sleeping Gotenberg service on Fly.io, which wakes up, renders the PDF, and returns the bytes.
   - **R2 Storage**: The bytes are uploaded to Cloudflare R2 as `pdfs/{jobId}.pdf`.
   - **Email**: The worker calls the Brevo API, constructing a React-Email HTML body and attaching the PDF bytes via Base64 encoding.
   - **CRM**: Finally, Systeme.io is called to log the contact and apply tags.
6. **Completion**: The worker updates D1 and KV to "complete". On the next poll, the frontend sees "complete", fires the confetti animation, and redirects the user to the dashboard.

---

## 7. Upgrade Recommendations (Prioritized by Impact)

### 1. Consolidate the Backend (Architectural) — HIGH PRIORITY
- **Action:** Delete the `packages/pdf-worker` directory.
- **Reasoning:** The Cloudflare Worker (`packages/worker`) is beautifully constructed, resilient, and fully leverages edge computing. The legacy Fly.io Node worker creates severe architectural ambiguity and codebase bloat.

### 2. Harden Gotenberg Configuration (Reliability) — HIGH PRIORITY
- **Action:** In `packages/gotenberg/fly.toml`, change `auto_stop_machines` to `false`, or set `min_machines_running = 1`.
- **Reasoning:** Prevents cold starts. You trade a slight increase in Fly.io resource usage for a massive improvement in pipeline reliability and speed.

### 3. Unify the Database Layer (Data Consistency) — MEDIUM PRIORITY
- **Action:** Deprecate Cloudflare D1. Have the Cloudflare Worker write job statuses directly to the Supabase PostgreSQL database via the Supabase REST API.
- **Reasoning:** Eliminates the split-brain issue. Supabase becomes the single source of truth for both Auth and relational data, massively simplifying mental overhead and ensuring data consistency.

### 4. Remove Dead Dependencies (Cleanup) — MEDIUM PRIORITY
- **Action:** Remove the `resend` package from `packages/worker/package.json`.
- **Reasoning:** The email service uses Brevo via raw fetch. The Resend SDK is unused dead weight that inflates the worker bundle and creates confusion about which email provider is active.

### 5. Implement Real-Time UX (Performance/UX) — LOW PRIORITY, HIGH UX
- **Action:** Replace KV polling in the frontend with Supabase Realtime subscriptions.
- **Reasoning:** Once the worker updates the status in Supabase, the UI updates instantly without requiring the browser to spam `fetch` requests every two seconds.

### 6. Monitor Brevo Limits (Billing/Scale) — ONGOING
- **Action:** Either upgrade the Brevo tier or configure a fallback mechanism (e.g., queue jobs in KV and retry at a throttled rate).
- **Reasoning:** The 300 emails/day limit on the free tier is the most immediate hard bottleneck to scaling the Beta to public users.

---

## 8. Final Summary

| Layer | Technology | Status | Risk Level |
|---|---|---|---|
| Frontend | Next.js 15 (Vercel) | ✅ Active | Low |
| API Proxy | Vercel Edge Runtime | ✅ Active | Low |
| Backend Worker | Cloudflare Workers | ✅ Active | Low |
| PDF Renderer | Gotenberg on Fly.io | ✅ Active | **Medium** (cold starts, OOM) |
| Legacy Worker | pdf-worker (Hono/Fly) | ⚠️ Redundant | **High** (architectural confusion) |
| Job Status | Cloudflare KV | ✅ Active | Low |
| Persistent DB | Cloudflare D1 | ✅ Active | **Medium** (split-brain with Supabase) |
| Auth & Profiles | Supabase | ✅ Active | Low |
| PDF Storage | Cloudflare R2 | ✅ Active | Low |
| AI Insights | Cloudflare Workers AI | ✅ Active | Low |
| Email | Brevo API | ✅ Active | **Medium** (300/day cap) |
| CRM | Systeme.io | ✅ Active | Low |
| Observability | Sentry | ✅ Active | Low |

The Metamorfit Beta architecture is fundamentally sound and well-engineered. The primary risks are operational (Gotenberg cold starts, Brevo rate limits) and organizational (redundant workers, split databases). Addressing the high-priority items above will transform this from a functional beta into a production-hardened system.
