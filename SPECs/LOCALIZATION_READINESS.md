# Bilingual Infrastructure (i18n) Technical Specification

This document details the completed bilingual architecture for the Metamorfit platform. The system now features full internationalization support with a global language toggle, allowing the entire transformation experience to run seamlessly in both English (`en`) and Spanish (`es`).

---

## 1. FRONTEND UI & ONBOARDING

### i18n Framework Integration
The frontend utilizes `react-i18next` and `i18next` to handle translations. All hardcoded strings across the React components, onboarding flows, and dashboards have been systematically extracted into structured translation JSON files.

**Translation Assets:**
- `/apps/web/public/locales/en/translation.json`
- `/apps/web/public/locales/es/translation.json`

These dictionaries dynamically handle all UI strings, messaging, and system outputs. The interface supports an instant, zero-latency language toggle that triggers `i18next.changeLanguage()`.

### Layout & Validation Safeguards
Spanish text is typically 15–25% longer than English. The description panels on critical manual-advance screens (Step 2 and Step 5) have been validated to ensure that the longer Spanish prose renders without overflow. 

---

## 2. BACKEND & LEDGER SCHEMA

### The `locale` Field
Language state does not exist in isolation on the client; it is definitively persisted into the backend ledger to ensure that asynchronous and downstream processes (AI generation, PDF rendering, Email dispatch) honor the user's language preference.

The `OnboardingState` TypeScript interface and the `MM_LEDGER` KV entry schema both explicitly track the `locale` field.

```json
// MM_LEDGER entry
{
  "userId": "uuid",
  "locale": "es",
  "data": { ... }
}
```

**State Flow:**
- `POST /api/ledger/init` seeds the initial `locale`.
- `PATCH /api/ledger/:userId` syncs language toggle changes if the user switches languages mid-onboarding.
- `POST /api/ledger/:userId/finalize` forwards the exact `locale` payload to the PDF Orchestrator.

---

## 3. METABOLIC ENGINE & AI GENERATION

### Locale-Aware Prompting
The `buildExplanationPrompt()` function inside `packages/macro-engine/src/explanation.ts` reads the `locale` and dynamically alters the system prompt instructions.

- When `locale === 'es'`, the prompt appends a strict directive demanding the AI respond entirely in Spanish (Castilian) while preserving the English JSON keys (`paragraph1`, `paragraph2`, `paragraph3`) for reliable schema parsing.
- Static fallback strings inside the catch blocks are conditionally translated, guaranteeing an unbroken language experience even if the AI engine fails.

### Document Pipelines (PDF & Email)
The downstream Cloudflare Workers (`pdf-orchestrator` and `macro-engine` email generators) use the synced `locale` property to inject the correct Spanish translation maps into the server-side React HTML templates before firing them to Gotenberg and Brevo.
