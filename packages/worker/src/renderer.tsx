import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { withRetry } from './utils/retry';
import { Page1, Page2, Page3, NotesPage, MealDetailsPage, CalibrationRecapPage, Identity, MetabolicProfile, Personalization, IntelligenceNote, Meal, DeliveredMacros } from './pdf-template';

// ============================================================
// §1. Data Contract (Worker → Renderer → Template)
// ============================================================
export type RenderPayload = {
  fullName?: string;
  personalizationScore?: number;
  locale?: string;
  identity: Identity;
  metabolicProfile: MetabolicProfile;
  personalization: Personalization;
  intelligenceNotes: IntelligenceNote[];
  meals: Meal[];
  delivered?: DeliveredMacros;
  explanation?: string;
};

// ============================================================
// Payload Normalization
// ============================================================
function normalizePayload(raw: RenderPayload): RenderPayload {
  const payload = { ...raw };

  if (payload.fullName && (!payload.identity || !payload.identity.name)) {
    payload.identity = payload.identity || { name: '', bodyType: 'Mesomorph', goal: 'Metabolic Optimization' };
    payload.identity.name = payload.fullName;
  }

  payload.identity = payload.identity || { name: 'MetaMorfit', bodyType: 'Mesomorph', goal: 'Metabolic Optimization' };
  payload.identity.name = payload.identity.name || 'MetaMorfit';
  
  let goal = payload.identity.goal || 'Metabolic Optimization';
  if (goal.toUpperCase() === 'DEFAULT') {
    goal = 'Metabolic Optimization';
  } else if (goal.toLowerCase() === 'cut') {
    goal = 'Fat Loss';
  } else if (goal.toLowerCase() === 'bulk') {
    goal = 'Muscle Gain';
  } else if (goal.toLowerCase() === 'maintain') {
    goal = 'Maintenance';
  } else if (goal.toLowerCase() === 'recomp') {
    goal = 'Recomposition';
  }
  payload.identity.goal = goal;

  let bodyType = payload.identity.bodyType || 'Mesomorph';
  if (bodyType.toUpperCase() === 'DEFAULT') {
    bodyType = 'Mesomorph';
  }
  payload.identity.bodyType = bodyType;

  if (payload.personalizationScore !== undefined && !payload.personalization) {
    payload.personalization = { personalizationScore: payload.personalizationScore };
  } else if (!payload.personalization) {
    payload.personalization = { personalizationScore: 100 };
  }

  payload.intelligenceNotes = payload.intelligenceNotes || [];
  payload.meals = payload.meals || [];

  payload.intelligenceNotes = payload.intelligenceNotes.map(n => ({
    ...n,
    category: n.category || 'optimization',
    whyThisMatters: n.whyThisMatters || '',
    howToApplyToday: n.howToApplyToday || ''
  }));

  payload.meals = normalizeMeals(payload.meals);

  if (payload.metabolicProfile) {
    payload.metabolicProfile = {
      ...payload.metabolicProfile,
      targetKcal: computeTargetKcal(payload.metabolicProfile),
    };
  }

  return payload;
}

function normalizeMeals(meals: Meal[]): Meal[] {
  return meals.map(meal => {
    const m = { ...meal, name: String(meal.name || 'Meal') };
    if (!m.ingredients || m.ingredients.length === 0) {
      return {
        ...m,
        ingredients: [{
          name: 'No ingredients listed',
          amount: '',
          unit: '',
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
        }],
      };
    }
    return m;
  });
}

function computeTargetKcal(mp: MetabolicProfile): number {
  const computed = mp.proteinGrams * 4 + mp.carbsGrams * 4 + mp.fatsGrams * 9;
  return mp.targetKcal || computed || mp.tdee;
}

