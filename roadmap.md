# Metamorfit — MVP to Stable Beta: Full Architecture Roadmap
### Codebase-Grounded | Edge-Native | Free-Tier Optimized

---

## What The Code Actually Shows (Ground Truth)

Before the roadmap, here is what the codebase reveals that the architecture doc did not fully capture:

**Frontend (`metamorfit-mvp`)**
- Next.js 16.2.1 on Vercel, App Router, React 19
- `next.config.ts` is completely empty — no edge runtime, no caching headers, no custom rewrites
- Three Vercel serverless API routes: `/api/send-pdf`, `/api/calculator`, `/api/estimate-macros`
- `callWorkerForPdf()` in `worker.ts` runs on Vercel with a 35-second `AbortController` timeout — this is the primary upstream fragility point
- `EmailGateModal.tsx` POSTs to `/api/send-pdf` (Vercel) which proxies to the Worker; there is an unnecessary Vercel hop on every plan submission
- No Zod, no schema validation library — validation is manual regex in the route handler
- No job tracking, no polling, no status UI — the modal transitions directly to "Plan Sent!" and redirects to `/thank-you`
- No Supabase, no D1, no R2 anywhere in the frontend

**Worker (`metamorfit-worker`)**
- `wrangler.jsonc` declares: `AI` binding, one KV namespace (`MEAL_CACHE`), `nodejs_compat` flag, source maps, observability enabled
- Smart Placement is commented out — not active
- No D1, no R2, no Queue bindings declared
- `resvgInitialized` and `fontsCache` are module-scope variables — WASM and font caching are already partially implemented, but the WASM is still imported from a local asset path (`./assets/resvg-wasm.wasm`) and initialized lazily inside `initResvgIfNecessary()`, not at true module top-level
- The Worker is a monolithic `index.ts` handling three routes: `/api/send-pdf`, `/estimate` (macro estimation), `/api/explain` (AI explanation)
- `mealCache.ts` is fully implemented with KV hash-check → AI → KV-write pattern — this is the most mature caching logic in the codebase
- `hashMeal.ts` uses `crypto.subtle.digest` — correct and edge-native
- `normalizeMeal.ts` is minimal but functional
- PDF pipeline in `renderer.tsx` still uses Satori → resvg → pdf-lib (the Gotenberg migration from the previous analysis has NOT yet been applied to this code)
- `explanation.ts` uses `@cf/meta/llama-3.1-8b-instruct` with 800 max tokens — no retry, no structured output enforcement
- Systeme.io integration: sequential tag application after contact creation, with a `setTimeout(r, 200)` delay — fragile in a `waitUntil()` context
- `PersonalizedPlanEmail.tsx` renders a minimal React Email template — no dynamic plan data injected into the email body itself (only name is used)
- Auth is a single Bearer token comparison: `authHeader !== \`Bearer ${expectedToken}\`` — static, no rotation, no HMAC

**Critical gaps identified from code:**
1. Vercel's 35s timeout on `/api/send-pdf` is live and is the primary reliability risk — if the Worker takes longer than 35 seconds wall-clock, Vercel kills the connection and the user sees an error even though the Worker continues in `waitUntil()`
2. The frontend has no awareness of async completion — it shows "Plan Sent!" before the PDF has been generated or emailed
3. No observability on `waitUntil()` failures — Cloudflare's built-in observability (`"observability": { "enabled": true }`) logs Worker requests but not background task failures
4. The Gotenberg migration described in previous sessions has not been applied to the Worker codebase — renderer.tsx still runs the full Satori + resvg + pdf-lib stack
5. Font caching (`fontsCache`) works for warm Workers but fonts are still full-weight (not subsetted) — the Inter fallback fonts are loaded alongside the primary DM Sans / Bebas Neue fonts, inflating memory

---

## Phase 1: Immediate Fixes (0–2 Days)

**Goal**: Eliminate the two live reliability risks that can silently fail for users today.

---

### Step 1.1 — Fix the Vercel Timeout Disconnect

**The problem**: `callWorkerForPdf()` uses a 35-second `AbortController` timeout. Vercel Hobby functions have a 10-second execution limit. These two numbers are irreconcilable. If the Worker takes >10 seconds to respond (which it does — it's running Satori + resvg + pdf-lib), Vercel kills the function and the frontend receives a network error. The user sees the error banner in `EmailGateModal`, even though the Worker's `waitUntil()` task is still running and will eventually send the email.

**The fix**: The Worker already returns `200 OK` immediately after `ctx.waitUntil()` is registered (it returns `"PLAN_GENERATION_STARTED_CHECK_EMAIL"`). The problem is that Vercel's `/api/send-pdf` route awaits `callWorkerForPdf()` which itself awaits the full Worker response — so Vercel is still holding the connection open waiting for the Worker's immediate 200.

This should resolve itself because the Worker does return 200 immediately — but the 35-second timeout means if Vercel's own limit is hit first (which it will be on cold starts or slow networks), the abort fires. The fix is to reduce the timeout in `callWorkerForPdf()` to 9 seconds (safely under Vercel's 10s limit) so that the abort and the Vercel timeout never race. Since the Worker always returns immediately, 9 seconds is more than sufficient.

