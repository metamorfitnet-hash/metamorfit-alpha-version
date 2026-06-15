# Metamorfit Alpha PDF Generation Debugging Matrix

## 1. System Architecture State
* **Frontend:** Vercel UI (`thank-you` page handles `delivered`, `failed`, and a 90s hard timeout fallback).
* **Core API:** `metamorfit-worker-alpha` (Cloudflare Worker).
* **Orchestrator:** `metamorfit-pdf-workflow-alpha` (Cloudflare Worker).
* **Communication:** Connected via Cloudflare **Service Binding** (`env.PDF_ORCHESTRATOR`).
* **PDF Engine:** Gotenberg hosted on Google Cloud Run.
* **Storage:** Cloudflare R2 Bucket.
* **Delivery:** Brevo Email API (authenticated with valid `BREVO_API_KEY`).

## 2. Current Symptoms
* **Pipeline Status:** 100% Success (E2E completes in <10 seconds, ledger status updates to `delivered`, email sends perfectly).
* **PDF Output Error:** The attached PDF document delivers blank or incomplete.
  * **Page 1:** Displays raw markdown/template placeholders (e.g., `Metabolic Blueprint`) instead of actual Spanish text layout.
  * **Page 2:** Completely blank / empty white page.

## 3. Top 3 Suspected Failure Points
1. **Data Hydration Failure:** The template engine inside the orchestrator worker is sending raw HTML/Markdown placeholders to Gotenberg without parsing or substituting the dynamic JSON meal plan data first.
2. **Gotenberg Race Condition (`waitDelay`):** Gotenberg is taking the PDF snapshot before the DOM is fully hydrated or before local print styles complete rendering.
3. **CSS Viewport/Print Collapse:** The layout might be using `height: 100vh`, `overflow: hidden`, or absolute positioning, causing print engines to collapse multi-page documents down into blank spaces.
