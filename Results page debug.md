### SYSTEM INSTRUCTION / BUG FIX REQUEST

**Context:** We are troubleshooting the Results Page of the application. Currently, the page is rendering fallback UI states and losing user configuration during the transition from the onboarding wizard.

Please investigate and execute fixes for the following three issues:

---

#### 1. Language State Persistence Bug
* **Symptom:** When navigating to or refreshing the results page, the app loses the Spanish language selection, forcing the user to click the global language toggle in the header again.
* **Task:** Ensure the global language toggle persists the selected locale (`'es'` / `'en'`) to `localStorage` or a global state synchronization layer. Update the Results Page component to read this persistent state on mount so it hydrates in the correct language seamlessly.

---

#### 2. AI Metabolic Insight Raw Text Parsing
* **Symptom:** The AI Insight component is rendering a generic fallback string (*"Tu perfil metabólico está listo..."*) instead of the dynamic AI payload. 
* **Task:** * Verify that the AI service is writing the raw text payload to the centralized data ledger (Cloudflare KV).
  * Ensure the Results Page parser is correctly reading this raw text block and breaking it out by its designated headers: **`STRATEGY:`**, **`FUEL MATRIX:`**, and **`EDGE TIP:`**. 
  * Disable any outdated JSON parsing constraints on this specific payload block.

---

#### 3. Personalized Card Hydration Failure
* **Symptom:** The three metrics cards (*Partición de Nutrientes*, *Escala de Actividad*, *Déficit Calórico*) are displaying hardcoded, static descriptions instead of dynamic, calculated metrics.
* **Task:** Check the asynchronous data-fetching hook on the Results Page. Ensure the component correctly awaits the data fetch from the Cloudflare KV ledger before rendering, preventing it from permanently locking into fallback translation strings.

---

**Execution Requirements:**
1. Review the router transition logic between onboarding and the results view.
2. Verify network/ledger payload integration to ensure data is present.
3. Run a local verification check once the state persistence and data hydration are resolved.