**Where**: `src/lib/worker.ts` — change `35_000` to `9_000`.

**Also**: Add an explicit check in `/api/send-pdf/route.ts`: if the Worker returns `{ pdf: "PLAN_GENERATION_STARTED_CHECK_EMAIL" }`, treat it as success regardless of whether a PDF buffer is present. The current code already does `await callWorkerForPdf(body)` and discards the return value — verify this path is clean and the 200 response reaches the frontend reliably.

---

### Step 1.2 — Promote WASM Initialization to True Module Top-Level

**The problem**: `renderer.tsx` uses a module-scope boolean `resvgInitialized` and an `initResvgIfNecessary()` guard function called inside the render path. This is correct logic but not true module-scope initialization. True module-scope initialization in Cloudflare Workers ES module format means using a top-level `await` outside any function — this executes during the Worker's startup phase, which has a separate and more generous CPU budget than request execution.

**The fix**: In `renderer.tsx`, move `await initWasm(resvgWasm)` to a module-scope top-level `await` expression. Remove `resvgInitialized`, remove `initResvgIfNecessary()`, and remove the call to it inside `renderSvgToPng`. The Resvg constructor will be usable immediately in any function without guard logic.

```
// Module scope — runs during Worker boot, not during request handling
await initWasm(resvgWasm);
```

This is the single highest-impact CPU change that was not yet applied.

---

### Step 1.3 — Font Subsetting at Build Time

**The problem**: The Worker loads 7 font files: Inter Regular, Medium, SemiBold (legacy), Bebas Neue Regular, DM Sans Regular, Medium, SemiBold. These are full Unicode TTF files, each 200–600KB, loaded via Wrangler's `Data` rule and cached in `fontsCache` after first parse. Full glyph table parsing for each font happens once per isolate lifetime — but the tables themselves are large and Satori's OpenType parser is doing more work than necessary.

**The fix**: At build time, use `pyftsubset` (Python fonttools) to produce Latin-subset versions of each font, covering only the Unicode ranges actually used in a nutrition PDF (U+0020–U+007E for ASCII, U+00C0–U+00FF for accented Latin). Target output: each font under 30KB. Commit the subset `.ttf` files to the Worker's `assets/fonts/` directory and update the imports in `renderer.tsx` to use the subset versions.

Additionally: remove the 3 Inter legacy fonts from production. The template should use DM Sans + Bebas Neue exclusively. Inter is loaded as a fallback "for un-refactored sections" — audit the template and eliminate the dependency rather than carrying 3 extra font files indefinitely.

**Expected result**: Font bundle size reduction from ~2MB to ~150KB. Parse time reduction of 80%.

---

## Phase 2: Core Architecture (3–7 Days)

**Goal**: Add job tracking, status observability, and fix the silent-failure UX problem.

---

### Step 2.1 — KV Job Tracking (Foundation for Everything Downstream)

**The problem**: After submission, the user is redirected to `/thank-you` with no knowledge of whether the PDF was actually generated or emailed. If Systeme.io times out, if Resend rejects the attachment, or if resvg hits a CPU limit inside `waitUntil()`, the user gets no email and has no recovery path. The error is visible only in Cloudflare logs.

**The design**: Use the existing `MEAL_CACHE` KV namespace temporarily (or add a second KV namespace `JOB_STATUS`) to store job state. On Worker entry (before `ctx.waitUntil()`), write a job record. Update it at each pipeline stage. Expose a read-only `/api/status/:jobId` endpoint.

**Job record schema**:
```json
{
  "jobId": "uuid-v4",
  "status": "pending | generating | emailing | complete | failed",
  "stage": "pdf | crm | email",
  "email": "user@example.com",
  "createdAt": 1718000000000,
  "completedAt": null,
  "error": null
}
```

**KV key**: `job:{jobId}` with TTL of 86400 (24 hours).

**Worker changes**:
- On route entry: `crypto.randomUUID()` → write `pending` record to KV → return `{ success: true, jobId }` in the immediate 200 response
- Inside `processRequest()`: update status to `generating` before Satori, `emailing` before Resend, `complete` after success, `failed` with error message on any catch
- Add `/api/status/:jobId` route: KV read → return the job record as JSON

**Frontend changes** (`EmailGateModal.tsx`):
- Store returned `jobId` in component state
- After receiving `{ success: true, jobId }`, transition to a "Generating your plan..." state rather than immediately showing "Plan Sent!"
- Begin polling `/api/status/:jobId` via the Vercel proxy (or directly against the Worker — see Phase 4) every 4 seconds
- On `complete`: show "Your plan is on its way! 📬" and redirect to `/thank-you`
- On `failed`: show the error state with a retry CTA

