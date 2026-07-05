# PRODUCT DIRECTIVE: PERSONALIZE CALCULATOR & MEAL PLAN DASHBOARDS

## 🚨 OBJECTIVE
Now that the identity gate is successfully capturing the user's First Name at Step 6, we must leverage that data to create an elite, custom-tailored user experience. Your task is to swap out generic placeholders like "ATLETA" or "Athlete" with the dynamic user name across the macro breakdown and meal plan creation screens.

---

## 🔍 CURRENT SITUATION (See image_44eb0c.jpg)
* On the `/calculator` results page, the main title currently reads: **"BIENVENIDO A TU PLAN, ATLETA"** (or an English equivalent like "WELCOME TO YOUR PLAN, ATHLETE").
* The word "ATLETA" is hardcoded or falling back to a static placeholder because it isn't pulling from the session state.

---

## 🛠️ REQUIRED IMMEDIATE ACTIONS

### 1. Update the Calculator Page Layout
* Locate the file rendering the `/calculator` route (likely `apps/web/src/app/calculator/page.tsx` or a related component view).
* Connect this layout to the global session state provider or the onboarding data `ledger` where the name was saved during Step 6.
* Dynamically render the header text. For example:
  * **Spanish:** `BIENVENIDO A TU PLAN, ${state.name.toUpperCase()}`
  * **English:** `WELCOME TO YOUR PLAN, ${state.name.toUpperCase()}`
* Ensure there is a clean fallback to "ATLETA" / "ATHLETE" only if the name string is completely missing for some reason.

### 2. Update the Meal Plan Layout
* Navigate to the subsequent meal plan creation views (such as `apps/web/src/app/meal-plan/page.tsx`).
* Audit any secondary text banners, welcome headlines, or section titles.
* Ensure any greeting placeholders are similarly refactored to speak directly to the user by their captured first name.

---

## 🛑 CONFIRMATION CRITERIA
Before marking this complete, verify that:
1. You have identified the exact files rendering the `/calculator` text shown in image_44eb0c.jpg.
2. The code reads the name value stored in the global session context rather than a static fallback.
3. Provide the file paths and show the code snippet or git diff of your changes to confirm implementation.