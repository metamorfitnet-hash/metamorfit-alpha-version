# Alpha UI & Branding Isolation Instructions

**CONTEXT:** We have successfully isolated our backend infrastructure via local Wrangler emulation[cite: 1, 2]. Now, we need to completely isolate the user interface[cite: 1, 3]. The objective is to replace "Beta 2.0" references and inject a visual "Alpha" indicator so it is impossible to mistake this sandbox environment for the live production web app[cite: 1, 3].

Follow these steps sequentially to update the frontend codebase.

---

## STEP 1: Audit Branding & Hardcoded Strings
Before executing replacements, scan the application directory to identify where the primary user-facing branding and document generation headers are stored.

1. **Locate UI Elements:** Search `apps/web/src/` for hardcoded instances of `"Metamorfit"`, `"Metamorfit Beta"`, and `"Beta 2.0"`[cite: 1, 3]. Pay specific attention to:
   - `apps/web/src/components/onboarding-v2/OnboardingHeader.tsx`[cite: 1, 3]
   - `apps/web/src/components/onboarding-v2/OnboardingContainer.tsx`[cite: 1, 3]
   - Global layout or navbar files (e.g., `Header.tsx`)[cite: 3]
2. **Locate Document Templates:** Search `packages/macro-engine/src/` for hardcoded PDF and Email text strings[cite: 1, 6]:
   - `packages/macro-engine/src/pdf-template.tsx`[cite: 1, 3]
   - `packages/macro-engine/src/PersonalizedPlanEmail.tsx`[cite: 1, 3]

---

## STEP 2: Update Metadata & Browser Tab Titles
To prevent visual confusion when managing multiple open browser tabs, update the app's global HTML metadata and tab titles.

- Locate the primary Next.js page layouts, `index.html`, or metadata configuration files.
- Change browser `<title>` tags and OpenGraph/SEO meta titles from `"Metamorfit"` or `"Metamorfit Beta 2.0"` strictly to **`"Metamorfit [ALPHA]"`**.

---

## STEP 3: Inject the Visual "Alpha Safety Banner"
We need a persistent visual cue that screams "Sandbox" without breaking our responsive layout or UI step navigation structures[cite: 1, 5].

1. Open the global onboarding UI wrapper component (e.g., `apps/web/src/components/onboarding-v2/OnboardingContainer.tsx` or `Header.tsx`)[cite: 1, 3].
2. Inject a fixed-position, high-visibility global banner or a prominent sticky header badge at the very top of the viewport interface[cite: 1].
3. **Styling Rules:**
   - Use a bold, distinct color palette (e.g., Amber/Orange background with dark text, or Deep Purple with white text) to starkly differentiate it from the standard production design theme.
   - Text Content: **`⚠️ ALPHA DEVELOPMENT ENVIRONMENT — LOCAL SANDBOX ⚠️`**
   - Ensure the banner is set to a high `z-index` so it overlays all content layers but does not cover up critical buttons or step progression navigation arrows[cite: 5].

---

## STEP 4: Refactor Document Delivery Headers
When testing the document delivery pipeline locally, the assets generated should be visually distinct[cite: 1, 6].

1. **PDF Blueprint Update:** Modify `pdf-template.tsx` to add an "Alpha Tester Copy" watermark or modify the document header title to read `"Your Metamorfit Alpha Plan"`[cite: 1, 3].
2. **Email Template Update:** Update `PersonalizedPlanEmail.tsx` so that local test emails explicitly mention `"Metamorfit Alpha Engine Output"` in both the subject line and the email preheader[cite: 1, 3, 6].

---

## STEP 5: Integrity Verification
Once the string and styling modifications are complete, verify that the application still runs safely[cite: 5].

1. Refresh the local web app development server[cite: 1].
2. Step through the entire 6-step onboarding funnel locally[cite: 1, 5].
3. **UX Guardrail Verification:** Double-check that our core interaction rules remain perfectly intact:
   - 🔒 **Step 2 (Goal Select)** MUST still require an intentional manual button click to advance[cite: 1, 5].
   - 🔒 **Step 5 (Activity Profile)** MUST still require an intentional manual button click to advance[cite: 1, 5].
   - Auto-advance behavior must remain completely **DISABLED** for both of these steps[cite: 1, 5].