**Why this must come first in Phase 2**: Every subsequent improvement (retries, observability, re-send) depends on having a job record in KV.

---

### Step 2.2 — Structured AI Output with JSON Schema Enforcement

**The problem**: `getAiExplanation()` in `explanation.ts` returns a raw string from `@cf/meta/llama-3.1-8b-instruct`. This string is injected directly into the PDF template via `payload.explanation`. If the AI returns a response with unexpected formatting, extra tokens, refusal language, or truncated output (possible at 800 max_tokens for 3 paragraphs), the PDF template receives corrupted content. There is no validation between AI output and template injection.

**The fix**: Update the prompt in `buildExplanationPrompt()` to require JSON output with a defined schema:
```json
{
  "paragraph1": "string",
  "paragraph2": "string", 
  "paragraph3": "string"
}
```

Add `JSON.parse()` with a try/catch wrapping the AI response extraction. On parse failure, fall back to a hardcoded metabolically-accurate placeholder text that is safe for injection into the PDF. This eliminates an entire class of silent PDF rendering failures.

Additionally, reduce `max_tokens` from 800 to 500. Three short paragraphs of plain text do not require 800 tokens; reducing this improves inference latency and reduces the chance of the model generating trailing content.

---

### Step 2.3 — Input Validation with Zod (Both Frontend and Worker)

**The problem**: `/api/send-pdf/route.ts` validates only `fullName` and `email` with manual string checks. The full `workerPayload` from `EmailGateModal.tsx` contains a deeply nested structure (`identity`, `metabolicProfile`, `personalization`, `notes[]`, `meals[]`) that reaches the Worker with no structural validation. In `renderer.tsx`, `normalizePayload()` applies defensive defaults — but this is the last line of defense, and a malformed payload that passes Vercel's weak validation can still crash Satori's text nodes.

**The fix**: Install `zod` in both packages. Define a shared schema (or duplicate it as a TypeScript interface in both codebases) for `DeliveryPayload`. Validate in two places:
1. In `/api/send-pdf/route.ts` on Vercel — return structured `400` errors before the payload reaches the Worker
2. In the Worker's route handler in `index.ts` — validate again as the authoritative trust boundary

This replaces the current `normalizePayload()` defensive pattern with schema-driven validation that produces actionable error messages.

---

## Phase 3: Database + Storage Integration (Days 7–14)

**Goal**: Introduce the first persistence layer. Make the system observable, recoverable, and analytics-aware.

---

### Step 3.1 — Add Cloudflare D1 as the Analytics + Job Event Store

**Why D1 before Supabase**: D1 is native to the Cloudflare ecosystem (same `wrangler.jsonc` binding, no external network hop, no credentials to manage). It is free at 5GB storage and 5M reads/day. It is the right choice for event data that the Worker writes — adding Supabase at this stage would introduce a cross-network write on every request from the Worker, adding latency and a new failure mode.

**What to store in D1**:
- `plan_events` table: `job_id`, `email_hash` (SHA-256 of email — no PII in the analytics store), `status`, `stage_reached`, `created_at`, `completed_at`, `duration_ms`, `error_type`
- `macro_sessions` table: `session_id`, `body_type`, `goal`, `activity_level`, `target_kcal`, `protein_g`, `carbs_g`, `fats_g`, `created_at` — anonymized metabolic profiles for aggregate analysis

**wrangler.jsonc addition**:
```json
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "metamorfit-analytics",
    "database_id": "<create via wrangler d1 create>"
  }
]
```

**Worker writes**: Inside `processRequest()` in `index.ts`, write to D1 at job start and job completion. These are fire-and-forget `ctx.waitUntil()` sub-tasks — D1 write failures must not block the PDF pipeline.

**What this unlocks**: For the first time, you can answer: "How many plans were generated this week? What percentage failed? At which stage? What is the median pipeline duration?"

---

### Step 3.2 — Separate KV Namespaces by Concern

**The problem**: `MEAL_CACHE` is the only KV namespace and is used for meal macro caching. Job records (from Step 2.1) are being written to the same namespace, mixing two concerns with different TTL requirements (meal cache: indefinite; job records: 24 hours).

**The fix**: Add a second KV namespace in `wrangler.jsonc`:
```json
{
  "binding": "JOB_STATUS",
  "id": "<create via wrangler kv:namespace create>"
}
```

Migrate the job record writes from Phase 2.1 to `JOB_STATUS`. Keep `MEAL_CACHE` exclusively for meal macro caching. This separation makes each namespace's data semantics clear and allows different TTL strategies per namespace.

---

### Step 3.3 — Supabase: Introduce After D1 is Stable

