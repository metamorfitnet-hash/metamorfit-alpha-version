import { withRetry } from './utils/retry';

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
- Every single response must use this exact structure, starting each paragraph with these specific headers:
  
STRATEGY: [Your first paragraph here explaining the overriding rationale behind the protein targets and macronutrient split based on their chosen persona/goal]

FUEL MATRIX: [Your second paragraph here detailing the fuel synergy required for their specific body type/somatotype and how their metabolism handles macro distribution]

EDGE TIP: [Your third paragraph here giving a highly actionable, high-impact piece of timing or behavioral advice based on their activity profile]

- Do not use any subheadings, bullet points, or markdown lists.
- Do not include conversational fluff, greetings, or conclusions (e.g., "I hope this helps!").
- Insert exactly double line breaks (\\n\\n) between the three sections to ensure proper rendering on the frontend and PDF output modules.
- Reference the calculated biometric values natively as context, but do not recalculate them or change the baseline numbers. Keep the tone authoritative, concise, and scientifically precise.`;
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
        temperature: 0.4
      }) as any;
    }, 2, 2000);

    const latencyMs = Date.now() - startTime;
    let raw = aiResponse?.choices?.[0]?.message?.content || "";
    let explanation = raw.trim();
    
    console.log("🧠 DEBUG BACKEND: Prompt executing with headers Strategy/Fuel/Edge");
    
    return { explanation, latencyMs };
  } catch (e: any) {
    const latencyMs = Date.now() - startTime;
    console.error("[AI/Explanation] Failed:", e.message);
    
    if (env.JOB_STATUS) {
      const errorLog = {
        error: e.message,
        timestamp: new Date().toISOString(),
        promptSnippet: prompt.substring(0, 500),
        latencyMs
      };
      await env.JOB_STATUS.put(`AI_ERROR_${Date.now()}`, JSON.stringify(errorLog), { expirationTtl: 86400 });
    }
    
    const fallback = "This metabolic profile is designed specifically for your body type and goal. The macros provided will ensure optimal fuel for your daily energy expenditure while supporting muscle retention and metabolic health.\n\nBy prioritizing protein and correctly balancing your energy sources, this plan creates a stable foundation for consistent progress without the fatigue associated with generic diets.\n\nAdherence to these targets will drive the physiological adaptations necessary to reach your goal efficiently. Trust the process and focus on consistency.";
    return { explanation: fallback, latencyMs };
  }
}
