# Localization Readiness Report: English → Spanish (es)

**Core Question: Can we add Spanish immediately?**

> **No. Adding Spanish right now would require surgical edits across every layer of the stack with no safety net.** The platform currently has zero localization infrastructure. All strings are hardcoded in English across the React components, AI prompts, email templates, PDF templates, and error messages. Before a single word of Spanish text can be safely shipped, technical scaffolding must be built first.

---

## 1. FRONTEND UI & ONBOARDING IMPACT

### Current State: Zero i18n Infrastructure

A codebase-wide search for `i18next`, `react-i18next`, `useTranslation`, `t()`, and `locale` returned **zero results**. There is no internationalization framework installed, configured, or referenced anywhere in the `apps/web` package.

**Every string in the 6-step onboarding wizard is hardcoded directly into the component source:**

| Step | Component | Hardcoded English Strings (Sample) |
|------|-----------|-------------------------------------|
| Step 1 | `Step1PersonaSelect.tsx` | `"YOUR INFORMATION"`, `"WHO ARE YOU?"`, `"Select the profile that best matches you."`, `"Please select your sex."`, `"Please enter a valid age (13-80)."`, `"The Hardgainer"`, `"The Rebuilder"`, etc. |
| Step 2 | `Step2GoalSelect.tsx` | `"SELECT YOUR OBJECTIVE"`, `"Your training protocol adapts to this."`, all four goal `label` and `desc` strings for MAINTAIN, BULK, CUT, RECOMP |
| Step 3 | `Step3Metrics.tsx` | All weight/height labels, unit labels, placeholder text |
| Step 4 | `Step4Somatotype.tsx` | All somatotype card labels and descriptions |
| Step 5 | `Step5Activity.tsx` | `"ACTIVITY PROFILE"`, `"Your TDEE scales with your weekly output."`, all five activity `label` and `desc` strings for Sedentary through Very Active |
| Step 6 | `Step6Calibrate.tsx` | Precision mode labels, body fat input text, final CTA |

All strings are defined as static JavaScript constant arrays (e.g., `const GOALS = [...]`, `const ACTIVITY_LEVELS = [...]`, `const PERSONAS = [...]`) inside each component. There is no centralized string store.

### Impact on Manual-Advance Steps (Step 2 & Step 5)

The physiological descriptions in Step 2 (Goals) and Step 5 (Activity) are the **primary reason these steps must never auto-advance**. They contain dense, technical prose (e.g., `"Activate mTOR signaling and optimize protein synthesis windows..."`) that users must have time to read.

When translated to Spanish, these descriptions must be reviewed for character length. Spanish text is on average **15–25% longer** than its English equivalent. If Spanish descriptions are significantly longer than their English counterparts, the description panel's `min-h` CSS values may need to be adjusted to prevent layout overflow on smaller screens. This is a **UI regression risk** that must be validated after strings are replaced.

### Summary: Frontend Work Required

- Install and configure an i18n framework (e.g., `react-i18next` with `i18next`).
- Extract **all** hardcoded strings from all 6 step components, `OnboardingHeader.tsx`, `OnboardingContainer.tsx`, `EmailGateModal.tsx`, `DailyTargetsPanel.tsx`, `Header.tsx`, and all app pages into translation key files (`en.json`, `es.json`).
- Implement a language selector UI element and connect it to the i18n framework's `changeLanguage()` API.
- Validate Step 2 and Step 5 layouts with the full Spanish text to ensure descriptions render without overflow and the manual-advance requirement is preserved.

---

## 2. BACKEND & LEDGER SCHEMA IMPACT

### Current State: No Locale Field in the User Ledger

A codebase-wide search for `locale` returned **zero results** in any schema, worker, or KV-related file.

The `OnboardingState` TypeScript interface (the definitive data contract for the onboarding flow) contains no language or locale field:

```typescript
// apps/web/src/components/onboarding-v2/types.ts — current definition
export interface OnboardingState {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
  sex: 'male' | 'female' | null;
  age: number | null;
  persona: 'hardgainer' | 'rebuilder' | 'optimizer' | 'converter' | null;
  goal: 'maintain' | 'bulk' | 'cut' | 'recomp' | null;
  weightValue: number | null;
  weightUnit: 'kg' | 'lbs';
  heightValue: number | null;
  heightUnit: 'cm' | 'ft';
  somatotype: 'ectomorph' | 'mesomorph' | 'endomorph' | null;
  activityLevel: string | null;
  bodyFatEnabled: boolean;
  bodyFatPercent: number | null;
  somatotypeTweakEnabled: boolean;
  // ❌ NO locale field
}
```

The **`MM_LEDGER` KV entry schema** (as documented in `DATA_LEDGER_STORAGE.md`) also has no `locale` field in the `data` object.

### Why the Locale Must Flow Through the Ledger

Without a `locale` field persisted in the ledger, the backend has no way to know which language to use when:
1. **Generating the AI explanation** (`explanation.ts`) — the prompt is currently English-only.
2. **Rendering the PDF** — all template text in `pdf-template.tsx` is hardcoded in English.
3. **Sending the Brevo email** — the `renderEmail()` function generates English HTML.

A user's language selection made on the frontend would be lost the moment a page refresh occurs, because the ledger recovery flow (`PATCH /api/ledger/:userId`) would hydrate state without the locale preference.

### Schema Changes Required

Both `OnboardingState` and the `MM_LEDGER` KV entry `data` object must be extended:

```typescript
// Proposed addition to OnboardingState
locale: 'en' | 'es';
```

```json
// Proposed addition to MM_LEDGER entry
{
  "userId": "uuid",
  "locale": "en",
  "data": { ... }
}
```

The `PATCH /api/ledger/:userId` worker route must be updated to read and persist the `locale` field. The `POST /api/ledger/:userId/finalize` route must then pass `locale` in its webhook payload to the PDF Orchestrator and email pipeline.

---

## 3. METABOLIC ENGINE & AI PROMPT IMPACT

### Current State: English-Only Hardcoded Prompt

The `buildExplanationPrompt()` function in `packages/macro-engine/src/explanation.ts` constructs the prompt entirely in English. The system instruction, all behavioral rules, and the required JSON output schema description are hardcoded:

```typescript
// explanation.ts — line 23
return `You are the supportive narrator of the Metamorfit metabolic engine.
Your role is to help the user understand WHY their personalized plan...
// ... 50+ lines of English-only prompt text
`;
```

The **fallback explanation** (the static string returned when the AI call fails) is also hardcoded in English (line 133).

### What Must Change

The `buildExplanationPrompt()` function must be made locale-aware. The `ExplanationInput` interface must accept a `locale` parameter, and the function must:

1. **For Spanish (`es`):** Append a clear language instruction to the prompt (e.g., `"You MUST respond entirely in Spanish (es-419). Do not use English."`) before the JSON output schema directive. This is the safest, lowest-risk approach that preserves the existing JSON output contract and does not require prompt restructuring.
2. **Update the fallback string:** The hardcoded fallback explanation in the `catch` block must be translated into Spanish and conditionally returned based on `locale`.

> [!IMPORTANT]
> Do NOT restructure the JSON output schema or the behavioral guardrails when adding the language instruction. The deterministic math rules and the structured `{ paragraph1, paragraph2, paragraph3 }` JSON contract must remain unchanged. Only the language of the AI's *response* should change.

### AI Model Capability Note

The engine currently uses `@cf/openai/gpt-oss-120b` via Cloudflare AI bindings. This model has strong multilingual capabilities and will correctly follow a Spanish language instruction appended to the system prompt. No model change is required.

---

## 4. RECOMMENDED STEP-BY-STEP ROADMAP

This roadmap must be executed **in order**. Steps cannot be skipped or parallelized without risk.

---

### 🔴 PREREQUISITE PHASE — Do This Before Translating Any Text