**When to introduce Supabase**: Only after D1 is delivering analytics data and job tracking is stable. Supabase is the right choice for future user-facing features — specifically user accounts, saved plans, and plan history — because it provides Auth, Row Level Security, and a Postgres query interface that D1's SQLite cannot match for relational complexity.

**What Supabase handles** (Phase 3, later half):
- User authentication (magic link email — no password required for MVP)
- `users` table: linked to Supabase Auth
- `saved_plans` table: `user_id`, `job_id`, `payload_json`, `created_at` — stores the full plan payload for re-generation

**What Supabase does NOT handle**:
- Analytics events (D1)
- Meal macro caching (KV)
- Job status (KV)
- PDF storage (R2 — see Phase 4)

**Free tier**: Supabase free tier includes 500MB database, 50,000 monthly active users, 5GB bandwidth. Sufficient for beta.

**Architecture boundary**: The Worker does NOT write to Supabase directly — the latency from Cloudflare's edge to Supabase's regional Postgres would be unpredictable and is not appropriate for the hot path. Instead, the Next.js app (running on Vercel) reads from and writes to Supabase. The Worker writes only to KV and D1 (both Cloudflare-native). This boundary is critical to maintain.

---

### Step 3.4 — Cloudflare R2 for PDF Storage

**When to introduce R2**: After Supabase is integrated and there is a concept of a "user" who could retrieve their plan later.

**What R2 does**: Instead of the PDF being generated, emailed, and discarded, the Worker writes the PDF binary to R2 after generation: `r2.put(\`plans/{jobId}.pdf\`, pdfBytes)`. The job record in KV and D1 stores the R2 key.

**What this unlocks**:
- Re-send endpoint: instead of re-running the full pipeline, retrieve from R2 and re-email
- "View your plan" link in the email pointing to a signed R2 URL (valid for 7 days)
- Admin re-generation without user resubmission

**wrangler.jsonc addition**:
```json
"r2_buckets": [
  {
    "binding": "PLANS_BUCKET",
    "bucket_name": "metamorfit-plans"
  }
]
```

**Free tier**: R2 free tier includes 10GB storage, 1M Class A operations/month, 10M Class B operations/month. Ample for a fitness app generating PDFs.

---

## Phase 4: API Consolidation + Edge Compute (Days 14–21)

**Goal**: Eliminate the Vercel proxy hop for the high-frequency paths, consolidate the Worker's route structure, and deploy Smart Placement.

---

### Step 4.1 — Eliminate the Vercel Proxy for PDF Submission

**The problem**: The current request flow for PDF delivery is:

```
Browser → Vercel /api/send-pdf → Cloudflare Worker /api/send-pdf
```

This double-hop adds ~100–300ms of latency (Vercel function cold start + network hop to Cloudflare). More importantly, it means Vercel's serverless function must stay open until the Worker responds — creating the timeout race condition fixed in Phase 1.

**The fix**: Call the Cloudflare Worker directly from the browser for the PDF submission flow. The Worker already handles CORS (`"Access-Control-Allow-Origin": "*"`). The WORKER_PDF_ENDPOINT and WORKER_PDF_AUTH_TOKEN can be exposed as `NEXT_PUBLIC_` variables for browser-side use.

**Security consideration**: The Bearer token becomes a client-side secret when exposed as `NEXT_PUBLIC_`. This is acceptable for a stateless, rate-limited endpoint but should be upgraded to HMAC signing (Phase 6) when it matters. The alternative — keeping the Vercel proxy but truly making it fire-and-forget by returning 200 before awaiting the Worker — is also valid but more complex.

**Recommended approach**: Direct browser → Worker call for `/api/send-pdf`. Keep Vercel API routes only for `/api/calculator` and `/api/estimate-macros`, which contain server-side logic (the metabolic engine and the `estimateMacros` helper) that should not be exposed client-side.

**`EmailGateModal.tsx` change**: Replace `fetch("/api/send-pdf", ...)` with `fetch(process.env.NEXT_PUBLIC_WORKER_ENDPOINT, ...)` with the Authorization header included client-side.

---

### Step 4.2 — Migrate `/api/estimate-macros` to Call Worker Directly from Vercel (or Consolidate)

**Current flow**: Browser → Vercel `/api/estimate-macros` → `estimateMacros()` helper → Worker `/estimate`

**The problem**: This is another double-hop. The Vercel route adds no business logic beyond calling the Worker and normalizing the response field names (`fats_g ?? fat_g`). The field name normalization is necessary because the Worker AI output is inconsistent.

**The fix**: The field normalization (`fat_g` vs `fats_g`) should be fixed at the source — in the Worker's AI response parsing in `index.ts`. Once the Worker consistently returns `fats_g`, the Vercel proxy adds no value. The browser can call the Worker's `/estimate` endpoint directly.

However: macro estimation doesn't require auth (it's a public AI call). Calling it directly exposes the Worker endpoint to abuse. Keep the Vercel proxy for `/api/estimate-macros` but add a rate limiting header check, and fix the field normalization in the Worker so the Vercel route is a clean 1-line passthrough.

