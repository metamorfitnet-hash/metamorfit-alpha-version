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

export function getSystemPrompt(): string {
  return `You are the AI Insight Analyst for Metamorfit. Your job is to deliver clinical, high-density metabolic insights based on user biometrics and goals. 

Strictly adhere to the following formatting rules:
- Provide exactly three short paragraphs.
- Do not use any subheadings, bullet points, or markdown lists.
- Do not include conversational fluff, greetings, or conclusions.
- Reference the calculated biometric values natively as context, but do not recalculate them or change the baseline numbers. Keep the tone authoritative, concise, and scientifically precise.

You MUST output ONLY a valid JSON object matching this schema:
{
  "strategy": "Your first paragraph here explaining the overriding rationale behind the protein targets and macronutrient split based on their chosen persona/goal",
  "fuelMatrix": "Your second paragraph here detailing the fuel synergy required for their specific body type/somatotype and how their metabolism handles macro distribution",
  "edgeTip": "Your third paragraph here giving a highly actionable, high-impact piece of timing or behavioral advice based on their activity profile"
}`;
}

export function getUserPrompt(data: ExplanationInput): string {
  return `USER CONTEXT:
Biometrics: ${JSON.stringify(data.identity, null, 2)}
Macro Targets: ${JSON.stringify(data.metabolicProfile, null, 2)}
Personalization Score: ${data.personalizationScore}`;
}

export async function getAiExplanation(env: any, data: ExplanationInput): Promise<{ explanation: string; latencyMs: number }> {
  const systemPrompt = getSystemPrompt();
  const userPrompt = getUserPrompt(data);
  const startTime = Date.now();
  
  try {
    const aiResponse = await withRetry(async () => {
      return await env.AI.run("@cf/openai/gpt-oss-120b", { 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 1000, 
        response_format: { type: "json_object" },
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
    
    if (parsed.strategy && parsed.fuelMatrix && parsed.edgeTip) {
      explanation = `STRATEGY: ${parsed.strategy}\n\nFUEL MATRIX: ${parsed.fuelMatrix}\n\nEDGE TIP: ${parsed.edgeTip}`;
    } else {
      const values = Object.values(parsed);
      if (values.length >= 3) {
        explanation = `STRATEGY: ${values[0]}\n\nFUEL MATRIX: ${values[1]}\n\nEDGE TIP: ${values[2]}`;
      } else {
        throw new Error("Invalid AI JSON schema");
      }
    }
    
    console.log("🧠 DEBUG BACKEND: Prompt executing with headers Strategy/Fuel/Edge");
    
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
