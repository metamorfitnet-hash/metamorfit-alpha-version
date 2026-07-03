# PRODUCT DIRECTIVE: USER JOURNEY REFACTOR & DATA PERSISTENCE FIX

## 🚨 OBJECTIVE
We recently reviewed our alpha version app flow and identified a critical "Duplicate Data Wall" friction point alongside a "Personalization Gap"[cite: 1]. Your goal is to streamline the data flow so that the application gathers user identity information *once* at the beginning, utilizes it dynamically for deep personalization throughout the journey, and allows a seamless, single-click PDF generation at the very end without prompting the user for their email a second time[cite: 1].

---

## 🔍 CURRENT SITUATION & DISCONNECTS

1. **The Duplicate Email Wall:** The application successfully captures the user's email early on to save biometrics[cite: 1]. However, at the end of the journey—after the user reviews their results, customizes their meal plans, and clicks "Generate PDF"—the system prompts them for their email a second time[cite: 1]. This is redundant and harms user trust[cite: 1].
2. **The Personalization Gap:** The current onboarding flow captures an email address but fails to ask for the user's name[cite: 1]. Because of this, the onboarding results page, macro breakdowns, and final meal plan cannot be dynamically personalized[cite: 1].
3. **The Blank PDF Bug:** Currently, clicking the final download button triggers a rendering process that outputs an entirely blank canvas[cite: 1]. This is highly likely an async race condition or a state-passing issue where the metabolic and meal plan data payloads are not reaching the PDF rendering scope[cite: 1].

---

## 🎯 THE TARGET USER JOURNEY

We are restructuring the data pipeline to follow a strict "gather once, utilize everywhere" architecture[cite: 1]:

[ STEP 1: IDENTITY ] ──> [ BIOMETRICS ] ──> [ RESULTS & MEAL PLAN ] ──> [ FINAL DOWNLOAD ]
Captures Name &             Steps 2-5        Displays elite engine     Instant single download.
Email together.                              data personalized by name. No secondary email prompt.


*   **The Start:** Capture **First Name** ("What should we call you?") and **Email Address** together right at Step 1[cite: 1]. Both fields must be validated and required before the user can advance[cite: 1].
*   **The Middle:** The application must use the captured name to personally address the user across the calculation screens, macro dashboards, and meal planners (e.g., *"Welcome to your engine blueprint, [Name]"*)[cite: 1]. 
*   **The End:** The user must be able to view their entire macro breakdown and customize their meal plan completely in-app without any mid-way file download triggers. When they click the final "Generate PDF" button, it must pull the name, email, and the finalized meal plan from the global session state to seamlessly compile the document[cite: 1]. **No secondary forms or modals allowed.**[cite: 1]

---

## 🛑 MANDATORY PRE-FLIGHT INSTRUCTIONS FOR THE AGENT

Do **not** write, refactor, or commit any code yet. You must complete the following two investigative phases first:

### PHASE 1: CODEBASE & FLOW REVIEW
Locate and audit the current implementation files to identify exactly where the breakdown is occurring. Specifically look for:
*   The onboarding wizard state management logic (where Step 1 fields are handled)[cite: 1].
*   The exact component or utility processing the final PDF layout and assembly (`/onboarding-v2` or the respective export module)[cite: 1].
*   Where the secondary email capture prompt/modal is being triggered at the end of the meal planner flow[cite: 1].
*   How data state (metrics, profile data, customized meal plans) is passed to your PDF rendering engine (e.g., Gotenberg/Google Cloud pipeline) to diagnose the blank PDF bug[cite: 1].

### PHASE 2: ARCHITECTURAL SOLUTION PLAN
Before making code modifications, print a comprehensive **Execution Plan** in your workspace detailing:
1.  How you intend to expand the global state schema to support the new `name` attribute[cite: 1].
2.  The exact UI component file where you will insert the "First Name" field and how you will update its step validation[cite: 1].
3.  The specific file paths where the secondary email prompt will be completely stripped out[cite: 1].
4.  How you will ensure the fully populated meal plan payload successfully bridges into the PDF rendering function to resolve the blank canvas error[cite: 1].

**Once you have generated this plan, wait for confirmation to execute.**