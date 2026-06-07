# Task: Implement Auto-Advance Onboarding UI

## 1. Objective
Refactor the initial user journey by implementing a modern, highly engaging 6-step onboarding flow into a single-page, that appears immediately after the landing page. This implementation must strictly adhere to the Metamorfit Brand DNA and visual identity, utilizing an "Auto-Advance" mechanism to minimize friction for users who may not know how to use the tool. The new UI must utilize a step-by-step card design, an overarching progress bar, and an "Auto-Advance" mechanism to minimize manual clicks, reduce friction, and maximize user completion rates.

## 2. Global UI & Branding Requirements
* **Color Palette:** Dark Charcoal (#121212) backgrounds with Metallic Gold/Yellow (#D4AF37) accents for primary buttons, progress bars, and active states [cite: Image 1, 2].
* **Typography:** Bold, condensed sans-serif for headers and clean sans-serif for body text [cite: Image 1].
* **Layout:** * **No Pop-ups:** All steps render inline within the same page container.
    * **Persistent Header:** Maintain the title and a brief description of "Fixing the internal systems" at the top [cite: 14, 33].
    * **Progress Bar:** A gold-accented bar at the top that updates across 6 distinct steps.

## 3. The 6-Step Auto-Advance Flow
*The agent should implement the following state machine within the main onboarding container:*

### Step 1: Welcome & Persona Selection
* **Inputs:** Numeric/Dropdown fields for **Sex** and **Age** [cite: Image 1].
* **UI:** A grid of selectable persona cards (e.g., "The Hardgainer," "The Rebuilder") [cite: 15, 34].
* **Logic:** Advance to Step 2 once a persona is selected.

### Step 2: Primary Goal
* **UI:** High-contrast selection grid with options: **Maintain**, **Bulk**, **Cut**, or **Recomp** [cite: Image 1].
* **Content:** Include a small, scientifically-driven description for each (e.g., "Bulk: Optimize mTOR and protein synthesis for growth") [cite: 10, 25].
* **Logic:** Auto-advance on selection (400ms delay).

### Step 3: Physical Metrics
* **UI:** Large, focused input fields for **Weight** and **Height** [cite: Image 1].
* **Features:** Include the unit toggles (KG/LBS and CM/FT) as seen in the brand DNA [cite: Image 1].

### Step 4: Somatotype Selection (Body Type)
* **UI:** Three large interactive cards for **Ectomorph**, **Mesomorph**, and **Endomorph** with their respective descriptions [cite: Image 2].
* **Logic:** Clicking a card triggers "Auto-Advance" to Step 5 after a 400ms delay.

### Step 5: Activity Profile
* **UI:** A styled dropdown menu to select weekly activity levels (e.g., "Moderate — 3-5 days / week") [cite: Image 1].
* **Logic:** Advance to final step upon selection.

### Step 6: Precision Tuning & Calibration
* **UI:** * Toggle for **Body Fat %** (reveals input field if "Yes").
    * Toggle for **Somatotype Tweak** (Metabolic Baseline Adjust) [cite: Image 1].
* **Final Action:** "CALIBRATE METABOLIC ENGINE" button [cite: Image 1].
* **Transition:** Trigger a success animation and a loading state that transitions the progress bar to 100% before redirecting to the Results Page.

## 4. Results Page Preservation (Do Not Modify)
Upon completion, redirect to the existing results page. **Do not alter** the layout or location of:
* Macro Calculation Results and Macronutrient breakdown [cite: Image 1].
* Chart Pie visuals and Personalization Score.
* AI Insight and the specific Personalization Cards (Training, Nutrition, Recovery, Digestion) [cite: 25, 26, 27, 28].

## 5. Technical Acceptance Criteria
- [ ] All 6 steps are accessible within a single-page architecture (no page refreshes).
- [ ] Auto-advance triggers on all single-choice selection steps (Steps 1, 2, 4, 5).
- [ ] Visual styles strictly match the dark/gold Metamorfit aesthetic [cite: Image 1, 2].
- [ ] Back-navigation is supported to allow users to correct previous inputs.