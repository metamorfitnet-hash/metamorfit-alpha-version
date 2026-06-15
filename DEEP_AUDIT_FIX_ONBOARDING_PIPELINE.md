# DEEP_AUDIT_FIX_ONBOARDING_PIPELINE.md

## 1. Architectural Bug Lifecycle & Diagnostic Summary

* **Target Environment:** Metamorfit Alpha (`main` branch deployed to Vercel/Cloudflare Workers)

### Current Problem Statement

The onboarding state machine successfully processes user physical inputs to calculate localized metabolic metrics (e.g., correctly showing `1921 KCAL` on the final data layers), but the user experience breaks down structurally across three specific interaction boundaries. This occurs because hardcoded UI fallbacks are overriding the live data stream, and the global language state context is dropping during route transitions.

---

### The Three-Phase Bug Lifecycle

```
[Onboarding Step 6] ------------> [Moment Preview] ------------> [Results Page]
• Language: ES (Active)           • Language: ES (Active)          • Language: Resets to EN
• Data: Form State Capture        • Animation: Hardcoded to 2850   • AI Insight: Hardcoded Fallback

```

#### Phase 1: Onboarding Step 6 Termination

* **Behavior:** The user completes the final tracking sliders (e.g., Somatotype adjustments or Body Fat toggles).
* **State Status:** The global language state context is intact. The UI successfully renders translated copy, and the `ES` indicator button is fully active in the header array.

#### Phase 2: The "Moment Preview" Component

* **Behavior:** Right after hitting the submission button on Step 6, the system transitions to the minimalist loader animation (`Moment Preview Component`).

* **The Breakdown:** The component captures the initiation sequence and displays localized loading text. However, the linear counter animation inside this loader is explicitly bound to a hardcoded layout ceiling. Even if the underlying state calculates a custom metabolic value (such as `2204 KCAL`), the text interpolation counts directly up to `2850 KCAL` every single time right before executing the page redirect.

#### Phase 3: Results Page Instantiation

* **Behavior:** The transition component completes its timeout loop and fires a client-side route push to render the final results panel dashboard.

* **The Breakdown (Issue A - Context Drop):** The moment the layout shifts to the new route, the global context resets. The navigation bar switches back to English (`EN`) by default, completely disregarding the user's onboarding preference.

* **The Breakdown (Issue B - Fetch / Parse Error):** The `Metabolic Insight` block fails to ingest or parse the live JSON stream payload from the Cloudflare environment variable endpoint (`NEXT_PUBLIC_WORKER_A_URL`). Instead of breaking the page, the component falls back to a generic default string layout: *"Tu perfil metabólico está listo. Sigue estos objetivos para optimizar tus resultados."* This completely bypasses the custom formatting rules and fails to render the designated uppercase tracking section headers.

---

## 2. File Location & Responsible Code Audit Guide

Please inspect the following directory tree branches inside the workspace to locate and refactor the files responsible for these layout states:

### A. The Loading Animation Layer

* **Likely Path:** `apps/web/components/onboarding/MomentPreview.tsx` (or inside `apps/web/components/ui/`)

* **What to look for:** Look for a `useEffect` loop containing a `setInterval` or requestAnimationFrame counter used for the number animation. Find the variable driving the count. It is highly likely constrained by a statement resembling `if (currentCount >= 2850)` or `target = 2850`.

### B. Global Language Context Definition

* **Likely Path:** `apps/web/context/LanguageContext.tsx` or `apps/web/hooks/useI18n.ts`

* **What to look for:** Look at how the initialization state is declared. If it relies entirely on a React `useState('en')` flag without checking fallback layers, it will drop context every time the page executes a top-level route redirect.

### C. AI Metabolic Insight Dashboard Block

* **Likely Path:** `apps/web/app/results/page.tsx` or `apps/web/components/results/MetabolicInsight.tsx`

* **What to look for:** Look at the `fetch` block pointing to your API endpoints. Inspect the payload parsing block (`response.json()`). Find where the component falls back to the generic text block, and track why the error catch block is being triggered during production compilation.

---

## 3. Concrete Engineering Action Items

### Action Item 1: Bind the Counter Animation Ceiling to Real State

* **Requirement:** Do not allow the counter animation to default to `2850`.

* **Remediation:** Ensure the component accepts the primary intake data object as a configuration prop. Map the animation terminal target directly to the calculated TDEE or target calorie property derived from the user inputs.

```typescript
// Example Logic Correction Required
const targetCalories = onboardingState.calculatedCalorieTarget || computedBaseline;
// Ensure the animation counter ticks upwards to targetCalories, NOT a hardcoded 2850 string.

```

### Action Item 2: Implement Persistent State for Language Boundaries

* **Requirement:** The language flag selected during onboarding must survive the route transition to the results engine.

* **Remediation:** Refactor the language context to sync state mutations seamlessly with persistent browser memory pools (`localStorage`) or append it as an explicit route search parameter during the push execution.

```typescript
// Ensure initialization checks for active session tokens
const [lang, setLang] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('metamorfit_lang') || 'en';
  }
  return 'en';
});

```

### Action Item 3: Repair the AI Fetching Data Layer & Formatting Rules

* **Requirement:** Ensure the backend payload hydrates the UI cards correctly, showing full custom analysis text separated by crisp, uppercase layout tokens.

* **Remediation:**
1. Verify that headers, content-type checks, and authorization tokens pass securely through your proxy definitions during server-side compilation.
2. Ensure that if the user's state is set to Spanish, the prompt payload flags tell the Cloudflare backend to return fully localized insights.
3. Enforce the required layout syntax formatting: ensure raw text responses are cleanly mapped to identify and break out sections starting with **`STRATEGY:`**, **`FUEL MATRIX:`**, and **`EDGE TIP:`** inside the text parsing block.



---

> 🛑 **Note to Agent:** Do not use temporary local file patches (`.env.local`) to mask deployment network issues. Fix the underlying conditional mapping logic and context states directly inside the application files and commit the changes to `main` so the Vercel Production engine can verify the pipeline end-to-end.