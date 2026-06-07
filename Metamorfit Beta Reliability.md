
# METAMORFIT ARCHITECTURE UPGRADE: RELIABILITY & PERFORMANCE PIVOT

## 1. PROJECT SCOPE & CONSTRAINTS
- **Primary Goal:** Transition from a linear "relay-race" data flow to a state-aware "KV Ledger" system.
- **Delivery Pivot:** Switch from Base64 PDF email attachments to Cloudflare R2 hosted links.
- **Financial Constraint:** Maintain $0/month infrastructure cost.
- **Hard Limits:** Respect the 300 emails/day Brevo limit and Cloudflare Worker memory/time caps.
- **Visual Identity:** Maintain "Minimalist-Premium" aesthetic using palette: #c9a84c (Gold), #111110 (Black), #e8e2d5 (Off-white).

---

## 2. PHASE 1: THE CENTRALIZED KV LEDGER
**Objective:** Replace ephemeral in-memory data passing with a persistent "Source of Truth" during the generation lifecycle.

### A. KV Schema Definition
Implement a Cloudflare KV entry with a 24-hour TTL (Time-to-Live) using `job:{jobId}` as the key.
```json
{
  "jobId": "uuid-string",
  "status": "pending | calculated | ai_complete | pdf_stored | delivered",
  "userData": {
    "email": "string",
    "name": "string",
    "bodyStats": "object"
  },
  "results": {
    "macros": "object",
    "aiInsight": "string"
  },
  "delivery": {
    "r2Key": "string",
    "downloadUrl": "string"
  },
  "errors": []
}

### B. Execution Logic
Frontend Handshake: The Vercel UI sends data to the Worker. The Worker initializes the KV Ledger and returns the jobId immediately.

State Updates: Every service (Macro Engine, AI, PDF Generator) must fetch the Ledger, update its specific block, and set the new status.

## 3. PHASE 2: REWIRING THE PIPELINE
Objective: Decouple the UI from logic and optimize resource consumption.

### A. Macro Engine Relocation
Move all biometric calculation logic from the Vercel Edge functions to the primary Cloudflare Backend Worker.

Ensure the Worker writes these calculations to the results.macros field in the KV Ledger before proceeding.

###B. AI & PDF Generation
AI Context: The AI Service must pull the macro results from the KV Ledger to generate the personalized summary.

PDF Compression: - Use inline CSS and SVG assets for the gold/monochrome branding to keep file size <500KB.

Set min_machines_running = 1 in fly.toml for the Gotenberg instance to eliminate cold-start timeouts.

## 4. PHASE 3: R2 STORAGE & LINK-BASED DELIVERY
Objective: Improve email deliverability and data persistence.

### A. Cloudflare R2 Integration
Generate the PDF, upload the buffer to Cloudflare R2, and store the object key in the KV Ledger.

Generate a signed or public URL (depending on security preference) for the download link.

### B. Brevo Email Update
Refactor: Remove the Base64 attachment logic from the email service.

Implementation: Inject the downloadUrl from the Ledger into the Brevo template.

Post-Delivery: Only after the email is successfully sent, sync the final user profile to Supabase and the operational logs to Cloudflare D1.

## 5. REPOSITORY CLEANUP & HARDENING
Pruning: Remove the redundant packages/pdf-worker directory.

Dependencies: Uninstall the resend library and any unused email packages.

Observability: Ensure every catch block in the worker updates the errors array in the KV Ledger and triggers a Sentry event with the jobId as a tag.