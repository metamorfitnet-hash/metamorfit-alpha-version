# PRODUCT DIRECTIVE: FIX ONBOARDING BIOMETRICS & EMAIL PDF COMPILATION

## 🚨 CURRENT DEFECTS TO SOLVE

1. **Missing Body Fat Step:** The body fat percentage selector step has completely disappeared from the onboarding flow. Because of this, the final PDF prints a blank `--% BF` placeholder.
2. **Stale Age Value in PDF:** The PDF layout is failing to update the user's age dynamically, leaving it stuck at a default layout fallback value (`23y`).
3. **Broken Email PDF vs. Valid Client Download:** Clicking the download button on the thank you page outputs a well-formed document. However, the copy sent automatically via email arrives mostly blank (only displaying the template headers "Metabolic Blueprint" and "Metabolic Strategy"). The backend email trigger is executing prematurely with an incomplete state payload.

---

## 🛠️ REQUIRED IMMEDIATE ACTIONS

### 1. Restore the Body Fat Onboarding Step
* Check your onboarding step routing logic (likely in `OnboardingContainer.tsx` or your steps configurations).
* Ensure that the body fat input component is correctly included in the wizard cycle before Step 6. 
* Verify that the chosen value is saved securely to the global session `state` and `ledger` as `bodyFat`.

### 2. Fix the PDF Data Payload Mapping (Age & Body Fat)
* Locate the utility handling data serialization for the PDF template worker.
* Ensure `age` and `bodyFat` are properly extracted from the session state / ledger and passed directly into the payload fields matching your rendering template layout.

### 3. Synchronize the Email PDF Generation Pipeline
* Track down the backend worker or webhook function triggering the email delivery when transitioning through the confirmation screens.
* Ensure the automated email worker waits until the entire metabolic profile and full meal plan matrices are fully generated and committed to the database before compilation. It must use the exact same complete data payload that the client-side download button uses.

---

## 🛑 CONFIRMATION CRITERIA
1. Walk through the onboarding flow and verify that the body fat collection step is fully interactive.
2. Verify that the generated PDF successfully outputs the correct user age and body fat percentage.
3. Test the email workflow and confirm that the attached PDF document matches the full layout of the direct download asset.