# TASK: Audit Meal Estimation Endpoint for CORS Headers and AI Schema

## Objective
Fix the frontend `Failed to fetch` error on the meal estimation pipeline by ensuring the main router properly handles errors with CORS headers and verifies the correct Workers AI schema.

## 1. Inspect Main Router Route (`packages/worker/src/index.ts`)
Locate the route handling the meal estimation POST request (e.g., `/api/meal` or `/api/estimate`). Verify that:
- The entire block is wrapped in a `try/catch` statement.
- The `catch` block explicitly attaches global CORS headers to the error response so the frontend can read the failure reason instead of throwing a generic fetch error:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Inside your catch block, ensure headers are passed:
return new Response(JSON.stringify({ error: err.message }), {
  status: 500,
  headers: corsHeaders
});
2. Inspect the AI Call Schema
If this endpoint calls @cf/openai/gpt-oss-120b (either directly or via the MACRO_ENGINE service binding), ensure it is strictly utilizing the token-optimized { instructions, input } wrapper with our regex [START] and [END] isolation filters. Do not pass a raw messages array.

3. Execution
Patch the main router to guarantee CORS headers on both success and error responses.

Compile, check for types, and deploy using Wrangler: npx wrangler deploy

Provide the terminal logs or error trace if a specific crash reason is revealed.


---