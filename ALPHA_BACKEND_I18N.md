# Alpha Backend & Document Pipeline i18n Plan

**CONTEXT:** Our frontend now has the ability to track language preferences via `locale: 'en' | 'es'`. Now, we must ensure our metabolic explanation generator, PDF templates, and transactional emails respect this preference when a job is processed.

Follow these steps sequentially to make the backend architecture locale-aware.

---

## STEP 1: Update the AI Explanation Prompt (`explanation.ts`)
The metabolic engine relies on an AI model to supplement formulas with structured paragraphs[cite: 1, 4]. We need to instruct it to reply in Spanish when requested, without breaking the strict JSON schema output rule[cite: 3, 4].

1. Open `packages/macro-engine/src/explanation.ts`.
2. Update the `ExplanationInput` interface to accept the `locale?: 'en' | 'es'` parameter.
3. Inside `buildExplanationPrompt()`, read the `locale`. If `locale === 'es'`, append a strict instruction to the system prompt text:
```text
   CRITICAL SYSTEM RULE: You MUST write all paragraph content entirely in Spanish (Castilian/Neutral Spanish). 
   However, you MUST keep the structural JSON key names exactly as defined ("paragraph1", "paragraph2", "paragraph3") in English. 
   Do not translate the keys, only translate the markdown text values.
4. Fallback String: Locate the catch block that handles AI failures. Update the hardcoded static English fallback string so that it returns a matching Spanish fallback if locale === 'es'.  

## STEP 2: Refactor the PDF Rendering Template
The PDF layout has hardcoded text labels that must adapt to the user's language.  

a. Open packages/macro-engine/src/pdf-template.tsx.  
b. Ensure the template renderer function accepts a locale parameter.  
c. Extract hardcoded section headings, structural text labels, and footer labels (e.g., "YOUR PERSONALIZED MEAL PLAN", "Protein", "Carbohydrates", "Fats", "Daily Calorie Target") into a conditional dictionary at the top of the file:  TypeScript   const labels = locale === 'es' ? {
     title: "TU PLAN DE ALIMENTACIÓN PERSONALIZADO",
     calories: "Objetivo Calórico Diario",
     // ... define all parallel labels here
   } : {
     title: "YOUR PERSONALIZED MEAL PLAN",
     calories: "Daily Calorie Target",
     // ... English defaults
   }
Swap the inline JSX elements to render from your new dynamic labels object[cite: 3].

##STEP 3: Make the Brevo Email Dispatch Locale-Aware
Finally, the HTML dispatch for the plan delivery must swap languages seamlessly[cite: 3, 6].

Open packages/macro-engine/src/PersonalizedPlanEmail.tsx[cite: 1, 3].
Add locale to the email renderer function[cite: 3].
Apply the same label dictionary swapping pattern used in the PDF template to translate the email body text, call-to-action buttons, and footer notes into Spanish if locale === 'es'[cite: 3].

## STEP 4: Integrity & Build Check
Run a full compilation to verify that changing these packages doesn't introduce type mismatches across the pipeline.  Bashnpm run build