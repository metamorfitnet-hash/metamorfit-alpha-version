# Onboarding UX & Frontend Flow Technical Specification

This document details the frontend user onboarding funnel for the Metamorfit platform. It outlines the strict step-by-step sequence, critical UX guardrails, and how the React frontend binds to our Cloudflare KV User Ledger system.

## 1. THE 6-STEP SEQUENCE MAP

The onboarding wizard follows a strict chronological 6-step flow. Each step collects specific biometrics and metabolic preferences to fuel the engine.

- **Step 1: Persona Select (`Step1PersonaSelect`)** - Captures base demographic identity (Age, Sex).
- **Step 2: Goal Select (`Step2GoalSelect`)** - Captures the primary metabolic target (Cut, Bulk, Maintain, Recomp).
- **Step 3: Metrics (`Step3Metrics`)** - Captures physical dimensions (Weight value/unit, Height value/unit).
- **Step 4: Somatotype (`Step4Somatotype`)** - Captures genetic predispositions (Ectomorph, Mesomorph, Endomorph) and any somatotype specific nutrient-partitioning tweaks.
- **Step 5: Activity (`Step5Activity`)** - Captures the daily movement multiplier (Sedentary, Light, Moderate, Active, Very Active).
- **Step 6: Calibrate (`Step6Calibrate`)** - Captures elite precision metrics (Precision mode toggle, Body Fat Percentage) and triggers the final engine handshake.

## 2. STEP-SPECIFIC NAVIGATION GUARDRAILS

To ensure users fully comprehend the metabolic strategies being applied to their bodies, certain steps enforce strict manual navigation constraints.

> [!IMPORTANT]
> **MANUAL ADVANCE REQUIREMENT (STEPS 2 & 5)**
> Step 2 (Goals) and Step 5 (Activity Level) contain dense, critical physiological descriptions. **These steps must NEVER auto-advance or forward-progress automatically.** 
> They require explicit, intentional user action (a distinct button click) to proceed, ensuring the descriptions can be fully read by the user. Do not introduce "auto-scroll" or "auto-next" logic on these steps.

## 3. FRONTEND-TO-LEDGER DATA MAPPING

The frontend utilizes a hybrid state model, keeping the UI instantly responsive while maintaining truth in the backend `MM_LEDGER` KV namespace. The orchestration is handled via the `useOnboardingSession` hook inside `OnboardingContainer`.

- **Initialization**: On the first interaction (completing Step 1), the frontend fires `POST /api/ledger/init` to generate a `userId`, which is saved to `localStorage('mm_uid')`.
- **Snappy Updates & Safe Routing**: When a user inputs data, `updateState` immediately updates local React state for zero-latency UI feedback. However, it intercepts the routing action.
- **Partial Patching**: It calls `PATCH /api/ledger/:userId` to sync the new data. The UI step transition (moving to `currentStep + 1`) is executed **ONLY** after the backend completes saving the patch.
- **Recovery**: On a page refresh, the frontend polls the ledger API. If a session is found, it hydrates the local state. It honors the server's `currentStep` only if the user is on Step 1 (re-entry); otherwise, local state takes precedence to prevent visual jumping.
- **Final Submission (`handleCalibrate`)**: Firing the final submission triggers `POST /api/ledger/:userId/finalize`. Upon success, the ledger entry is transformed into a `MacroPayload`, persisted to `sessionStorage`, and the user is routed to the results dashboard.

## 4. VALIDATION & ERROR HANDLING STATES

To protect the deterministic metabolic engine from corrupt inputs:

- **Component-Level Input Validation**: Each step component acts as a boundary, validating inputs (e.g., preventing empty numbers for weight) before invoking the `updateState` function.
- **Backend Sync Graceful Degradation**: If `updateState` fails to save a partial step to the KV ledger, the error is caught and logged, but the user is not aggressively hard-blocked if local state remains valid.
- **Engine Handshake Fallback**: During `handleCalibrate`, if the primary ledger `finalize()` API fails (due to KV propagation or network issues), the frontend gracefully falls back to calculating the macros locally via the stateless `/api/calculator` endpoint. 
- **Fatal Error Handling**: If both the Ledger API and the Fallback API fail during calibration, the UI traps the error, disables the loading animation, and explicitly surfaces a `window.alert` ("Metabolic Engine Error. Please check your inputs.") to prevent corrupted data from navigating to the results page.
