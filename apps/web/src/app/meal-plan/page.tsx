"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { DailyTargetsPanel } from "@/components/DailyTargetsPanel";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { useTranslation } from "react-i18next";

interface Ingredient {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface MealSlot {
  id: string;
  name: string;
  percentage: number;
  ingredients: Ingredient[];
}

export default function MealPlanPage() {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language === 'es';

  const [meals, setMeals] = useState<MealSlot[]>([
    { 
      id: "breakfast", 
      name: "Breakfast", 
      percentage: 25,
      ingredients: [
        { id: "1", name: isEs ? "3 huevos enteros grandes, revueltos" : "3 large cage-free eggs, scrambled", calories: 210, protein: 18, carbs: 1.5, fats: 15 },
        { id: "2", name: isEs ? "40g de avena con media taza de arándanos" : "40g steel cut oats with half a cup of blueberries", calories: 150, protein: 5, carbs: 27, fats: 2.5 }
      ] 
    },
    { id: "lunch", name: "Lunch", percentage: 30, ingredients: [] },
    { id: "dinner", name: "Dinner", percentage: 30, ingredients: [] },
    { id: "snack1", name: "Protein Smoothie", percentage: 10, ingredients: [] },
    { id: "snack2", name: "SNACK", percentage: 5, ingredients: [] },
  ]);

  // Sync default ingredients names when language changes so that they show up correctly in the UI and PDF
  useEffect(() => {
    setMeals(prev => prev.map(meal => {
      if (meal.id === "breakfast") {
        return {
          ...meal,
          ingredients: meal.ingredients.map(ing => {
            if (ing.id === "1") {
              return { ...ing, name: isEs ? "3 huevos enteros grandes, revueltos" : "3 large cage-free eggs, scrambled" };
            }
            if (ing.id === "2") {
              return { ...ing, name: isEs ? "40g de avena con media taza de arándanos" : "40g steel cut oats with half a cup of blueberries" };
            }
            return ing;
          })
        };
      }
      return meal;
    }));
  }, [isEs]);

  const [showSnack2, setShowSnack2] = useState(false);

  const [activeMealId, setActiveMealId] = useState<string | null>(null);
  const [mealDescription, setMealDescription] = useState("");
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!hasItems || isGenerating) return;
    setIsGenerating(true);

    try {
      const rawData = ledger?.data || {};
      const weightVal = rawData.weightValue ? Number(rawData.weightValue) : null;
      const weight = weightVal 
        ? (rawData.weightUnit === 'lbs' ? Math.round(weightVal * 0.453592) : Math.round(weightVal))
        : undefined;
      const heightVal = rawData.heightValue ? Number(rawData.heightValue) : null;
      const height = heightVal
        ? (rawData.heightUnit === 'ft' ? Math.round(heightVal * 2.54) : Math.round(heightVal))
        : undefined;

      const workerPayload = {
        userId: typeof window !== 'undefined' ? localStorage.getItem('mm_uid') || undefined : undefined,
        email: sessionPayload?.email || rawData.email,
        fullName: sessionPayload?.name || rawData.name || "Athlete",
        locale: isEs ? 'es' : 'en',
        tags: ["meal-planner"],
        identity: {
          name: sessionPayload?.name || rawData.name || "Athlete",
          bodyType: sessionPayload?.somatotype || rawData.somatotype || "Default",
          goal: sessionPayload?.goal || rawData.goal || "Default",
          age: rawData.age ? Number(rawData.age) : undefined,
          weightKg: weight,
          heightCm: height,
          bodyFatPct: rawData.bodyFatPercent ? Number(rawData.bodyFatPercent) : undefined
        },
        metabolicProfile: {
          bmr: Math.round(targets.bmr),
          tdee: Math.round(targets.tdee),
          targetKcal: Math.round(targets.calories),
          proteinGrams: Math.round(targets.protein),
          carbsGrams: Math.round(targets.carbs),
          fatsGrams: Math.round(targets.fats),
          activityLevel: rawData.activityLevel || "Moderate",
          surplus: Math.round(targets.calories - targets.tdee),
          water: targets.water,
          steps: targets.steps,
          fiber: targets.fiber
        },
        personalization: {
          personalizationScore: sessionPayload?.personalizationScore || 95
        },
        intelligenceNotes: (sessionPayload?.insights || []).map((text: string) => ({
          category: 'AI Insight',
          layer: 1,
          personalizationScore: 100,
          whyThisMatters: text,
          howToApplyToday: text
        })),
        meals: meals.map(m => ({
          name: m.name,
          calories: Math.round(m.ingredients.reduce((acc, i) => acc + i.calories, 0)),
          protein: Math.round(m.ingredients.reduce((acc, i) => acc + i.protein, 0)),
          carbs: Math.round(m.ingredients.reduce((acc, i) => acc + i.carbs, 0)),
          fats: Math.round(m.ingredients.reduce((acc, i) => acc + i.fats, 0)),
          ingredients: m.ingredients.map(i => ({
            name: i.name,
            calories: Math.round(i.calories),
            protein: Math.round(i.protein),
            carbs: Math.round(i.carbs),
            fats: Math.round(i.fats)
          }))
        })),
        delivered: {
          kcal: Math.round(grandTotals.calories),
          protein: Math.round(grandTotals.protein),
          carb: Math.round(grandTotals.carbs),
          fat: Math.round(grandTotals.fats)
        },
        explanation: sessionPayload?.explanation || sessionPayload?.insights?.join('\n\n')
      };

      const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || "https://metamorfit-worker-alpha.metamorfitnet.workers.dev";
      const res = await fetch(`${workerUrl}/api/generate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_MM_UI_SECRET || 'meta_alpha_sec_a7c2e9f1b3d8k9m_42891_abc'}`
        },
        body: JSON.stringify(workerPayload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (isEs ? "Fallo al generar el PDF." : "Failed to generate PDF."));
      }

