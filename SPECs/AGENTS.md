> [!IMPORTANT]
> **MANDATORY AGENT INSTRUCTION:** When tasked with modifying any specific subsystem listed in Section 6, you **must** read its corresponding `.context/` markdown file **before** making any code changes. Failure to do so risks breaking deterministic engine contracts, KV data pipelines, or critical UX guardrails.

# Metamorfit AI Context Sheet (AGENTS.md)

Welcome. This file serves as the universal context sheet for any AI agent that boots up in this repository. Please read this entirely before making architectural decisions or proposing new features.

## 1. CORE PLATFORM OVERVIEW

**Metamorfit** is a fitness and health web application focused on personalized meal planning and a deterministic metabolic engine. 

**Key Architectural Principle:** The entire platform is optimized for **high-performance free-tier architectures**. Every architectural decision must prioritize staying within the free-tier limits of our hosting providers while maximizing edge performance.

## 2. TECH STACK

Our exact edge architecture is built on the following stack:

- **Frontend:** Vercel (React/Next or similar depending on the app structure)
- **Logic / Backend:** Cloudflare Workers (`metamorfit-worker-beta` and `metamorfit-main-engine`)
- **State Management:** Cloudflare KV (`MEAL_CACHE`, `JOB_STATUS`, `MM_LEDGER`), Cloudflare D1 (`METAMORFIT_DB`)
- **AI Processing:** Cloudflare AI bindings
- **PDF & Email Delivery Pipeline:** 
  1. **Gotenberg** (running on Fly.io) generates PDFs.
  2. PDFs are stored in **Cloudflare R2** (`metamorfit-pdf-beta` bucket).
  3. **Brevo** handles email delivery of the generated assets.

## 3. STRICT FREE-TIER RULES

> [!WARNING]
> **STRICTLY FORBIDDEN:** Paid-tier Cloudflare features must NEVER be added to our configuration files (`wrangler.toml` or `wrangler.jsonc`). 
> 
> Specifically, do **NOT** use:
> - **"Smart Placement"** (e.g., `placement: { mode: "smart" }`)
> - **"Workers Observability"**
> 
> Adding these will cause immediate deployment failures on our free-tier accounts.

## 4. SUBSYSTEM LOGIC

### User Ledger System
We maintain a User Ledger system that synchronizes state across Cloudflare Workers and Cloudflare KV. The `MM_LEDGER` KV namespace is primarily responsible for holding this ledger state. This ensures low-latency state resolution globally without relying entirely on slower database queries.

### Onboarding UI Sequence
Our onboarding flow consists of a strict **6-step sequence**.

> [!IMPORTANT]
> **Auto-advance logic must remain DISABLED for Step 2 and Step 5.** 
> Users must have adequate time to read the detailed descriptions presented in these specific steps. Do not attempt to optimize the flow by auto-progressing the user here.

### Metabolic Engine
The core metabolic engine (`macro-engine`) relies strictly on:
1. **Deterministic Math:** Calculations for macros, TDEE, etc., must be strictly deterministic and testable.
2. **Structured AI JSON Outputs:** Any AI generations used to supplement the metabolic engine must guarantee perfectly structured JSON outputs.

## 5. SUBSYSTEM OWNERSHIP MAP

| Subsystem | Package / Location |
|---|---|
| Frontend Onboarding UI | `apps/web/src/components/onboarding-v2/` |
| Metabolic Calculation Engine | `packages/macro-engine/src/index.ts` |
| AI Explanation Prompt | `packages/macro-engine/src/explanation.ts` |
| PDF Rendering | `packages/macro-engine/src/pdf-template.tsx`, `renderer.tsx` |
| Worker Routes & Ledger API | `packages/worker/src/routes/` |
| Email Dispatch | `packages/macro-engine/src/PersonalizedPlanEmail.tsx` |
| PDF Orchestrator | `packages/pdf-orchestrator/` |

## 6. Project Knowledge Base (Context Index)

This repository maintains a set of detailed technical specification files inside the `.context/` directory. Each file is the authoritative source of truth for its subsystem. **Read the relevant file before editing any subsystem it governs.**

| File | Description |
|---|---|
| [`.context/METABOLIC_ENGINE.md`](.context/METABOLIC_ENGINE.md) | The strict technical math specs (BMR, TDEE, macronutrient split formulas), hardcoded activity multipliers, goal-based caloric offsets, and the required structured JSON schema that constrains all AI explanation outputs. |
| [`.context/DATA_LEDGER_STORAGE.md`](.context/DATA_LEDGER_STORAGE.md) | Our Cloudflare KV namespace configuration, exact key naming conventions for `MM_LEDGER` and `JOB_STATUS`, the User Ledger entry schema, and the defensive read-modify-write strategies used to mitigate KV eventual consistency race conditions. |
| [`.context/PIPELINE_DOCUMENT_DELIVERY.md`](.context/PIPELINE_DOCUMENT_DELIVERY.md) | The full Gotenberg → R2 → Brevo document delivery pipeline, including payload structure, R2 object key conventions, the worker-proxied download architecture, retry configurations, and per-stage error handling boundaries. |
| [`.context/ONBOARDING_UX_FLOW.md`](.context/ONBOARDING_UX_FLOW.md) | The strict 6-step onboarding funnel sequence, what data each step collects, the mandatory manual-advance rules for Steps 2 and 5, how the `useOnboardingSession` hook maps frontend state to `MM_LEDGER` patches, and the graceful degradation error handling strategy. |
| [`.context/LOCALIZATION_READINESS.md`](.context/LOCALIZATION_READINESS.md) | The architectural audit determining that Spanish cannot be added immediately, documenting every gap (no i18n framework, no `locale` field in the ledger schema, English-only AI prompts and PDF templates), and the complete 10-step prerequisite roadmap required before any translation work begins. |
