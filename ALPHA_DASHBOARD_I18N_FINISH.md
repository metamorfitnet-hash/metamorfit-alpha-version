# Alpha Dashboard & Results Page i18n Completion

**CONTEXT:** The onboarding wizard successfully passes Spanish states, and the backend processes them. However, upon redirection to the Dashboard/Calculator page, the UI elements, buttons, and macro layout revert to English because the dashboard components lack translation hooks and the global header lacks a persistent language toggle.

Follow these steps sequentially to bridge the gap.

---

## STEP 1: Move the Language Toggle to the Global Navigation Header
Instead of trapping the EN / ES toggle inside the onboarding container, we need it everywhere.

1. Locate your global navigation layout component (e.g., `apps/web/src/components/Navbar.tsx`, `Header.tsx`, or the root layout `apps/web/src/app/layout.tsx`).
2. Move the **EN / ES** pill buttons into this global header component so it is visible on *both* the onboarding screens and the final calculation dashboard.
3. Ensure it initializes the language setting directly from `localStorage.getItem('i18nextLng') || 'en'`.

---

## STEP 2: Extract Hardcoded Strings from the Calculator Dashboard
We need to sweep through the results screen components to swap hardcoded English labels out.

1. Open your main dashboard page files (e.g., `apps/web/src/app/dashboard/page.tsx` and accompanying breakdown cards like `MacroBreakdown.tsx`).
2. Identify all hardcoded English strings:
   - Macro labels: `"PROTEIN"`, `"CARBOHYDRATES"`, `"FATS"`, `"TOTAL CALORIES"`
   - Interactive buttons: `"Generate PDF"`, `"Export Report"`, `"Recalibrate"`
   - Section headers: `"Your Personalized Metabolic Strategy"`, `"AI Insight"`
3. Move these keys into `apps/web/public/locales/en/translation.json` under a new `"dashboard"` namespace, and add their accurate Spanish matches to `es/translation.json`.

---

## STEP 3: Implement the Translation Hook in the Dashboard
1. Open the refactored dashboard sub-components.
2. Import `useTranslation` from `react-i18next`.
3. Swap the hardcoded text out for dynamic `t('dashboard.key')` tokens.
4. **AI Insight Parsing:** Locate where the returned text from your Cloudflare AI call (`/api/calculate`) is rendered. Ensure the element displaying the AI narrative reads directly from the raw dynamic server payload without masking it behind hardcoded text blocks.

---

## STEP 4: Monorepo Build Verification
Run a final compilation to ensure all page routes route cleanly with zero type errors:
```bash
npm run build