// ============================================================
// Gotenberg HTML Renderer
// ============================================================
export async function renderMetamorfitPdf(rawPayload: RenderPayload, env?: any): Promise<ReadableStream> {
  console.log('[Worker/Renderer] Starting Gotenberg HTML rendering');

  const payload = normalizePayload(rawPayload);
  
  const isMealEmpty = (meal: Meal) => {
    if (!meal.ingredients || meal.ingredients.length === 0) return true;
    return meal.ingredients.every(ing =>
      ing.name.toLowerCase().includes('no ingredients') ||
      ing.name.toLowerCase().includes('tbd') ||
      (ing.calories === 0 && ing.protein === 0 && ing.carbs === 0 && ing.fats === 0)
    );
  };
  const validMeals = payload.meals.filter(m => !isMealEmpty(m));

  console.log(`[Worker/Renderer] Payload ready: ${validMeals.length} valid meals, ${payload.intelligenceNotes.length} notes`);
  
  const MEALS_PER_PAGE = 2;
  const numMealPages = Math.ceil(validMeals.length / MEALS_PER_PAGE);
  const hasNotes = payload.intelligenceNotes.length > 0;
  const totalPages = 1 + 1 + (hasNotes ? 1 : 0) + numMealPages + (payload.delivered ? 1 : 0);

  let currentPageNum = 1;
  const pages: React.ReactNode[] = [];

  // Page 1
  pages.push(<Page1 key="p1" identity={payload.identity} personalization={payload.personalization} totalPages={totalPages} locale={payload.locale} />);
  currentPageNum++;

  // Page 2
  pages.push(<Page2 key="p2" identity={payload.identity} metabolicProfile={payload.metabolicProfile} notes={[]} totalPages={totalPages} locale={payload.locale} />);
  currentPageNum++;

  // Page 3: Notes
  if (hasNotes) {
    pages.push(<NotesPage key="pn" intelligenceNotes={payload.intelligenceNotes} explanation={payload.explanation} pageNumber={currentPageNum++} totalPages={totalPages} locale={payload.locale} />);
  }

  // Page 4+: Meals
  let remainingMealsToPaginate = [...validMeals];
  let isFirstMealPage = true;
  
  while (remainingMealsToPaginate.length > 0) {
    const chunk = remainingMealsToPaginate.slice(0, MEALS_PER_PAGE);
    remainingMealsToPaginate = remainingMealsToPaginate.slice(MEALS_PER_PAGE);
    
    pages.push(<MealDetailsPage key={`pm-${currentPageNum}`} meals={chunk} metabolicProfile={isFirstMealPage ? payload.metabolicProfile : undefined} pageNumber={currentPageNum++} totalPages={totalPages} showTargets={isFirstMealPage} locale={payload.locale} />);
    isFirstMealPage = false;
  }

  // Final Page
  if (payload.delivered) {
    pages.push(<CalibrationRecapPage key="pc" metabolicProfile={payload.metabolicProfile} delivered={payload.delivered} pageNumber={currentPageNum++} totalPages={totalPages} locale={payload.locale} />);
  }

  // Render React tree to static HTML string
  const htmlContent = renderToStaticMarkup(
    <div>
      {pages.map((page, index) => (
        <div key={index} style={{ pageBreakAfter: index === pages.length - 1 ? 'auto' : 'always' }}>
          {page}
        </div>
      ))}
    </div>
  );

  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap&text=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@%23$%25^&*()_+-%3D[]{}|;:,.<>?/ \u0027\u0022" rel="stylesheet">
        <style>
          *{box-sizing:border-box;}
          html,body{margin:0;padding:0;width:595pt;height:auto;background-color:#0a0a08;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
          @page{size:A4;margin:0mm;}
          svg{overflow:visible;}
        </style>
      </head>
      <body>${htmlContent}</body>
    </html>
  `;

  const gotenbergUrl = (env && env.GOTENBERG_URL) ? env.GOTENBERG_URL : "https://gotenberg-alpha-15308390055.us-central1.run.app";

  const formData = new FormData();
  formData.append('index.html', new Blob([fullHtml], { type: 'text/html' }), 'index.html');
  formData.append('marginTop', '0');
  formData.append('marginBottom', '0');
  formData.append('marginLeft', '0');
  formData.append('marginRight', '0');

  console.log('[Worker/Renderer] Calling Gotenberg at', gotenbergUrl);
  console.log('[Worker/Renderer] HTML length:', fullHtml.length);
  
  const response = await withRetry(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(`${gotenbergUrl}/forms/chromium/convert/html`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa('worker:beta_render_token_491')}`
        },
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const text = await res.text();
        console.error('[Worker/Renderer] Gotenberg error body:', text);
        throw new Error(`Gotenberg Generation Failed: HTTP ${res.status} - ${text}`);
      }
      return res;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }, 3, 4000); // 3 retries, starting at 4000ms backoff to absorb Cloud Run cold starts

  console.log('[Worker/Renderer] Gotenberg success');
  return response.body as ReadableStream;
}