---

### Step 4.3 — Enable Cloudflare Smart Placement

`wrangler.jsonc` has Smart Placement commented out:
```jsonc
// "placement": { "mode": "smart" }
```

**Uncomment it**. Smart Placement automatically deploys the Worker to the Cloudflare region closest to the external APIs it calls (Resend, Systeme.io, potentially Supabase). For a Worker that makes multiple outbound HTTP calls in sequence, Smart Placement can reduce total external API latency by 100–400ms by co-locating the Worker near the API endpoints' infrastructure, rather than running at the edge closest to the user (which may be geographically distant from the API servers).

This is a zero-code, zero-risk one-line change.

---

### Step 4.4 — Decompose the Monolithic Worker into Named Route Handlers

**Current state**: `index.ts` is a single `fetch()` handler with a chain of `if (pathname === ...)` blocks. As the Worker grows (new routes for `/status`, `/resend`, `/admin`), this file becomes unmanageable.

**The fix**: Extract each route into a separate module:

```
src/
  index.ts          ← Router only (url.pathname switch)
  routes/
    sendPdf.ts      ← /api/send-pdf handler
    estimate.ts     ← /estimate handler  
    explain.ts      ← /api/explain handler
    status.ts       ← /api/status/:jobId handler (new)
    resend.ts       ← /api/resend/:jobId handler (new)
  workers/
    mealCache.ts    ← (already extracted — keep here)
  utils/
    hashMeal.ts
    normalizeMeal.ts
```

Each route module exports an `async function handle(request, env, ctx)` that `index.ts` calls. This is purely organizational but it is a prerequisite for the Worker being maintainable as Phase 5 and 6 features are added.

---

## Phase 5: UI Performance + Hydration Strategy (Days 18–25)

**Goal**: Make the Next.js app fast, cache-optimized, and production-grade on Vercel's free tier.

---

### Step 5.1 — Configure `next.config.ts` with Cache Headers and Rewrites

**Current state**: `next.config.ts` is completely empty. No cache headers, no rewrites, no edge runtime declarations.

**Add the following**:

```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Marketing pages — aggressive caching
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // Proxy /worker/* to Cloudflare Worker (keeps auth token server-side)
      {
        source: '/worker/:path*',
        destination: `${process.env.WORKER_BASE_URL}/:path*`,
      },
    ];
  },
};
```

This adds security headers (missing entirely from the current stack), CDN cache hints for static marketing pages, and a rewrite rule that keeps the Worker base URL server-side if needed.

---

### Step 5.2 — Declare Edge Runtime for `/api/calculator` and `/api/estimate-macros`

**Current state**: Both routes run as standard Vercel serverless functions (Node.js runtime, ~200ms cold start).

**The fix**: Both routes perform only:
- `api/calculator`: JSON parsing + metabolic engine computation + one outbound fetch to the Worker
- `api/estimate-macros`: JSON parsing + one outbound fetch to the Worker

Neither uses Node.js-specific APIs that are incompatible with the Edge runtime. Add `export const runtime = 'edge'` to both route files.

**Effect**: Routes execute in Vercel's Edge runtime (V8 isolate, ~0ms cold start, runs on Cloudflare's network). Eliminates the ~200ms cold start on each calculator and macro estimation call. The `/api/send-pdf` route should NOT be edge runtime if it stays as a Vercel proxy — edge functions have even shorter timeouts.

---

### Step 5.3 — Implement Optimistic UI State in `EmailGateModal`

**Current state**: `EmailGateModal.tsx` has states: `idle → loading → success → error`. On success, it immediately sets status to `success` and redirects to `/thank-you` after 1500ms. This is before any background task has completed.

**The fix** (builds on Phase 2.1 job tracking):

Introduce a `generating` state between `loading` and `success`:

```
idle → loading (submitting form)
     → generating (polling /api/status/:jobId — show step-by-step progress)
     → success (jobId status === "complete" — show "check your email")
     → error (jobId status === "failed" OR polling timeout after 60s)
```

The generating state renders an animated progress sequence:
- "Calculating your energy system..." (immediate)
- "Building your meal architecture..." (after ~5s)
- "Finalizing your personalized PDF..." (after ~15s)
- "Delivering to your inbox..." (after ~25s, if still polling)

This transforms the worst UX moment in the app (the 10–30 second void after submission) into a premium, confidence-building experience.

---

### Step 5.4 — Add Re-send CTA to `/thank-you` Page

**Current state**: The `/thank-you` page exists but its content is not in the uploaded files. Regardless of its current state, it should receive the `jobId` (via query param or session storage) from the modal redirect.

**The fix**: `/thank-you?jobId=<uuid>` — the page reads the `jobId`, checks status via `/api/status/:jobId`, and if status is `complete`, shows a "Didn't receive your email?" button that calls `/api/resend/:jobId` on the Worker. This is the self-service recovery path that eliminates the top user support scenario.

