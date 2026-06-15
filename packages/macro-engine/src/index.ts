import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import * as Sentry from '@sentry/cloudflare';
import { getSentryConfig } from './utils/sentry';
import { CalculateSchema, calculateMacros } from './utils/calculator';

const app = new Hono<{ Bindings: { 
  AI: any, 
  MEAL_CACHE: KVNamespace, 
  METAMORFIT_DB: D1Database,
  JOB_STATUS: KVNamespace,
  PDF_STORAGE: R2Bucket,
  SENTRY_DSN?: string
} }>();

app.use('*', cors({
  origin: ['https://metamorfit.online', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-signature', 'x-timestamp'],
  maxAge: 86400,
}));

app.onError((err, c) => {
  console.error(`[Macro Engine Error]`, err);
  Sentry.captureException(err);
  return c.json({ error: "Internal Macro Engine Error", details: err.message }, 500);
});

// Logic moved to src/utils/calculator.ts

// ─── 3. ROUTES ────────────────────────────────────────────────────────────────

app.get('/', (c) => c.text('Metamorfit Macro Engine (Internal)'));

app.post('/api/calculate', async (c) => {
  const body = await c.req.json();
  const validation = CalculateSchema.safeParse(body);
  
  if (!validation.success) {
    return c.json({ error: 'Validation failed', details: validation.error.format() }, 400);
  }

  const result = calculateMacros(validation.data);
  const locale = validation.data.locale || 'en';
  
  // ── AI INSIGHT ───────────────────────────────────────────────────────────
  // Structured fallback — uses required section headers so the frontend parser always
  // renders a clean layout even when the Workers AI call fails or times out.
  let explanation = locale === 'es'
    ? `STRATEGY: Tu plan está diseñado para maximizar tu rendimiento metabólico con base en tu perfil único.\nFUEL MATRIX: Prioriza proteína para preservar músculo y grasas saludables para energía sostenida.\nEDGE TIP: Mantén consistencia en tus macros durante al menos 4 semanas para ver resultados medibles.`
    : `STRATEGY: Your plan is engineered to maximise metabolic output based on your unique physiological profile.\nFUEL MATRIX: Prioritise protein to preserve lean mass and healthy fats for sustained energy output.\nEDGE TIP: Maintain macro consistency for at least 4 weeks to observe measurable body composition shifts.`;
  try {
    // @cf/openai/gpt-oss-120b uses the OpenAI Responses API schema —
    // NOT the Chat Completions messages[] format. The correct call shape is:
    //   { instructions: "<system context>", input: "<user prompt>" }
    // The response object is:
    //   { output: [{ content: [{ text: "..." }] }] }
    const aiResponse: any = await c.env.AI.run('@cf/openai/gpt-oss-120b', {
      instructions: `You are the elite Metamorfit AI Metabolic Orchestrator. 
Your sole task is to generate exactly three lines of highly specific, biomechanical coaching advice in Spanish based strictly on the user's profile data.

CRITICAL LAWS:
1. FORBIDDEN PHRASES: Never use generic platitudes like "Tu plan está diseñado...", "Prioriza proteína...", "Mantén la consistencia...", "para ver resultados", or "energía sostenida".
2. ABSOLUTE BIOLOGICAL MECHANISMS: Speak like an elite coach. You must address their exact somatotype challenges using concepts like insulin management, gastric clearance, carbohydrate partitioning, glycogen saturation, or metabolic flexibility.
3. OUTPUT FORMAT: Output exactly three lines. No markdown, no bolding, no code blocks, no intros/outros. Each line must match the uppercase English header, a colon, a space, and the Spanish sentence.

EXAMPLE FOR ENDOMORPH FAT LOSS (Apply this specific physiological depth):
STRATEGY: Minimiza picos de insulina reduciendo carbohidratos simples y concentrando la ingesta energética en ventanas de alta actividad glucolítica.
FUEL MATRIX: La asignación restringe carbohidratos para forzar la flexibilidad metabólica hacia la oxidación de grasas mientras protege la masa magra con proteína elevada.
EDGE TIP: Consume tus carbohidratos exclusivamente alrededor del entrenamiento para asegurar su almacenamiento como glucógeno muscular y evitar la acumulación adiposa.

EXAMPLE FOR ECTOMORPH/HARDGAINER MUSCLE GAIN (Apply this specific physiological depth):
STRATEGY: Supera la tasa de aclaramiento gástrico priorizando alimentos de alta densidad calórica para evitar el catabolismo inducido por un metabolismo acelerado.
FUEL MATRIX: El excedente calórico masivo utiliza carbohidratos complejos para saturar depósitos de glucógeno y mantener una señalización anabólica constante.
EDGE TIP: Añade grasas saludables densas como crema de almendras a tus batidos para acumular calorías fácilmente sin inducir saciedad prematura.`,

      input: `User Profile to Analyze:
- Age/Sex: ${validation.data.age}yo ${validation.data.sex}
- Weight: ${validation.data.weightKg}kg
- Fitness Goal: ${validation.data.goal}
- Somatotype: ${validation.data.bodyType || 'not specified'}
- Macro Allocation: ${result.macros.protein}g Protein, ${result.macros.carbs}g Carbs, ${result.macros.fats}g Fat`
    });

    // Log the raw response shape for diagnostics (visible in Cloudflare real-time logs).
    console.log('[Macro Engine] Raw AI response:', JSON.stringify(aiResponse));

    // Responses API returns: { output: [{ content: [{ text: "..." }] }] }
    const responseText =
      aiResponse?.output?.[0]?.content?.[0]?.text ||   // Responses API shape
      aiResponse?.choices?.[0]?.message?.content ||     // fallback: Chat Completions shape
      aiResponse?.response ||                           // fallback: simple string wrapper
      null;

    if (responseText && responseText.trim().length > 0) {
      explanation = responseText.trim();
      console.log('[Macro Engine] AI insight generated successfully.');
    } else {
      console.warn('[Macro Engine] AI returned an empty or unrecognised response shape. Using structured fallback.');
    }
  } catch (e: any) {
    // Log full error details so we can diagnose gpt-oss-120b binding failures in Cloudflare logs.
    console.error('[Macro Engine] Workers AI call failed. Serving structured fallback.');
    console.error('[Macro Engine] Error name:', e?.name);
    console.error('[Macro Engine] Error message:', e?.message);
    console.error('[Macro Engine] Error stack:', e?.stack);
    console.error('[Macro Engine] Full error object:', JSON.stringify(e, Object.getOwnPropertyNames(e)));
  }

  // Log to D1 (fire and forget)
  c.executionCtx.waitUntil((async () => {
    try {
      await c.env.METAMORFIT_DB.prepare(
        "INSERT INTO user_plans (id, email, job_id, status) VALUES (?, ?, ?, ?)"
      ).bind(crypto.randomUUID(), 'internal-engine@metamorfit.pro', 'calculation-only', 'complete').run();
    } catch (e) {
      console.error('Failed to log calculation:', e);
    }
  })());

  return c.json({ ...result, explanation });
});

import { normalizeMeal } from './utils/normalizeMeal';
import { hashMeal } from './utils/hashMeal';
import { handleGenerate } from './routes/generate';
import { handleStatus } from './routes/status';
import { handleDownload } from './routes/download';
import { handleSync } from './routes/sync';
import { handleStats } from './routes/stats';
import { handleHealth } from './routes/health';
import { handleSendPdf } from './routes/sendPdf';
import { handleGallery } from './routes/gallery';

// ─── 3. ORCHESTRATION ROUTES ──────────────────────────────────────────────────

app.post('/api/generate', async (c) => {
  return await handleGenerate(c.req.raw, c.env, c.executionCtx, {});
});

app.post('/api/send-pdf', async (c) => {
  return await handleSendPdf(c.req.raw, c.env, c.executionCtx, {});
});

app.get('/api/status/:jobId', async (c) => {
  const url = new URL(c.req.url);
  return await handleStatus(c.req.raw, c.env, url, {});
});

app.get('/api/download/:jobId', async (c) => {
  const url = new URL(c.req.url);
  return await handleDownload(c.req.raw, c.env, url, {});
});

app.get('/api/auth/sync', async (c) => {
  return await handleSync(c.req.raw, c.env, {});
});

app.get('/api/user/plans', async (c) => {
  const url = new URL(c.req.url);
  return await handleGallery(c.req.raw, c.env, url, {});
});

app.get('/api/admin/stats', async (c) => {
  return await handleStats(c.req.raw, c.env, {});
});

app.get('/api/debug/health', async (c) => {
  return await handleHealth(c.req.raw, c.env, {});
});

app.post('/api/estimate-macros', async (c) => {
  const body = await c.req.json();
  const description = body.description;
  const locale = body.locale || 'en';
  if (!description) return c.json({ error: 'Missing description' }, 400);

  const normalized = normalizeMeal(description);
  const hash = await hashMeal(normalized);
  const cacheKey = `meal:${hash}`;
  
  // Check Cache
  const cached: any = await c.env.MEAL_CACHE.get(cacheKey, 'json');
  if (cached && cached.explanation) return c.json(cached);
  
  // If cached exists but has no explanation, we proceed to regenerate (or we could just use the cached macros and generate the explanation)
  const existingMacros = cached; 

  // AI Inference
  const prompt = `Estimate macros for: "${normalized}". Return JSON: {calories: number, protein: number, carbs: number, fats: number}. No extra text.`;
  
  try {
    let result = existingMacros;

    if (!result) {
      const aiResponse: any = await c.env.AI.run("@cf/openai/gpt-oss-120b", { 
        messages: [
          { role: 'system', content: `You are a precise sports nutritionist. Estimate macros for the requested meal. You must respond with ONLY a valid JSON object matching the schema: {"calories": number, "protein": number, "carbs": number, "fats": number}. Do not include markdown code blocks, explanation, or extra conversational text. The user may log food inputs in English or Spanish. If locale is '${locale}' and it is 'es', return the food item names and breakdown descriptions in Spanish, but strictly preserve the numerical macro estimation values and the English JSON structure.` },
          { role: 'user', content: `Estimate macros for: "${normalized}"` }
        ],
        temperature: 0.2,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      let raw = aiResponse?.choices?.[0]?.message?.content || "";
      if (typeof raw === 'string') {
        raw = raw.trim();
        if (raw.startsWith("```json")) raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
        else if (raw.startsWith("```")) raw = raw.replace(/```/g, "").trim();
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) raw = jsonMatch[0];
      }
      try {
        result = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (parseErr: any) {
        throw new Error(`AI returned invalid JSON: ${parseErr.message}. Raw output: "${raw}"`);
      }
    }
    
    // ── AI INSIGHT ───────────────────────────────────────────────────────────
    let explanation = locale === 'es'
      ? "Esta comida proporciona una base sólida para tus objetivos metabólicos."
      : "This meal provides a solid foundation for your metabolic targets.";
    try {
      const insightPrompt = `You estimated these macros for "${normalized}": ${JSON.stringify(result)}. 
      Briefly explain (1-2 sentences) how this meal fits into a high-performance metabolic plan. 
      Keep it supportive and professional. No JSON, just plain text.
      CRITICAL: Write your short meal feedback paragraph entirely in Spanish if locale is '${locale}' and it is 'es'. Keep structural schema flags in English.`;
      
      const insightResponse: any = await c.env.AI.run("@cf/openai/gpt-oss-120b", { 
        messages: [
          { role: 'system', content: 'You are a supportive, high-performance metabolic coach. Write a 1-2 sentence supportive, professional observation in plain text.' },
          { role: 'user', content: insightPrompt }
        ],
        temperature: 0.4,
        max_tokens: 1000
      });
      if (insightResponse?.choices?.[0]?.message?.content) {
        explanation = insightResponse.choices[0].message.content.trim();
      }
    } catch (e) {
      console.error('Meal AI Insight failed:', e);
    }

    const finalResult = { 
      success: true,
      ...result, 
      targets: {
        protein: result.protein,
        carbs: result.carbs,
        fats: result.fats
      },
      explanation 
    };
    
    // Cache result
    await c.env.MEAL_CACHE.put(cacheKey, JSON.stringify(finalResult), { expirationTtl: 86400 * 7 });
    
    return c.json(finalResult);
  } catch (err: any) {
    return c.json({ error: 'AI Estimation failed', details: err.message }, 500);
  }
});

app.notFound((c) => {
  return c.json({ error: "Macro Engine Route Not Found", path: c.req.path }, 404);
});

export default Sentry.withSentry(
  (env: any) => getSentryConfig(env),
  app
);
