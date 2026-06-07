# Alpha Dashboard AI Engines: i18n Strategy

**CONTEXT:** The onboarding funnel and the final PDF delivery pipeline are fully bilingual. Now, we must localize the internal dashboard AI engines—specifically the **AI Metabolic Insight** generation prompt and the **Meal Builder AI Estimation** engine—so they dynamically match the user's saved ledger locale.

Follow these steps sequentially.

---

## STEP 1: Audit & Locate the Mid-Journey AI Prompts
We need to find the exact system prompts powering the dashboard features.

1. **AI Metabolic Insight:** Search the codebase for where the mid-journey narrative is structured (look for keywords like `MetabolicInsight`, `insightPrompt`, or files inside `packages/macro-engine/src/`).
2. **Meal Builder AI Estimator:** Search for the system prompt that handles real-time food entries and transforms them into estimated macros/calories (look for keywords like `MealBuilder`, `estimateMeal`, or `foodPrompt`).

---
## STEP 2 & 3: Refactoring the AI Micro-services inside `packages/macro-engine/src/index.ts`

We need to patch both route endpoints so they look for an incoming `locale` payload parameter (defaulting to `'en'`) and inject explicit prompt guards.

### 1. The `/api/calculate` Engine (AI Metabolic Insight)
1. Read `locale` from the parsed request body.
2. In the system prompt around line 55, locate the existing template array. Append this guard block:
```text
   [LANGUAGE REQUIREMENT]
   The user's active language preference is: "${locale}".
   If this value is 'es', you MUST write the entire narrative analysis, titles, and explanations in fluent Spanish (Neutral/Castilian). 
   You MUST strictly maintain all English JSON key names exactly as originally designed.
Update the static fallback string in the catch block to serve a parallel Spanish translation if locale === 'es'.

2. The /api/estimate-macros Engine (Meal Builder)
Read locale from the parsed incoming request payload.

Macro Estimation Prompt (Line 154): Append instructions telling the model it can expect input phrases in either English or Spanish (e.g., "pechuga de pollo"), and that it must return the food item name matching the active locale.

Meal Insight Prompt (Line 186): Update the insightPrompt to include a strict language constraint:

Plaintext
   CRITICAL: Write your short meal feedback paragraph entirely in Spanish if locale is 'es'. Keep structural schema flags in English.

## STEP 4: Connect Dashboard UI State to the Engines
Open the dashboard page/component routes (e.g., apps/web/src/app/dashboard/).

Ensure that when these components invoke your server actions or Cloudflare Worker endpoints, they pull the active locale string directly from the state or the local KV ledger entry and pass it as a parameter in the fetch request body.

## STEP 5: Monorepo Integrity Check
Run the compilation suite to ensure no data contract types are broken across the layout.

Bash
npm run build


