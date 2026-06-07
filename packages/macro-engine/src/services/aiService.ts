import { withRetry } from '../utils/retry';

export interface ExplanationInput {
  identity: {
    name?: string;
    age?: number;
    weightKg?: number;
    heightCm?: number;
    goal?: string;
    bodyType?: string;
  };
  metabolicProfile: {
    proteinGrams: number;
    carbsGrams: number;
    fatsGrams: number;
    targetKcal?: number;
    tdee?: number;
  };
  personalizationScore?: number;
}

export function buildExplanationPrompt(data: ExplanationInput): string {
  return `You are the supportive narrator of the Metamorfit metabolic engine.
Your role is to help the user understand WHY their personalized plan is appropriate for their body, their goal, and their lifestyle.

You must follow these rules:

1. The engine’s macro and calorie outputs are FINAL and AUTHORITATIVE.
   - Never critique them.
   - Never suggest increasing or decreasing anything.

2. Your job is to EXPLAIN, not modify.
   - Always frame the engine’s numbers as intentional and aligned with the user’s goal.

3. Use a supportive, encouraging, human tone.

You MUST output ONLY a valid JSON object matching this schema:
{
  "paragraph1": "string (Focus on their specific body type, goal, and metabolic rate)",
  "paragraph2": "string (Focus on how the protein and energy balance supports them)",
  "paragraph3": "string (Focus on adherence and a supportive closing)"
}

USER CONTEXT:
Biometrics: ${JSON.stringify(data.identity)}
Macro Targets: ${JSON.stringify(data.metabolicProfile)}
Personalization Score: ${data.personalizationScore}`;
}

export async function getAiExplanation(env: any, data: ExplanationInput): Promise<{ explanation: string; latencyMs: number }> {
  const prompt = buildExplanationPrompt(data);
  const startTime = Date.now();
  
  try {
    const aiResponse = await withRetry(async () => {
      return await env.AI.run("@cf/openai/gpt-oss-120b", { 
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 600,
        temperature: 0.4
      }) as any;
    }, 2, 2000);

    const latencyMs = Date.now() - startTime;
    let raw = aiResponse?.choices?.[0]?.message?.content || "";
    raw = raw.trim();
    if (raw.startsWith("```json")) raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    if (raw.startsWith("```")) raw = raw.replace(/```/g, "").trim();
    
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) raw = jsonMatch[0];

    const parsed = JSON.parse(raw);
    let explanation = "";
    
    if (parsed.paragraph1 && parsed.paragraph2 && parsed.paragraph3) {
      explanation = `${parsed.paragraph1}\n\n${parsed.paragraph2}\n\n${parsed.paragraph3}`;
    } else {
      const values = Object.values(parsed);
      if (values.length > 0 && typeof values[0] === 'string') {
        explanation = values.join("\n\n");
      } else {
        throw new Error("Invalid JSON schema structure from AI");
      }
    }
    
    return { explanation, latencyMs };
  } catch (e: any) {
    const latencyMs = Date.now() - startTime;
    console.error("[AI/Explanation] Failed:", e.message);
    
    if (env.JOB_STATUS) {
      await env.JOB_STATUS.put(`AI_ERROR_${Date.now()}`, JSON.stringify({
        error: e.message,
        latencyMs,
        time: new Date().toISOString()
      }), { expirationTtl: 86400 });
    }
    
    const fallback = "This metabolic profile is designed specifically for your body type and goal. Adherence to these targets will drive the physiological adaptations necessary to reach your goal efficiently.";
    return { explanation: fallback, latencyMs };
  }
}