**Step 1: Add `locale` to the `OnboardingState` type contract**
- File: `apps/web/src/components/onboarding-v2/types.ts`
- Add `locale: 'en' | 'es'` to the `OnboardingState` interface.
- Default value: `'en'`.

**Step 2: Persist `locale` through the KV Ledger**
- Files: `packages/worker/src/routes/` (ledger `init`, `patch`, and `finalize` handlers)
- Update `POST /api/ledger/init` to accept and store `locale` in the new `MM_LEDGER` entry.
- Update `PATCH /api/ledger/:userId` to merge `locale` on partial saves.
- Update `POST /api/ledger/:userId/finalize` to include `locale` in the webhook payload forwarded to the PDF Orchestrator.
- **Free-tier risk: NONE.** Adding a field to a JSON KV value does not increase namespace usage meaningfully.

**Step 3: Install and configure `react-i18next` in the web app**
- Run: `npm install react-i18next i18next` inside `apps/web`.
- Create `/apps/web/public/locales/en/translation.json` and `/es/translation.json`.
- Configure `i18next` with `lng` defaulting to `'en'` and `fallbackLng: 'en'`.
- This is a one-time setup that creates no free-tier risk.

**Step 4: Extract all hardcoded strings into translation key files**
- Extract every string from all 6 onboarding step components, shared UI components, and page files into `en/translation.json`.
- Replace inline strings with `t('key.name')` calls via the `useTranslation` hook.
- This step is **the highest-effort step** and must be done comprehensively before adding Spanish text.

**Step 5: Wire the language selector to both the i18n framework and the Ledger**
- Add a language selector component (e.g., a `EN / ES` toggle).
- On change, call `i18next.changeLanguage(locale)` AND fire `PATCH /api/ledger/:userId` with the new `locale` value to ensure it is persisted.
- This ensures the language preference survives page refreshes via ledger hydration.

---

### 🟡 TRANSLATION PHASE — Only After Prerequisites Are Complete

**Step 6: Add Spanish translations to `es/translation.json`**
- Populate the Spanish translation file with all keys from Step 4.
- Pay special attention to the long physiological descriptions in Step 2 and Step 5 — have these reviewed for accuracy by a native speaker.

**Step 7: Make `buildExplanationPrompt()` locale-aware**
- File: `packages/macro-engine/src/explanation.ts`
- Update `ExplanationInput` to include `locale: 'en' | 'es'`.
- Conditionally append `"\n\nIMPORTANT: You MUST respond entirely in Spanish (Castilian). All paragraph text must be in Spanish. The JSON key names (paragraph1, paragraph2, paragraph3) must remain in English."` when `locale === 'es'`.
- Update the static fallback string to be conditionally Spanish when `locale === 'es'`.

**Step 8: Update the PDF template and email renderer**
- File: `packages/macro-engine/src/pdf-template.tsx`
- Pass `locale` into the template renderer and conditionally swap hardcoded labels, section headings, and footer text.
- File: `packages/macro-engine/src/PersonalizedPlanEmail.tsx`
- Apply the same locale-aware rendering to the email HTML.

---

### 🟢 VALIDATION PHASE

**Step 9: Validate Step 2 and Step 5 Spanish layouts**
- Run the onboarding flow in Spanish and specifically verify that the longer Spanish goal descriptions (Step 2) and activity descriptions (Step 5) do not overflow or truncate in the description panels.
- Confirm that the manual-advance behavior (explicit button click required) is **completely unaffected** — no logic changes should have touched those guard conditions.

**Step 10: End-to-end pipeline test in Spanish**
- Submit a complete onboarding session in Spanish.
- Verify the generated PDF contains Spanish section headings and labels.
- Verify the Brevo email is rendered in Spanish.
- Verify the AI explanation paragraphs returned are in Spanish and conform to the `{ paragraph1, paragraph2, paragraph3 }` schema.
- Confirm no new KV namespaces are needed and free-tier limits are unaffected.
