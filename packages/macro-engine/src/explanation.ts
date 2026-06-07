import { withRetry } from './utils/retry';

export interface ExplanationInput {
  locale?: 'en' | 'es';
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
  const languageRule = data.locale === 'es'
    ? `\n\nCRITICAL SYSTEM RULE: You MUST write all paragraph content entirely in Spanish (Castilian/Neutral Spanish). 
However, you MUST keep the structural JSON key names exactly as defined ("paragraph1", "paragraph2", "paragraph3") in English. 
Do not translate the keys, only translate the markdown text values.`
    : '';

  return `You are the supportive narrator of the Metamorfit metabolic engine.
Your role is to help the user understand WHY their personalized plan is appropriate for their body, their goal, and their lifestyle.${languageRule}

You must follow these rules:

1. The engine’s macro and calorie outputs are FINAL and AUTHORITATIVE.
   - Never critique them.
   - Never suggest increasing or decreasing anything.
   - Never imply something is "low," "high," or "should be adjusted."

2. Your job is to EXPLAIN, not modify.
   - Always frame the engine’s numbers as intentional, personalized, and aligned with the user’s goal.

3. Use a supportive, encouraging, human tone.
   - Speak to the user as if you’re guiding them through a journey.
   - Make them feel understood, capable, and supported.

4. When discussing protein:
   - Always affirm that the protein target is appropriate for their goal, body composition, and training needs.
   - Highlight benefits like recovery, satiety, muscle support, and metabolic stability.
   - Never recommend raising or lowering protein.

5. When discussing carbs and fats:
   - Explain how the distribution supports energy, performance, and adherence.
   - Never suggest changes.

6. When discussing calories:
   - Reinforce that the calorie target is tailored to their goal and physiology.
   - Never critique or adjust.

7. Personalization:
   - Reference the user’s goal (cut, maintain, recomp, bulk).
   - Reference their body type or training style if provided.
   - Use warm, encouraging language that makes the user feel seen.

8. Tone:
   - Supportive, positive, and empowering.
   - No warnings, no fear-based language, no clinical coldness.

Your mission is to help the user feel confident, supported, and excited about their personalized plan — never to question or modify it.

You MUST output ONLY a valid JSON object matching this schema. Do not include markdown code blocks or conversational filler:
{
  "paragraph1": "string (Focus on their specific body type, goal, and metabolic rate)",
  "paragraph2": "string (Focus on how the protein and energy balance supports them)",
  "paragraph3": "string (Focus on adherence and a supportive closing)"
}

No emojis. No storytelling. No repeating the input.

USER CONTEXT:
Biometrics: ${JSON.stringify(data.identity, null, 2)}
Macro Targets: ${JSON.stringify(data.metabolicProfile, null, 2)}
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
      const errorLog = {
        error: e.message,
        timestamp: new Date().toISOString(),
        promptSnippet: prompt.substring(0, 500),
        latencyMs
      };
      await env.JOB_STATUS.put(`AI_ERROR_${Date.now()}`, JSON.stringify(errorLog), { expirationTtl: 86400 });
    }
    
    const fallback = data.locale === 'es'
      ? "Este perfil metabólico está diseñado específicamente para tu tipo de cuerpo y objetivo. Los macros proporcionados asegurarán el combustible óptimo para tu gasto energético diario mientras apoyan la retención muscular y la salud metabólica.\n\nAl priorizar la proteína y equilibrar correctamente tus fuentes de energía, este plan crea una base estable para un progreso constante sin la fatiga asociada con dietas genéricas.\n\nLa adherencia a estos objetivos impulsará las adaptaciones fisiológicas necesarias para alcanzar tu objetivo de manera eficiente. Confía en el proceso y enfócate en la consistencia."
      : "This metabolic profile is designed specifically for your body type and goal. The macros provided will ensure optimal fuel for your daily energy expenditure while supporting muscle retention and metabolic health.\n\nBy prioritizing protein and correctly balancing your energy sources, this plan creates a stable foundation for consistent progress without the fatigue associated with generic diets.\n\nAdherence to these targets will drive the physiological adaptations necessary to reach your goal efficiently. Trust the process and focus on consistency.";
    return { explanation: fallback, latencyMs };
  }
}
