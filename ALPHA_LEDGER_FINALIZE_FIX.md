# Alpha Ledger Finalization Payload Fix

**CONTEXT:** The frontend wizard successfully saves `"locale": "es"` into our local `MM_LEDGER_ALPHA` KV namespace via step patches. However, when hitting the final calibration step, the ledger finalization worker route does not forward this `locale` preference to the metabolic engine or the document pipeline, causing results to render in English defaults.

Follow these steps to patch the backend worker routes.

---

## STEP 1: Update the Ledger Finalize Worker Route
We need to ensure the finalizer route reads the user's selected language before kicking off calculations and document compilation.

1. Locate your backend worker route handlers, specifically looking for the finalization endpoint (e.g., `packages/worker/src/routes/finalize.ts` or where `POST /api/ledger/:userId/finalize` is processed)[cite: 1, 2, 3].
2. Inside the handler, where the worker fetches the existing user session from the `MM_LEDGER_ALPHA` KV store, extract the `locale` field[cite: 2, 3]:
```typescript
   const existingLedger = await env.MM_LEDGER.get(userId, { type: "json" });
   const locale = existingLedger?.locale || 'en'; // Fallback to English if not present
   
4. AI Explanation Pass: Locate where the worker invokes the metabolic engine's explanation prompt generator (buildExplanationPrompt or queryAIExplanation). 
Ensure locale is explicitly passed into the configuration inputs.  

5. Webhook Pipeline Pass: Locate the final network webhook call that passes the fully resolved state document to the PDF Orchestrator[cite: 2, 3]. 
Ensure locale is explicitly packed into that outgoing JSON payload wrapper so the PDF template receives it. 

## STEP 2: Verify the Stateless Calculator Fallback
Our frontend architecture contains a graceful degradation fallback that fires a stateless /api/calculator request if the ledger fails. 

Let's make sure it is also protected.  Locate the stateless calculator route handler (e.g., packages/worker/src/routes/calculator.ts or similar).  

Update the incoming request payload validation to accept an optional locale field, defaulting to 'en' if missing[cite: 3].

Ensure this locale flag is forwarded to any AI text or metric rendering blocks executed during stateless processing[cite: 3].

## STEP 3: Compilation & Type Validation
Run our verification suite to confirm that our monorepo packages communicate using the updated type signatures.  
Bash
npm run build
