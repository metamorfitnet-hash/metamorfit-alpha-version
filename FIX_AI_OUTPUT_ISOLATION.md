

# TASK: Token-Optimized Prompt Refactor & Backend Tag Extraction

## Objective
Stop `gpt-oss-120b` inner monologue from leaking into the UI while radically reducing the system prompt size to minimize token credit usage.

## 1. Code Modification (`packages/macro-engine/src/index.ts`)
Replace the current execution block with this token-stripped instruction payload and Regex isolation filter:

```typescript
// Token-optimized payload structure
const aiResult = await env.AI.run('@cf/openai/gpt-oss-120b', {
  instructions: `You are the Metamorfit AI Performance Coach. 
Output exactly 3 lines in fluent, premium Spanish using this exact format:
STRATEGY: [One concise biomechanical sentence]
FUEL MATRIX: [One concise macro allocation sentence]
EDGE TIP: [One actionable tactical tip]

CRITICAL RULES:
- No generic platitudes (e.g., "Tu plan está diseñado"). Use exact metabolic terminology (e.g., insulin control, glycogen saturation, gastric clearance) based on the user's somatotype.
- Wrap your final 3 lines strictly inside [START] and [END] tags. Any reasoning or thinking out loud must happen outside these tags.`,

  input: `Profile: ${userAge}yo ${userSex}, ${userWeight}kg, ${userSomatotype}, ${userGoal}. Macros: ${proteinGrams}g P / ${carbsGrams}g C / ${fatGrams}g F.`
});

// Extract text within boundaries to drop reasoning noise
const rawResponse = aiResult.response || "";
const match = rawResponse.match(/\[START\]([\s\S]*?)\[END\]/);
const filteredResponse = match ? match[1].trim() : rawResponse;

return { response: filteredResponse };


## 2. Verification & Deployment Steps
Verify the code compiles cleanly.

Deploy the updated macro engine using Wrangler: npx wrangler deploy

Commit the changes to the main branch.