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
  let explanation = locale === 'es' 
    ? "Tu perfil metabólico está listo. Sigue estos objetivos para optimizar tus resultados." 
    : "Your metabolic profile is ready. Follow these targets to optimize your results.";
  try {
    const aiPrompt = `Explain why these macros are good for a ${validation.data.age}yo ${validation.data.sex} weighing ${validation.data.weightKg}kg with a goal of ${validation.data.goal}${validation.data.bodyType ? ` and a ${validation.data.bodyType} body type` : ""}. 
    Macros: ${JSON.stringify(result.macros)}. 
    Keep it to 2-3 supportive sentences. No JSON, just plain text.`;
    
    const systemPrompt = `You are a supportive metabolic coach. Keep your explanations to 2-3 supportive, professional sentences in plain text (no markdown formatting, no JSON).
   [LANGUAGE REQUIREMENT]
   The user's active language preference is: "${locale}".
   If this value is 'es', you MUST write the entire narrative analysis, titles, and explanations in fluent Spanish (Neutral/Castilian). 
   You MUST strictly maintain all English JSON key names exactly as originally designed.`;
    
    const aiResponse: any = await c.env.AI.run("@cf/openai/gpt-oss-120b", { 
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: aiPrompt }
      ],
      temperature: 0.4,
      max_tokens: 150
    });
    if (aiResponse?.choices?.[0]?.message?.content) {
      explanation = aiResponse.choices[0].message.content.trim();
    }
  } catch (e) {
    console.error('AI Insight failed:', e);
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