---

## Phase 6: Observability, Retries, and Resilience (Days 25–35)

**Goal**: Make the system operationally visible, self-healing where possible, and production-grade in its error handling.

---

### Step 6.1 — Sentry for Worker Error Tracking

**Current state**: `"observability": { "enabled": true }` in `wrangler.jsonc` enables Cloudflare's built-in request logging. This logs Worker requests and uncaught exceptions at the top-level but does NOT capture exceptions inside `ctx.waitUntil()` tasks — which is where all the business logic runs. Failures inside `processRequest()` are caught by the inner try/catch and logged via `console.error`, visible only in the Cloudflare dashboard.

**The fix**: Add `@sentry/cloudflare` to the Worker. Wrap the `processRequest()` function body in a Sentry transaction. Use `Sentry.captureException()` in the inner catch block with the `jobId` as a tag. Configure Sentry alerts to email or Slack when new error types appear.

**Free tier**: Sentry free tier covers 5,000 errors/month and 10,000 transactions/month — sufficient for a fitness app MVP.

**What becomes visible**: PDF generation crashes (Satori, resvg, pdf-lib), AI inference failures, Resend API rejections, Systeme.io API errors — all with full stack traces, job IDs, and sanitized payload context.

---

### Step 6.2 — Retry Logic for External API Calls

**Current state**: The `processRequest()` function in `index.ts` calls Systeme.io and Resend with no retry logic. A single transient network failure kills the entire background task silently.

**The fix**: Implement a minimal retry wrapper:

```typescript
async function withRetry<T>(
  fn: () => Promise<T>, 
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      await new Promise(r => setTimeout(r, delayMs * attempt)); // exponential backoff
    }
  }
  throw new Error('Max retries exceeded');
}
```

Apply to:
- `createSystemeContact()` — wrap the Systeme.io POST and tag loop (3 attempts, 1s base delay)
- `resend.emails.send()` — wrap with 2 attempts, 2s delay (Resend is reliable but network hiccups happen)

**Why not retry PDF generation**: PDF generation failures are almost never transient — they're caused by malformed payloads, CPU limits, or template crashes. Retrying would waste CPU budget. Let PDF failures propagate to the job record as `failed` and surface in Sentry.

---

### Step 6.3 — Fix Systeme.io Tag Application Fragility

**Current state**: `createSystemeContact()` applies tags sequentially after contact creation with `setTimeout(r, 200)` as a delay. This pattern is fragile in `waitUntil()` for two reasons:
1. `setTimeout` in a `waitUntil()` context may not behave reliably if Cloudflare's background window closes
2. The sequential for-loop for tag application means N API calls for N tags, each waiting on the previous

**The fix**: 
- Replace `setTimeout` with a proper `await new Promise()` that is part of the async chain (which it already is — but the 200ms magic number should be configurable)
- Check if Systeme.io's API supports bulk tag application in a single request — if so, replace the for-loop with a single batch call
- Add `withRetry()` wrapper from Step 6.2
- Move the tag ID (currently hardcoded as `1979795` for the default case) to a Worker secret or KV-stored config rather than hardcoded in the source

---

### Step 6.4 — HMAC Request Signing (Replace Static Bearer Token)

**Current state**: Worker auth is `authHeader !== \`Bearer ${expectedToken}\``. The token is static, never rotates, and if the frontend calls the Worker directly (Phase 4.1), it becomes a client-side secret extractable via browser DevTools.

**The fix**: Implement time-bound HMAC-SHA256 request signing using `crypto.subtle`:

**Frontend** (signs the request):
```typescript
const timestamp = Date.now().toString();
const message = `${timestamp}:${JSON.stringify(payload)}`;
const key = await crypto.subtle.importKey('raw', 
  new TextEncoder().encode(process.env.NEXT_PUBLIC_HMAC_SECRET),
  { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
const signature = btoa(String.fromCharCode(
  ...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)))
));
// Send as: X-Signature: {timestamp}.{signature}
```

**Worker** (verifies):
- Parse `X-Signature` header: `{timestamp}.{signature}`
- Reject if timestamp is older than 5 minutes (replay protection)
- Recompute HMAC and compare with `crypto.subtle.verify`

This binds each request to a specific payload and timestamp. A leaked token from DevTools is useless after 5 minutes.

---

### Step 6.5 — Resend Webhook Ingestion

**Current state**: After Resend sends the email, the Worker has no knowledge of whether the email was delivered, bounced, or marked as spam.

**The fix**: Add a `/api/webhooks/resend` Worker endpoint that receives Resend delivery events (delivered, bounced, complained). On receipt:
- Update the D1 `plan_events` record with `email_delivered_at` or `email_bounced_at`
- On bounce: update the KV job record status to `email_failed`
- On complaint: flag the email hash in D1 (for future suppression)

