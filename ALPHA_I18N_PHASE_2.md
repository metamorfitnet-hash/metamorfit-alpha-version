# Alpha i18n Phase 2: Completing Onboarding UI Extraction

**CONTEXT:** Phase 1 was a success[cite: 3]. Steps 1 and 2 are fully localized and pull correctly from `translation.json`[cite: 3]. Now, we must finish extracting the hardcoded English strings for the remaining steps (Steps 3, 4, 5, and 6) plus the shared header text to complete the frontend translation[cite: 3].

Follow these steps sequentially to migrate the rest of the wizard.

---

## STEP 1: Extract Shared Onboarding Containers & Headers
The main wrapper titles and subtitle text are still hardcoded in English[cite: 3].

1. Open `apps/web/src/components/onboarding-v2/OnboardingHeader.tsx` and `OnboardingContainer.tsx`[cite: 3].
2. Identify and extract global strings like `"OPTIMIZE YOUR METABOLIC ENGINE"`, `"Calculate your exact metabolic needs..."`, and the progress indicators[cite: 3].
3. Move them into `apps/web/public/locales/en/translation.json` and create matching Spanish entries in `es/translation.json`[cite: 3].
4. Update the components to render via `t('key.name')`[cite: 3].

---

## STEP 2: Extract Metrics, Somatotype, Activity, & Calibration Steps
We need to sweep through the final four onboarding screen components[cite: 3].

1. **Step 3 (Metrics):** Open `Step3Metrics.tsx`[cite: 3]. Extract all weight/height input labels, placeholders, and unit selectors (`kg`, `lbs`, `cm`, `ft`)[cite: 3].
2. **Step 4 (Somatotype):** Open `Step4Somatotype.tsx`[cite: 3]. Extract all somatotype card titles (`Ectomorph`, `Mesomorph`, `Endomorph`) and their specific structural trait descriptions[cite: 3].
3. **Step 5 (Activity):** Open `Step5Activity.tsx`[cite: 3]. Extract the five activity profile options and their deep physiological descriptions[cite: 3].
4. **Step 6 (Calibrate):** Open `Step6Calibrate.tsx`[cite: 3]. Extract `"PRECISION TUNING"`, `"Optional data improves calibration."`, `"BODY FAT %"`, `"ENABLE PRECISION MODE"`, and the final submission CTA[cite: 3].

---

## STEP 3: Centralize Resources & Apply the Hook
1. Populate `locales/en/translation.json` with all new keys[cite: 3].
2. Populate `locales/es/translation.json` with accurate Spanish equivalents[cite: 3].
3. In each of the refactored step files, ensure `useTranslation()` is correctly declared and mapping tokens dynamically[cite: 3].

---

## STEP 4: Mandatory UX Guardrail Check & Compilation Validation
We must absolutely ensure our core physiological reading timers are not bypassed[cite: 3, 5].

1. **CRITICAL REQUIREMENT:** Manually audit the refactored code to confirm that **Step 2** and **Step 5** still strictly require an intentional, manual button click to advance[cite: 1, 3, 5]. Auto-advance features must remain entirely **DISABLED** for these steps[cite: 1, 3, 5].
2. Run a full monorepo build check to make sure everything passes type validation[cite: 5]:
```bash
   npm run build