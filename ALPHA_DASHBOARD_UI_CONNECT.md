# Alpha Dashboard UI i18n Connection Plan

**CONTEXT:** Our mid-journey AI endpoints (`/api/calculate` and `/api/estimate-macros`) are now fully locale-aware. We must now update our React dashboard components to pull the active `locale` from the user's state or local ledger and append it to these network request bodies.

Follow these steps sequentially.

---

## STEP 1: Update the AI Metabolic Insight Trigger
We need to pass the language context when requesting the deep metabolic breakdown.

1. Locate the dashboard component that triggers the insight generation (e.g., `apps/web/src/components/dashboard/MetabolicInsightCard.tsx` or inside `apps/web/src/app/dashboard/page.tsx`).
2. Identify the `fetch` call pointing to `/api/calculate`.
3. Read the user's active `locale` from your frontend state or your custom hook wrapper.
4. Append `locale` directly into the JSON request body payload:
```json
   {
     "metrics": ...,
     "locale": locale
   }

---

## STEP 2: Update the Meal Builder Hook/Component
The meal estimator needs to send the language context alongside the text input of what the user ate.

a. Locate the Meal Builder logging component or its query handler (e.g., apps/web/src/components/dashboard/MealBuilder.tsx or associated custom hooks).

b. Find the submission handler executing the POST request to /api/estimate-macros.

c. Inject the active locale into the outgoing network payload:

JSON
   {
     "description": textInput,
     "locale": locale
   }

---

## STEP 3: Verification Build
Ensure no frontend properties or component props are missing type definitions.

Bash
npm run build