Configure the webhook in the Resend dashboard to POST to `https://metamorfit-worker.metamorfitnet.workers.dev/api/webhooks/resend`.

This closes the last observability gap in the delivery pipeline.

---

## Phase 7: Final Production Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                                      │
│                                                                          │
│  Next.js App (SSG/CSR on Vercel Edge CDN)                               │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │  Marketing Pages (SSG, CDN-cached, ~0ms)                     │       │
│  │  Calculator Page (CSR, local metabolic engine)               │       │
│  │  Meal Planner (CSR, local state machine)                     │       │
│  │  EmailGateModal → polls /api/status/:jobId                   │       │
│  └──────────────┬───────────────────────┬────────────────────┬─┘       │
└──────────────────┼───────────────────────┼────────────────────┼─────────┘
                   │                       │                    │
    ┌──────────────▼──────────┐   ┌────────▼────────┐          │ (direct)
    │   VERCEL EDGE FUNCTIONS │   │  VERCEL SERVERLESS│         │
    │   (runtime: 'edge')     │   │  (Node.js)       │         │
    │                         │   │                  │         │
    │  /api/calculator        │   │  /api/send-pdf   │         │
    │  /api/estimate-macros   │   │  (proxy only,    │         │
    │  (metabolic engine +    │   │  thin wrapper)   │         │
    │   Worker AI call)       │   └──────────────────┘         │
    └─────────────────────────┘                                 │
                   │                                            │
                   └───────────────────┬────────────────────────┘
                                       │
                   ┌───────────────────▼──────────────────────────────────┐
                   │         CLOUDFLARE WORKER                             │
                   │         (metamorfit-worker, Smart Placement ON)       │
                   │                                                       │
                   │  Routes:                                              │
                   │  POST /api/send-pdf   → PDF pipeline (waitUntil)     │
                   │  POST /estimate       → Meal macro estimation         │
                   │  POST /api/explain    → AI metabolic explanation      │
                   │  GET  /api/status/:id → KV job record read           │
                   │  POST /api/resend/:id → R2 retrieve + re-email       │
                   │  POST /api/webhooks/resend → Delivery event ingestion │
                   │                                                       │
                   │  Bindings:                                            │
                   │  AI          → Workers AI (llama-3.1-8b-instruct)    │
                   │  MEAL_CACHE  → KV (meal macro cache)                 │
                   │  JOB_STATUS  → KV (job tracking, 24h TTL)            │
                   │  DB          → D1 (analytics + plan events)          │
                   │  PLANS_BUCKET→ R2 (PDF storage, 7d signed URLs)      │
                   │                                                       │
                   │  waitUntil() pipeline:                                │
                   │  [1] Write job record → JOB_STATUS KV                │
                   │  [2] renderMetamorfitPdf() → R2 upload               │
                   │  [3] createSystemeContact() (with retry)             │
                   │  [4] resend.emails.send() (with retry)               │
                   │  [5] Update job status → "complete"                  │
                   │  [6] Write plan_event → D1                           │
                   └──────────┬──────────┬────────────┬───────────────────┘
                              │          │            │
               ┌──────────────▼┐  ┌──────▼──────┐  ┌▼──────────────────┐
               │ Workers AI    │  │ Cloudflare  │  │ Cloudflare D1     │
               │ (Inference)   │  │ KV          │  │ (SQLite analytics)│
               └───────────────┘  └─────────────┘  └───────────────────┘
                                        │
                              ┌─────────▼─────────┐
                              │ Cloudflare R2     │
                              │ (PDF storage)     │
                              └───────────────────┘
                                        │ (signed URL in email)
                   ┌────────────────────▼─────────────────────────────────┐
                   │  EXTERNAL SERVICES                                    │
                   │                                                       │
                   │  Resend         → Transactional email + PDF attach   │
                   │  Resend webhooks→ Delivery event feedback             │
                   │  Systeme.io     → CRM contact + tag (with retry)     │
                   └──────────────────────────────────────────────────────┘
                                       │
                   ┌───────────────────▼──────────────────────────────────┐
                   │  SUPABASE (Phase 3+, user-facing features only)       │
                   │                                                       │
                   │  Auth → Magic link authentication                     │
                   │  DB   → users, saved_plans tables                    │
                   │  Written by: Next.js server components (NOT Worker)  │
                   └──────────────────────────────────────────────────────┘
                                       │
                   ┌───────────────────▼──────────────────────────────────┐
                   │  FLY.IO (Gotenberg — PDF Microservice)                │
                   │                                                       │
                   │  POST /forms/chromium/convert/html → PDF binary      │
                   │  Called by Worker inside waitUntil()                  │
                   │  Replaces Satori + resvg + pdf-lib stack              │
                   │  Always-on (Fly.io free tier: 3 shared VMs)          │
                   └──────────────────────────────────────────────────────┘
