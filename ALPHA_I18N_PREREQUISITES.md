# Alpha i18n Prerequisite Infrastructure Plan

**CONTEXT:** We are executing Phase 1 of the `LOCALIZATION_READINESS.md` blueprint. We are NOT translating text yet. Instead, we are building the technical scaffolding required to support a bilingual environment (English/Spanish) across the frontend UI, the KV Ledger, and the backend engine payload[cite: 2, 3, 4].

Follow these steps sequentially. Do not skip steps.

---

## STEP 1: Update the Frontend State & Data Contracts
We must first enable the application to understand what a "locale" is.

a. Open `apps/web/src/components/onboarding-v2/types.ts`.
b. Modify the `OnboardingState` TypeScript interface to include a mandatory `locale` field:
```typescript
   locale: 'en' | 'es';
c. Initialize the default onboarding state with locale: 'en'.  

## STEP 2: Extend the KV Ledger Schema
To ensure a user's language preference survives page refreshes and flows perfectly into the PDF/Email backend, the ledger must persist the locale.

Worker Routes Update: Look inside your Cloudflare Worker routes (packages/worker/src/routes/).

Update POST /api/ledger/init to accept an optional or default locale field and save it into the new MM_LEDGER_ALPHA configuration.

Update the PATCH /api/ledger/:userId handler so that it safely captures and merges the locale state during step transitions without breaking eventual consistency rules.

Update POST /api/ledger/:userId/finalize to ensure the locale parameter is explicitly packed into the JSON network payload dispatched to the PDF Orchestrator.

STEP 3: Install & Configure i18next Framework
We will use the standard React internationalization stack.

Run the installation command inside the apps/web package directory:

Bash
   npm install react-i18next i18next
Create an i18n configuration file at apps/web/src/i18n.ts (or your framework's standard boot path).

Configure i18next to default to lng: 'en', establish a fallbackLng: 'en', and point to local JSON translation resource files.

Create the placeholder locale translation files:

apps/web/public/locales/en/translation.json

apps/web/public/locales/es/translation.json

##STEP 4: Centralize the First Batch of Hardcoded Strings
To prove the architecture works, extract the strings from Step 1 (Persona Select) and Step 2 (Goal Select).

Open Step1PersonaSelect.tsx and Step2GoalSelect.tsx.

Move all hardcoded text (e.g., titles, button text, persona names, and physiological descriptions) into locales/en/translation.json.

Replace the text in the React components with the t('key.name') hook via useTranslation().

CRITICAL GUARDRAIL VERIFICATION: Ensure that the manual-advance logic on Step 2 remains fully untouched and operational.

## STEP 5: Integrity Check
Run npm run dev and ensure the onboarding flow loads smoothly. Verify that Step 1 and Step 2 render their English strings perfectly from the JSON files and that no TypeScript or compiler errors are thrown.