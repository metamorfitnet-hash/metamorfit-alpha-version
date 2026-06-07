# Alpha PDF Pipeline Migration: Fly.io → Google Cloud Run

**CONTEXT:** Fly.io has deprecated its free tier resources, causing unexpected infrastructure costs. To maintain our strict platform commitment to high-performance free-tier architectures, we are migrating our Gotenberg headless Chromium PDF rendering instance to Google Cloud Run, which offers a highly generous permanent free tier.

Follow these steps sequentially to update the Alpha branch pipeline.

---

## STEP 1: Deploy Gotenberg to Google Cloud Run
We will deploy the official, untagged Gotenberg Docker image directly to Google Cloud Run via the Google Cloud CLI or Console.

1. **Service Configuration:**
   - **Image:** `gotenberg/gotenberg:8` (or your current stable version)
   - **Region:** Choose a region close to your Cloudflare Workers for low latency (e.g., `us-central1`).
   - **Memory Allocation:** Allocate at least `1 GiB` or `2 GiB` of RAM. Headless Chromium requires sufficient memory boot overhead to compile our React HTML layouts without crashing.
   - **CPU Scaling:** Set minimum instances to `0` (ensuring it scales to zero when idle to prevent charges) and maximum instances to `1` or `2` for Alpha testing.
   - **Container Port:** `3000`

2. **Authentication Guard:**
   - Keep the existing Basic Authentication environment variables active on the container to protect your endpoint from public scraping:
     - `GOTENBERG_AUTH_USERNAME`: `worker`
     - `GOTENBERG_AUTH_PASSWORD`: `beta_render_token_491`

---

## STEP 2: Update Cloudflare Worker Environment Variables
Once Cloud Run provisions your service, it will give you a unique HTTPS service URL (e.g., `https://gotenberg-alpha-xxxxxx.a.run.app`). We need to point our local Alpha backend to this new endpoint.

1. Open your local Alpha worker environment configuration file (`.dev.vars` or your local environment block).
2. Locate the `GOTENBERG_URL` variable.
3. Update the value from your old Fly.io URL strictly to your new Google Cloud Run URL:
```ini
   GOTENBERG_URL="[https://your-new-cloud-run-url.a.run.app](https://your-new-cloud-run-url.a.run.app)"


## STEP 3: Adjust Network Timeout & Retry Triggers

## STEP 3.1: Inject Cold-Start Resilience into Renderers

1. Open `packages/worker/src/renderer.tsx` and `packages/macro-engine/src/renderer.tsx`.
2. Locate the `withRetry` call near line 223. Update the parameters to expand the backoff delay to `4000ms`:
```typescript
   // Expanded to 3 retries, starting at 4000ms backoff to absorb Cloud Run cold starts
   }, 3, 4000);

Inside the fetch block passing the payload to GOTENBERG_URL, ensure a signal from an AbortController is attached with a strict timeout of 15000ms (15 seconds) so the Cloudflare Worker doesn't cut the connection prematurely.

## STEP 3.2: Protect the PDF Orchestrator Fetch
Open packages/pdf-orchestrator/src/index.ts.

Import the withRetry utility at the top of the file if not already present.

Wrap the raw fetch call at line 65 inside the withRetry block, applying the identical 3 retries, 4000ms backoff signature and the 15-second execution timeout guard.

Because Google Cloud Run scales down to zero instances when idle, the very first user who hits "Calibrate" after a period of inactivity will trigger a "cold start" while Cloud Run boots up the Gotenberg container. 

We must ensure our Cloudflare Worker doesn't cut the connection early during a cold start.

Open packages/pdf-orchestrator/ or packages/macro-engine/src/ where the Gotenberg fetch execution logic lives.

Locate the network call wrapped inside the withRetry block configuration.

Resilience Optimization:

Increase the retry backoff delay from 2000ms to 4000ms to gracefully absorb the 3-to-5 second container cold-start delay during a fresh container boot.

Ensure the total fetch timeout threshold allows up to 15000ms (15 seconds) before throwing a hard PDF_GEN_FAIL exception to Sentry.

## STEP 4: End-to-End Pipeline Verification.
Boot up your local isolated development servers using npm run dev and your local Wrangler emulation.

Complete a full 6-step onboarding funnel submission in your browser.

Click Calibrate and monitor your Wrangler terminal logs.

Verify that:

The worker successfully sends the network payload handshake to the Google Cloud Run URL.

Gotenberg successfully compiles the React static HTML string into an A4 PDF stream.

The stream successfully flows down the pipeline and saves securely inside your local metamorfit-pdf-alpha R2 bucket simulation.