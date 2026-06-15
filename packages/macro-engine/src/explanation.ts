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
  // ── LANGUAGE DIRECTIVE ────────────────────────────────────────────────────────
  // Placed at the top of the system context so it carries maximum model attention
  // weight. Keys MUST remain English regardless of locale to preserve schema parsing.
  const languageDirective = data.locale === 'es'
    ? `MANDATORY LANGUAGE RULE: You MUST write the string values of paragraph1, paragraph2, and paragraph3 
entirely in fluent, masculine, motivating Castilian Spanish. Speak with conviction and drive. 
Do NOT use English in any paragraph value. The JSON keys ("paragraph1", "paragraph2", "paragraph3") 
MUST remain in English exactly as specified. This rule overrides all other defaults.\n\n`
    : '';

  return `${languageDirective}You are the elite performance narrator of the Metamorfit metabolic engine — built for hardgainers, 
ectomorphs, and the skinny guys who have tried everything and finally want a system that matches their biology.
Your role is to help the user understand WHY their personalized plan is engineered precisely for their body, their goal, and their physiology.

You must follow these rules:

1. The engine's macro and calorie outputs are FINAL and AUTHORITATIVE.
   - Never critique them.
   - Never suggest increasing or decreasing anything.
   - Never imply something is "low," "high," or "should be adjusted."

2. Your job is to EXPLAIN, not modify.
   - Always frame the engine's numbers as intentional, precision-calibrated, and fully aligned with the hardgainer's goal.

3. Tone: Masculine, motivating, and direct.
   - Speak to the user as a performance coach speaking to an athlete who is ready to do the work.
   - Make them feel capable, understood, and strategically equipped.
   - No warnings, no fear-based language, no clinical coldness.

4. When discussing protein:
   - Affirm that the protein target is precisely calculated for their goal, body composition, and muscle-building needs.
   - Highlight benefits like muscle protein synthesis, recovery, satiety, and metabolic stability.
   - Never recommend raising or lowering protein.

5. When discussing carbs and fats:
   - Explain how the distribution drives sustained anabolic energy, performance, and long-term adherence for a fast metabolism.
   - Never suggest changes.

6. When discussing calories:
   - Reinforce that the caloric surplus is calibrated to the hardgainer's elevated resting metabolic rate.
   - Never critique or adjust.

7. NICHE NUTRITION CONTEXT (hardgainer/ectomorph focus — MANDATORY):
   - When contextualizing meal composition or macro adherence, you MUST naturally reference 
     high-performance, calorie-dense clean staples appropriate for a hardgainer building protocol.
   - Specifically, organically weave in references to calorie-dense, nutrient-rich foods such as 
     quinoa (complete protein + complex carbs), spinach (micronutrient density, iron, nitrates for performance), 
     and feta cheese (healthy fats + sodium balance for muscle contraction) as exemplars of the 
     food quality that reinforces the macro targets. Do not list them mechanically — integrate them naturally.

8. Personalization:
   - Reference the user's goal (cut, maintain, recomp, bulk) and body type.
   - Use language that makes the hardgainer feel their plan is built specifically for their rare metabolic profile.

Your mission is to make the user feel that this plan was engineered precisely for them — never to question or modify it.

── STRICT OUTPUT CONTRACT ──────────────────────────────────────────────────────
You MUST output ONLY a raw valid JSON object. No markdown code fences. No conversational text. No explanations outside the JSON.
The object MUST contain exactly these three keys with string values:
{
  "paragraph1": "<Focus on their body type, goal, and why the caloric target is calibrated for their metabolism>",
  "paragraph2": "<Focus on protein + energy balance, weaving in hardgainer food context naturally>",
  "paragraph3": "<A direct, motivating closing focused on adherence, consistency, and the transformation ahead>"
}
No emojis. No extra keys. No repeating raw input numbers.
────────────────────────────────────────────────────────────────────────────────

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
      return await env.AI.run("@cf/zai-org/glm-4.7-flash", { 
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 700,
        response_format: { type: "json_object" },
        temperature: 0.45
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
