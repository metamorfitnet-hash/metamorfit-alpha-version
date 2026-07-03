# Architectural Solution Plan: User Journey Refactor & Data Persistence Fix

## 1. File Paths Identified
Based on the codebase audit, the following key files have been identified for modification:
- **State Schema:** `apps/web/src/components/onboarding-v2/types.ts`
- **State Provider:** `apps/web/src/components/onboarding-v2/OnboardingContainer.tsx`
- **Step 1 UI:** `apps/web/src/components/onboarding-v2/steps/Step1PersonaSelect.tsx`
- **Step 6 UI (Current Email Location):** `apps/web/src/components/onboarding-v2/steps/Step6Calibrate.tsx`
- **Post-Meal Plan View:** `apps/web/src/app/meal-plan/page.tsx`
- **Secondary Modal (To be removed/bypassed):** `apps/web/src/components/EmailGateModal.tsx`

## 2. State Schema Modification Plan
- **`types.ts`**: We will expand `OnboardingState` by adding `name: string | null;` to securely capture the user's First Name.
- **`OnboardingContainer.tsx`**: We will initialize the default state to include `name: null` ensuring it is natively persisted throughout the global session state and `ledger`.

## 3. UI & Validation Strategy
- **Step 1 (`Step1PersonaSelect.tsx`)**: 
  - We will insert two new required text inputs right below the language selector (or before the biometrics): "First Name" and "Email Address".
  - We will modify the `isFormValid` boolean to require both `state.name` (not empty) and `state.email` (matching the `EMAIL_REGEX`). 
  - Progression to Step 2 will be firmly locked until these fields are populated and valid.
- **Step 6 (`Step6Calibrate.tsx`)**: 
  - We will completely strip out the existing email capture logic, state, and UI. The application will trust the data already injected in Step 1.

## 4. Data Flow Pipeline Fix (Resolving Blank PDF Bug)
- **Bypassing the Gate:** The secondary prompt (`EmailGateModal.tsx`) will be decoupled from the final dashboard (`page.tsx`).
- **Direct Payload Injection:** Inside `page.tsx`, the `handleGenerate` button will be refactored to handle the API generation call directly instead of triggering a modal.
- **Solving the Race Condition:** We will construct the `workerPayload` directly inside `page.tsx`'s generation pipeline. It will pull `name` and `email` straight from the `ledger.data` / session state, and it will pull the synchronized `meals` and `totals` directly from the local component state. 
- Because the data is bridged immediately inside the parent view, the async race condition (which was passing empty `mealPlan` props to the unmounted modal) will be resolved, ensuring the Gotenberg/Cloud Worker receives the fully populated payload. 

## User Review Required
> [!IMPORTANT]
> The plan is ready. Please review the architecture above. If approved, I will begin modifying the codebase according to this strict "gather once, utilize everywhere" philosophy.