```

---

## Phase 8: Long-Term Roadmap

### 8.1 — Complete the Gotenberg Migration (Highest Remaining Impact)

The Gotenberg migration discussed in previous sessions has not been applied to the Worker codebase. `renderer.tsx` still runs the full Satori + resvg + pdf-lib stack. This remains the largest unrealized CPU optimization. The migration path:

1. Build an HTML template equivalent of `pdf-template.tsx` — a single `template.html` file with `{{PLACEHOLDER}}` tokens, styled with inline CSS using the Metamorfit design system (near-black backgrounds, MM Gold `#d4af37`, Bebas Neue via `@font-face`)
2. Deploy Gotenberg on Fly.io (`fly launch` with the `gotenberg/gotenberg:8` Docker image)
3. In the Worker's `renderMetamorfitPdf()`: replace the Satori → resvg → pdf-lib chain with a `fetch()` POST to Gotenberg with the HTML payload
4. Remove `@resvg/resvg-wasm`, `satori`, `pdf-lib` from Worker `package.json`
5. Worker bundle size drops from ~5MB to ~50KB

This eliminates WASM from the Worker entirely (even with the Phase 1 module-scope fix, WASM is still initialized on cold starts). It also removes the entire category of Satori text-node crashes and resvg CPU spikes.

---

### 8.2 — User Accounts and Plan History

Once Supabase is integrated (Phase 3), implement a minimal magic-link auth flow:

- User submits email in `EmailGateModal` → Worker checks if email exists in Supabase → if yes, links the new plan to the existing user; if no, creates a new user record
- After plan generation, store plan in `saved_plans` table: `{ user_id, job_id, payload_json, pdf_r2_key, created_at }`
- Add a `/dashboard` page in Next.js that reads from Supabase and shows plan history
- Each saved plan has a "Re-download" button that generates a signed R2 URL on demand

This is the feature that transforms Metamorfit from a one-shot tool into a platform with retention.

---

### 8.3 — Cloudflare Queues for Pipeline Reliability

When volume justifies it (>100 plans/day), replace `ctx.waitUntil()` with Cloudflare Queues. The ingest Worker enqueues a message; a Consumer Worker processes it with automatic retry on failure (configurable: 3 retries, exponential backoff, dead-letter queue). This provides:

- Guaranteed delivery (not best-effort like `waitUntil()`)
- Automatic retry on transient failures
- Dead-letter queue for permanently failed jobs (visible in Cloudflare dashboard)
- Natural rate limiting under load spikes

**Free tier**: Cloudflare Queues are included in the Workers Paid plan ($5/month).

---

### 8.4 — Macro Estimation Quality: Move from LLaMA to a Specialized Model

The current macro estimation in `/estimate` uses `@cf/meta/llama-3.1-8b-instruct` with a minimal prompt. This produces inconsistent field names (`fat_g` vs `fats_g`) and occasionally returns non-JSON responses that require the regex extraction in `index.ts`.

When Cloudflare Workers AI adds support for response schemas (JSON mode — currently in beta), switch macro estimation to use structured output. Alternatively, replace Workers AI for macro estimation with a direct Anthropic API call (Claude Haiku) from the Next.js Vercel function — Haiku's structured JSON output is significantly more reliable for nutrition data at ~$0.0003 per request.

---

### 8.5 — A/B Test PDF Template Variants

Once R2 stores generated PDFs and D1 tracks outcomes, implement a minimal A/B framework:

- Store `template_version` in the D1 `plan_events` record
- Worker randomly assigns template variant A or B (50/50) on each request
- Track downstream outcome: email open rate (via Resend webhook), bounce rate, re-send rate
- This gives Felipe data-driven design decisions on template layout changes

---

## Summary: Sequenced Decision Map

| Phase | Primary Decision | Dependency |
|---|---|---|
| 1 | Fix Vercel timeout disconnect; true module-scope WASM init; font subset | None |
| 2 | KV job tracking + status polling UI; Zod validation; structured AI output | Phase 1 |
| 3a | D1 analytics store | Phase 2 (needs jobId) |
| 3b | Separate KV namespaces | Phase 2 |
| 3c | Supabase (auth + saved plans) | Phase 3a stable |
| 3d | R2 PDF storage | Phase 3c (needs user concept) |
| 4 | Direct browser→Worker calls; Smart Placement; route decomposition | Phase 2 |
| 5 | next.config.ts headers; Edge runtime on calculator; optimistic UI | Phase 2 |
| 6 | Sentry; retry logic; Systeme.io fix; HMAC signing; Resend webhooks | Phase 3 |
| 7 | Gotenberg migration (complete) | Phase 4 stable |
| 8 | User accounts; Queues; A/B testing | Phase 6 stable |

**The single most important step not yet taken**: Phase 2.1 — KV job tracking. Every other improvement in this roadmap either depends on it or becomes significantly more valuable once it exists. Implement it first.
