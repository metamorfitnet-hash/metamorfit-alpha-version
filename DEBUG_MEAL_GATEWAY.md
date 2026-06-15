
# TASK: Stream Live Gateway Logs to Eliminate Meal Fetch Exception

## Objective
Isolate why `metamorfit-worker-alpha` is throwing a hard runtime crash during the meal estimation fetch by using live tail debugging and checking the sub-worker data contract.

## 1. Stream Live Cloudflare Logs
Run the following command in your terminal to listen to the live production error stream of the primary gateway worker:
```bash
npx wrangler tail --environment alpha

```

*Action*: Once the stream is open, trigger the "ESTIMAR MACROS" button in the frontend UI. Capture the exact stack trace or error message that spits out in the terminal logs.

## 2. Audit the Gateway-to-Engine Contract (`packages/worker/src/index.ts`)

Locate the route handling the meal estimation POST request. Inspect how it reads the response from the `MACRO_ENGINE` service binding:

* Check if it's expecting a raw JSON object string with specific keys (`protein`, `carbs`, `fat`), but our updated sub-worker is now returning an enclosed regex string or a wrapped object `{ response: ... }`.
* Ensure any `JSON.parse()` or field extractions are safely guarded so a format mismatch doesn't trigger an unhandled crash.

## 3. Resolution Steps

1. Align the main gateway's parsing logic to match the exact output payload format currently exported by the macro-engine sub-worker.
2. Run your compilation and type checks (`npx tsc --noEmit`).
3. Deploy the fix live using Wrangler: `npx wrangler deploy`
4. Report back with the live error log findings and the applied patch.

```
