METAMORFIT BETA 2.0: END-TO-END
WIRING & VALIDATION PROTOCOL

Status: Restoration Complete | Current Goal: End-to-End Functional Validation
Architecture: Vercel (UI/Frontend) <-> Cloudflare (Metabolic Engine / AI Logic)

1. ARCHITECTURAL OVERVIEW
The system is now a decoupled Headless Architecture. - Frontend (Vercel):
Holds the high-fidelity UI, branding (Bebas Neue/DM Sans), and state
management. - Backend (Cloudflare Worker): Handles all heavy math, AI Meal
Estimation (Llama-3), and AI Insight generation.

2. THE MISSION-CRITICAL WIRING CHECKLIST

Phase A: Environment & Connectivity
▢ [ ] Worker URL Verification: Ensure NEXT_PUBLIC_WORKER_URL is defined
in Vercel Environment Variables.
▢ [ ] Endpoint Mapping: Validate that the UI calls /api/calculate for
macros and /api/estimate for meal analysis.
▢ [ ] CORS Pre-flight: Confirm the Cloudflare Worker allows requests from
https://beta.metamorfit.pro.

Phase B: Frontend Component Hydration
▢ [ ] Logo & Assets: Verify /public/logo.jpg is correctly referenced and
rendering in the header.
▢ [ ] Typography Audit: Confirm Bebas Neue (Headings) and DM Sans (Body)
are properly injected via next/font or layout.tsx.
▢ [ ] State Flow: Ensure the "Calibrate" button updates the hasCalculated
state to trigger the transition from "Awaiting Data" to "Results Panel."

Phase C: Logic & AI Integration
▢ [ ] Macro Engine Loop: Confirm biometric inputs (Age, Weight, Somatotype)
reach the Worker and return valid JSON.

▢ [ ] AI Insights Pipeline: Ensure the text returned from the AI is correctly
mapped to the NotesPanel or ResultsPanel.
▢ [ ] Meal Estimator functionality: Verify the text input in the "Analyze Meal"
box successfully returns estimated macro breakdowns.

3. AGENT INSTRUCTION (PASTE INTO ANTIGRAVITY)

"I need you to act as a Full-Stack QA Engineer. Your goal is to run a silent,
end-to-end audit of the Metamorfit Beta 2.0 wiring. Do not just look at the
code; simulate the data flow."

STEP 1: VERIFY ENVIRONMENT
Search all process.env references. Ensure the frontend knows exactly where
the Cloudflare Worker is. If a hardcoded URL exists, replace it with the
environment variable.

STEP 2: TEST THE FETCHER HOOKS
Inspect apps/web/src/hooks/useCalculator.ts. - It MUST use fetch() to
call the Cloudflare Worker. - If it is still using the local metabolic-engine.ts,
RE-WIRE it to use the Worker API. - Ensure the body of the POST request
matches the JSON schema expected by the Worker.

STEP 3: REANIMATE THE AI INSIGHTS
Inspect NotesPanel.tsx and ResultsPanel.tsx. - Find why the AI Insight
block is hidden. - Ensure that once the Worker returns a response, the
insights or notes state is populated and the "Awaiting" placeholder is hidden.

STEP 4: REPAIR THE LOGO & FONTS
▢ Check layout.tsx. If fonts are broken, fix the CSS import.
▢ Check the Header component. If the logo is missing, fix the path to /
logo.jpg.

STEP 5: VALIDATION
Run a simulated build. If you find a broken link or a missing import, fix it
immediately. Do not ask for permission; solve the wiring issues to make the site
100% functional."