      router.push("/thank-you");
    } catch (err) {
      console.error("Generate error:", err);
      alert(isEs ? "Ocurrió un error al generar tu plan. Por favor, inténtalo de nuevo." : "An error occurred while generating your plan. Please try again.");
      setIsGenerating(false);
    }
  };

  // ── Session hook — replaces manual sessionStorage reads ──────────────────
  const { sessionPayload, loading: sessionLoading, ledger } = useOnboardingSession();
  const router = useRouter();

  // ── Guard: require a completed calibration ────────────────────────────────
  if (!sessionLoading && !sessionPayload) {
    return (
      <div className="min-h-screen bg-mm-black flex flex-col items-center justify-center gap-6 px-6 text-center">
        <Header variant="app" />
        <div className="mt-24 flex flex-col items-center gap-4">
          <span className="text-5xl">⚡</span>
          <h2 className="text-3xl font-heading tracking-widest uppercase text-mm-bone">
            {isEs ? "Motor No Calibrado" : "Engine Not Calibrated"}
          </h2>
          <p className="text-mm-bone/50 font-body text-lg max-w-md leading-relaxed">
            {isEs ? "Por favor, calibra tu motor metabólico primero para generar un plan de comidas personalizado." : "Please calibrate your metabolic engine first to generate a personalized meal plan."}
          </p>
          <button
            onClick={() => router.push('/calculator')}
            className="mt-4 px-10 py-4 bg-mm-gold text-mm-black font-heading tracking-[0.3em] uppercase text-sm rounded-xl hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(201,168,76,0.4)] transition-all duration-300"
          >
            {isEs ? "Calibrar Motor Metabólico →" : "Calibrate Metabolic Engine →"}
          </button>
        </div>
      </div>
    );
  }

  // ── Map sessionPayload → targets consumed by DailyTargetsPanel ───────────
  const targets = {
    calories: sessionPayload?.calories ?? 0,
    protein:  sessionPayload?.protein  ?? 0,
    carbs:    sessionPayload?.carbs    ?? 0,
    fats:     sessionPayload?.fat      ?? 0,
    // Wellness fields — now in MacroPayload, use fallbacks if missing
    fiber:    sessionPayload?.fiber    ?? 35,
    water:    sessionPayload?.water    ?? 3.5,
    steps:    sessionPayload?.steps    ?? 10000,
    tdee:     sessionPayload?.tdee ?? 0,
    bmr:      sessionPayload?.bmr  ?? 0,
  };

  const handleEstimateMacros = async () => {
    if (!mealDescription.trim() || !activeMealId) return;
    
    setIsEstimating(true);
    setEstimateError(null);
    try {
      const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_A_URL || "https://metamorfit-worker-beta.metamorfitnet.workers.dev";


      const res = await fetch(`${WORKER_URL}/api/estimate-macros`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description: mealDescription,
          locale: ledger?.data?.locale || (typeof window !== 'undefined' ? (localStorage.getItem('i18nextLng') || 'en').substring(0, 2) : 'en')
        })
      });
      
      const data = await res.json() as any;
      
      if (!res.ok) throw new Error(data.error || 'Failed to estimate');

      const newIngredient: Ingredient = {
        id: Date.now().toString(),
        name: mealDescription,
        calories: data.calories || 0,
        protein: data.protein || data.protein_g || 0,
        carbs: data.carbs || data.carbs_g || 0,
        fats: data.fats || data.fats_g || data.fat || data.fat_g || 0
      };

      setMeals(prev => prev.map(m => {
        if (m.id === activeMealId) {
          return { ...m, ingredients: [...m.ingredients, newIngredient] };
        }
        return m;
      }));

      closeModal();
    } catch (err: any) {
      console.error(err);
      const errorMessage = isEs ? "Fallo al estimar los macros. Por favor, inténtalo de nuevo." : "Failed to estimate macros. Please try again.";
      setEstimateError(err.message || errorMessage);
    } finally {
      setIsEstimating(false);
    }
  };

  const closeModal = () => {
    setActiveMealId(null);
    setMealDescription("");
    setEstimateError(null);
  };


  // Grand totals across all meals
  const grandTotals = meals.reduce((acc, meal) => {
    const mealSum = meal.ingredients.reduce((a, i) => ({
      calories: a.calories + i.calories,
      protein:  a.protein  + i.protein,
      carbs:    a.carbs    + i.carbs,
      fats:     a.fats     + i.fats,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
    return {
      calories: acc.calories + mealSum.calories,
      protein:  acc.protein  + mealSum.protein,
      carbs:    acc.carbs    + mealSum.carbs,
      fats:     acc.fats     + mealSum.fats,
    };
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const remaining = {
    calories: Math.max(0, targets.calories - grandTotals.calories),
    protein:  Math.max(0, targets.protein  - grandTotals.protein),
    carbs:    Math.max(0, targets.carbs    - grandTotals.carbs),
    fats:     Math.max(0, targets.fats     - grandTotals.fats),
  };

  // Open modal with optional pre-fill (used for Snack 1)
  const openModal = (mealId: string, prefill = "") => {
    setActiveMealId(mealId);
    setMealDescription(prefill);
  };

  const hasItems = meals.some(m => m.ingredients.length > 0);

  // ── Meal percentage allocation check ──────────────────────────────────────
  const totalAllocated = meals
    .filter(m => m.id !== 'snack2' || showSnack2)
    .reduce((sum, m) => sum + m.percentage, 0);
  const allocationWarning =
    totalAllocated !== 100
      ? (isEs ? `Nota: La asignación actual es el ${totalAllocated}% de tu objetivo diario.` : `Note: Current allocation is ${totalAllocated}% of your daily target.`)
      : null;

  const getLocalizedMealName = (id: string, defaultName: string) => {
    if (!isEs) return defaultName;
    switch (id) {
      case 'breakfast': return 'Desayuno';
      case 'lunch': return 'Almuerzo';
      case 'dinner': return 'Cena';
      case 'snack1': return 'Batido de Proteína';
      case 'snack2': return 'Snack';
      default: return defaultName;
    }
  };


  return (
    <div className="min-h-screen bg-mm-black selection:bg-mm-gold/30 flex flex-col">
      {/* Navigation */}
      <Header variant="app" />

      <main className="flex-1 w-full pt-36 pb-28 px-6 md:px-12 max-w-[1600px] mx-auto flex flex-col gap-14">

        {/* ── PAGE HERO ── */}
        <header className="animate-slideUp mb-4">
          <h1 className="text-6xl md:text-7xl font-heading tracking-tight mb-5 uppercase">{isEs ? "Construye tu" : "Build Your"} <span className="text-mm-gold">{isEs ? "Plan de Comidas Diario." : "Daily Meal Plan."}</span></h1>
          <p className="text-[17px] text-mm-bone/60 max-w-2xl font-body leading-loose">{isEs ? "Diseña un día completo de comidas dirigidas con precisión que se ajusten a tus objetivos macro." : "Design a full day of precision-targeted meals that matches your macro objectives."}</p>
        </header>

        {/* ── DAILY TARGETS DASHBOARD ── */}
        <DailyTargetsPanel 
          calorieTarget={targets.calories}
          caloriesConsumed={grandTotals.calories}
          macros={{
            protein: { consumed: grandTotals.protein, target: targets.protein },
            carbs: { consumed: grandTotals.carbs, target: targets.carbs },
            fats: { consumed: grandTotals.fats, target: targets.fats }
          }}
        />

        {/* ── MEAL SLOTS ── */}
        <div className="space-y-10 animate-slideUp">

          <div className="space-y-8">
            {meals
              .filter(meal => meal.id !== "snack2" || showSnack2)
              .map((meal) => {
              const index = meals.indexOf(meal);
              const isSnack1 = meal.id === "snack1";
              const snack1Prefill = isEs ? "Batido de proteína de suero de 25g con 250ml de leche de almendras y un plátano" : "25g whey protein shake with 250ml almond milk and a banana";
              return (
                <MealSlotCard 
                  key={meal.id} 
                  meal={{...meal, name: getLocalizedMealName(meal.id, meal.name)}} 
                  targets={targets}
                  isEs={isEs}
                  onPercentageChange={(newPercentage) => {
                    const updatedMeals = [...meals];
                    updatedMeals[index] = { ...updatedMeals[index], percentage: newPercentage };
                    setMeals(updatedMeals);
                  }}
                  onAddFoods={() => openModal(meal.id, isSnack1 ? snack1Prefill : "")}
                  onRemoveIngredient={(ingId: string) => {
                    const updatedMeals = [...meals];
                    updatedMeals[index] = { 
                      ...updatedMeals[index], 
                      ingredients: updatedMeals[index].ingredients.filter(i => i.id !== ingId) 
                    };
                    setMeals(updatedMeals);
                  }}
                />
              );
            })}
          </div>

          {/* Add Meal button — shows Snack 2 once */}
          {!showSnack2 && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setShowSnack2(true)}
                className="w-full md:w-auto px-10 py-4 font-heading tracking-[0.3em] uppercase text-sm border border-white/10 rounded-xl text-mm-bone/50 hover:border-mm-gold/40 hover:text-mm-gold transition-all duration-300"
              >
                {isEs ? "+ Añadir Comida" : "+ Add Meal"}
              </button>
            </div>
          )}

          {/* Footer CTA */}
          <div className="pt-16 mt-6 border-t border-white/[0.08] flex flex-col items-center gap-4">

            {/* Allocation warning — non-blocking, appears above button */}
            {allocationWarning && hasItems && (
              <p className="text-[11px] font-body tracking-widest uppercase text-amber-400/70 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-400/60 shrink-0" aria-hidden="true" />
                {allocationWarning}
              </p>
            )}

            <button 
              disabled={!hasItems || isGenerating}
              onClick={handleGenerate}
              aria-label="Generate my meal plan"
              aria-busy={isGenerating ? 'true' : 'false'}
              className={`w-full md:w-auto px-8 md:px-28 py-5 md:py-9 font-heading tracking-[0.2em] md:tracking-[0.4em] uppercase text-xl md:text-3xl rounded-2xl transition-all duration-500 shadow-2xl relative overflow-hidden group flex items-center justify-center ${
                hasItems && !isGenerating
                ? 'bg-mm-gold text-mm-black hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(201,168,76,0.4)] active:scale-95' 
                : 'bg-mm-dark text-mm-bone/20 border border-white/5 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center gap-3">
                  <svg className="animate-spin h-6 w-6 text-mm-bone/40" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isEs ? "Finalizando..." : "Finalizing..."}
                </span>
              ) : (
                <>
                  {isEs ? "Generar Mi Plan →" : "Generate My Plan →"}
                  {!hasItems && (
                    <div className="absolute inset-0 bg-mm-gold/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm font-body tracking-widest lowercase italic text-mm-gold">{isEs ? "Añade alimentos para proceder" : "Add food items to proceed"}</span>
                    </div>
                  )}
                </>
              )}
            </button>

            {!hasItems && <p className="text-mm-bone/30 font-body text-sm tracking-widest uppercase">{isEs ? "Añade comidas arriba para desbloquear" : "Add meals above to unlock"}</p>}
          </div>
        </div>
      </main>

      {/* AI Meal Input Modal */}
      {activeMealId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-mm-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-mm-dark border border-white/10 p-6 sm:p-8 md:p-10 rounded-[2rem] w-full max-w-xl relative shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-slideUp">
            <button onClick={closeModal} aria-label="Close modal" className="absolute top-5 right-5 text-mm-bone/40 hover:text-mm-gold transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-2xl md:text-3xl font-heading tracking-widest uppercase mb-3 text-mm-bone">
              {isEs ? "Describe tu" : "Describe your"} <span className="text-mm-gold">{isEs ? "Comida" : "Meal"}</span>
            </h2>
            <p className="text-mm-bone/60 font-body text-sm mb-6 leading-relaxed max-w-sm">
              {isEs ? "La precisión requiere verdad. Dile a nuestra IA exactamente qué planeas consumir y analizaremos el perfil de macronutrientes al instante." : "Precision requires truth. Tell our AI exactly what you plan to consume, and we will analyze the macronutrient profile instantly."}
            </p>
            
            {estimateError && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-body text-sm leading-relaxed flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {estimateError}
              </div>
            )}
            
            <textarea 
              value={mealDescription}
              onChange={(e) => setMealDescription(e.target.value)}
              placeholder={isEs ? "Ejemplo: 3 huevos enteros revueltos, un tazón de avena con un puñado de arándanos y café negro" : "Example: 3 whole eggs scrambled, a bowl of oatmeal with a handful of blueberries, and black coffee"}
              className="w-full h-32 bg-mm-black/50 border border-white/[0.08] rounded-xl p-4 mb-6 text-sm text-mm-bone font-body leading-loose outline-none focus:border-mm-gold/40 focus:bg-mm-black/80 focus:shadow-[0_0_15px_rgba(201,168,76,0.1)] transition-all resize-none shadow-inner"
              autoFocus
            />

            <div className="flex justify-end gap-3 flex-wrap">
              <button 
                onClick={closeModal}
                className="px-6 py-3 font-heading tracking-widest uppercase text-xs text-mm-bone/50 hover:text-mm-bone transition-colors"
              >
                {isEs ? "Cancelar" : "Cancel"}
              </button>
              <button 
                disabled={!mealDescription.trim() || isEstimating}
                onClick={handleEstimateMacros}
                className={`px-12 py-4 font-heading tracking-[0.3em] uppercase text-sm rounded-xl transition-all duration-300 flex items-center gap-3 relative overflow-hidden ${
                  !mealDescription.trim() || isEstimating
                  ? "bg-white/5 text-mm-bone/20 cursor-not-allowed"
                  : "bg-mm-gold text-mm-black hover:bg-mm-bone active:scale-95 shadow-[0_0_15px_rgba(201,168,76,0.3)] hover:shadow-[0_0_25px_rgba(201,168,76,0.5)]"
                }`}
              >
                {isEstimating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-mm-bone/40" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEs ? "Analizando..." : "Analyzing..."}
                  </>
                ) : (
                  isEs ? "Estimar Macros →" : "Estimate Macros →"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


function MealSlotCard({ 
  meal, 
  targets, 
  onPercentageChange,
  onAddFoods,
  onRemoveIngredient,
  isEs
}: { 
  meal: MealSlot; 
  targets: any; 
  onPercentageChange: (val: number) => void;
  onAddFoods: () => void;
  onRemoveIngredient: (id: string) => void;
  isEs: boolean;
}) {
  const totals = meal.ingredients.reduce((acc, curr) => ({
    calories: acc.calories + curr.calories,
    protein: acc.protein + curr.protein,
    carbs: acc.carbs + curr.carbs,
    fats: acc.fats + curr.fats,
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  // ── Slot-specific targets based on meal percentage allocation ──────────────
  const slotTarget = {
    calories: Math.round((targets.calories * meal.percentage) / 100),
    protein:  Math.round((targets.protein  * meal.percentage) / 100),
    carbs:    Math.round((targets.carbs    * meal.percentage) / 100),
    fats:     Math.round((targets.fats     * meal.percentage) / 100),
  };

  // ── Over-budget helpers ────────────────────────────────────────────────────
  const overCal  = totals.calories > slotTarget.calories  && slotTarget.calories  > 0;
  const overProt = totals.protein  > slotTarget.protein   && slotTarget.protein   > 0;
  const overCarb = totals.carbs    > slotTarget.carbs     && slotTarget.carbs     > 0;
  const overFat  = totals.fats     > slotTarget.fats      && slotTarget.fats      > 0;

  const [isFlashing, setIsFlashing] = useState(false);

  const handlePercentageBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 0) val = 0;
    if (val > 100) val = 100;
    
    if (val !== meal.percentage) {
      onPercentageChange(val);
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 800);
    }
  };

  const handlePercentageKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className={`bg-mm-dark/40 border ${isFlashing ? 'border-mm-gold/50 shadow-[0_0_20px_rgba(201,168,76,0.15)]' : 'border-white/[0.06] shadow-xl hover:border-white/[0.1]'} rounded-3xl p-6 md:p-8 transition-all duration-300 group overflow-hidden relative`}>
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-mm-gold/10 to-transparent group-hover:via-mm-gold/30 transition-all duration-500" />
      
      {/* Header row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center gap-5 w-full md:w-auto">
          <div className="w-14 h-14 rounded-xl bg-mm-black border border-white/[0.05] flex items-center justify-center text-mm-gold/20 font-heading text-3xl group-hover:text-mm-gold transition-all duration-500 relative overflow-hidden shadow-inner shrink-0">
            {meal.name[0]}
            <div className="absolute inset-0 bg-mm-gold/5 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <h3 className="text-2xl font-heading tracking-widest uppercase text-mm-bone/90 group-hover:text-mm-gold transition-colors">{meal.name}</h3>
              <div className="flex items-center gap-1 bg-mm-black/40 border border-white/[0.08] rounded-lg px-2.5 py-1 shadow-inner focus-within:border-mm-gold/50 focus-within:shadow-[0_0_10px_rgba(201,168,76,0.15)] transition-all">
                <label htmlFor={`percentage-${meal.id}`} className="sr-only">Meal Percentage</label>
                <input 
                  id={`percentage-${meal.id}`}
                  type="number" 
                  defaultValue={meal.percentage}
                  onBlur={handlePercentageBlur}
                  onKeyDown={handlePercentageKeyDown}
                  className="w-12 h-10 bg-transparent text-mm-gold font-heading text-xl text-right outline-none hide-arrows placeholder:text-mm-gold/30"
                />
                <span className="text-mm-gold/70 font-heading text-xl">%</span>
              </div>
            </div>
            

          </div>
        </div>

        {/* Totals + Add button */}
        <div className="flex flex-wrap items-center gap-10 w-full md:w-auto mt-4 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-white/[0.08]">
          <div className="flex flex-col items-end gap-2">
            <span className="text-[11px] uppercase tracking-[0.15em] text-mm-bone/40 font-heading">{isEs ? "Actual / Objetivo" : "Actual / Target"}</span>
            <div className="flex gap-6 items-baseline">

              {/* Calories */}
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-heading transition-colors ${overCal ? 'text-orange-400' : 'text-mm-gold'}`}>
                    {Math.round(totals.calories)}
                  </span>
                  <span className="text-[13px] text-mm-bone/30 font-body">/ {slotTarget.calories}</span>
                  <span className="text-[13px] text-mm-bone/50 font-body">kcal</span>
                </div>
                {overCal && (
                  <span className="text-[9px] uppercase tracking-widest text-orange-400/70 font-heading">over</span>
                )}
              </div>

              {/* Protein */}
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-heading transition-colors ${overProt ? 'text-orange-400' : 'text-mm-bone/95'}`}>
                    {Math.round(totals.protein)}
                  </span>
                  <span className="text-[13px] text-mm-bone/30 font-body">/ {slotTarget.protein}g</span>
                  <span className="text-[13px] text-mm-bone/50 font-body">P</span>
                </div>
                {overProt && (
                  <span className="text-[9px] uppercase tracking-widest text-orange-400/70 font-heading">over</span>
                )}
              </div>

              {/* Carbs */}
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-heading transition-colors ${overCarb ? 'text-orange-400' : 'text-mm-bone/95'}`}>
                    {Math.round(totals.carbs)}
                  </span>
                  <span className="text-[13px] text-mm-bone/30 font-body">/ {slotTarget.carbs}g</span>
                  <span className="text-[13px] text-mm-bone/50 font-body">C</span>
                </div>
                {overCarb && (
                  <span className="text-[9px] uppercase tracking-widest text-orange-400/70 font-heading">over</span>
                )}
              </div>

              {/* Fats */}
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-heading transition-colors ${overFat ? 'text-orange-400' : 'text-mm-bone/95'}`}>
                    {Math.round(totals.fats)}
                  </span>
                  <span className="text-[13px] text-mm-bone/30 font-body">/ {slotTarget.fats}g</span>
                  <span className="text-[13px] text-mm-bone/50 font-body">F</span>
                </div>
                {overFat && (
                  <span className="text-[9px] uppercase tracking-widest text-orange-400/70 font-heading">over</span>
                )}
              </div>

            </div>
          </div>
          
          <button 
            onClick={onAddFoods} 
            className="w-full md:w-auto group/add px-11 py-4 md:py-5 bg-mm-gold border border-mm-gold rounded-2xl text-mm-black font-heading tracking-[0.25em] uppercase text-base relative overflow-hidden whitespace-nowrap flex items-center justify-center shadow-[0_0_20px_rgba(201,168,76,0.15)] transition-all duration-[400ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[3px] hover:shadow-[0_8px_40px_rgba(201,168,76,0.4)] hover:bg-[#e2be4a] active:scale-[0.96] active:translate-y-0 active:shadow-[0_2px_12px_rgba(201,168,76,0.2)]"
          >
            <span className="relative z-10 flex items-center gap-2.5 font-medium">
              <span className="text-lg leading-none">+</span> {isEs ? "Añadir Alimentos" : "Add Foods"}
            </span>
            {/* Shimmer sweep */}
            <span className="absolute inset-0 -translate-x-[110%] group-hover/add:translate-x-[110%] transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          </button>
        </div>
      </div>

      {/* Ingredients List */}
      <div className="space-y-4 pt-2">
        {meal.ingredients.length > 0 ? (
          meal.ingredients.map((ing) => (
            <IngredientRow key={ing.id} ingredient={ing} onRemove={() => onRemoveIngredient(ing.id)} isEs={isEs} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 rounded-[2rem] bg-mm-black/20 border border-dashed border-white/[0.08] text-mm-bone/20 font-body text-xs uppercase tracking-[0.3em]">
             {isEs ? "Esperando Selección" : "Awaiting Selection"}
          </div>
        )}
      </div>
    </div>
  );
}

function IngredientRow({ ingredient, onRemove, isEs }: { ingredient: Ingredient, onRemove: () => void, isEs: boolean }) {
  return (
    <div className="bg-mm-black/50 border border-white/[0.06] rounded-xl px-4 py-3 md:px-5 md:py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-mm-black/80 hover:border-white/[0.1] shadow-sm transition-all duration-300 group/row animate-fadeIn">
      <div className="flex items-start gap-3 w-full md:w-auto">
        <div className="w-1.5 h-1.5 rounded-full bg-mm-gold/50 mt-[7px] group-hover/row:bg-mm-gold group-hover/row:shadow-[0_0_8px_rgba(201,168,76,0.6)] transition-all shrink-0" />
        <div className="flex-1">
          <p className="text-mm-bone/80 font-body text-sm leading-relaxed mb-1 max-w-lg">{ingredient.name}</p>
          <span className="px-2 py-0.5 bg-mm-gold/5 text-mm-gold border border-mm-gold/20 rounded text-[9px] uppercase tracking-[0.1em] font-heading">{isEs ? "Estimado por IA" : "AI-Estimated"}</span>
        </div>
      </div>

      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/[0.06] pt-3 md:pt-0">
        <div className="flex gap-3 text-[10px] font-heading tracking-[0.1em] uppercase text-mm-bone/30">
           <div className="flex flex-col items-center gap-0.5"><span className="text-mm-gold font-body font-bold text-base tracking-tight">{Math.round(ingredient.calories)}</span>kcal</div>
           <div className="flex flex-col items-center gap-0.5"><span className="text-mm-bone/80 font-body font-bold text-base tracking-tight">{Math.round(ingredient.protein)}g</span>P</div>
           <div className="flex flex-col items-center gap-0.5"><span className="text-mm-bone/80 font-body font-bold text-base tracking-tight">{Math.round(ingredient.carbs)}g</span>C</div>
           <div className="flex flex-col items-center gap-0.5"><span className="text-mm-bone/80 font-body font-bold text-base tracking-tight">{Math.round(ingredient.fats)}g</span>F</div>
        </div>
        <button 
          onClick={onRemove}
          aria-label={`Remove ${ingredient.name}`}
          className="p-3 text-mm-bone/20 hover:text-red-400 transition-all duration-200 hover:bg-red-500/[0.08] rounded-xl group/del"
        >
          <svg className="w-5 h-5 group-hover/del:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
