"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import MacroPieChart from "./MacroPieChart";
import { NotesPanel } from "./NotesPanel";
import { PersonalizationGrid } from "./PersonalizationGrid";
import { CalculatorResult, CalculatorInput } from "@/types/calculator";

interface ResultsPanelProps {
  result: CalculatorResult;
  input: CalculatorInput;
  onReset?: () => void;
}

function useCountUp(value: number, duration = 800, decimals = 0) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = display;
    const diff = value - startValue;

    if (diff === 0) return;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const current = startValue + diff * progress;

      setDisplay(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  const factor = Math.pow(10, decimals);
  return decimals === 0 ? Math.floor(display) : (Math.floor(display * factor) / factor).toFixed(decimals);
}

export function ResultsPanel({ result, input }: ResultsPanelProps) {
  const { t } = useTranslation();
  // Ensure we have a default targets object to prevent crashes during hydration/rendering
  const { 
    targets = { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, water: 0, steps: 0 }, 
    bmr = 0, 
    personalizationScore = 0, 
    explanation 
  } = result as any || {};



  const animatedCalories = useCountUp(targets.calories || 0);
  const animatedProtein = useCountUp(targets.protein || 0);
  const animatedCarbs = useCountUp(targets.carbs || 0);
  const animatedFats = useCountUp(targets.fats || 0);
  const animatedBmr = useCountUp(bmr || 0);
  const animatedScore = useCountUp(personalizationScore || 0);

  // DIAGNOSTIC: Trace notes propagation
  useEffect(() => {
    if (result) {
      console.log("[ResultsPanel] Data Received:", {
        notes: result.notes,
        insights: (result as any).insights,
        explanation: !!explanation
      });
    }
  }, [result, explanation]);

  return (
    <div className="flex-1 flex flex-col h-full relative z-10 space-y-10 animate-fadeInUp w-full mt-4">
      <div className="flex flex-col gap-6 w-full">
        <h2 className="text-mm-gold flex justify-start items-center gap-4 font-heading text-3xl uppercase tracking-tighter px-2 m-0 border-b border-white/5 pb-4 w-full">
          {t('dashboard.resultsTitle')}
          <span className="text-mm-bone/20 font-body font-light">—</span>
          <span className="text-mm-bone/60 font-heading tracking-[0.2em] text-xl uppercase">{t('dashboard.dailyTarget')}</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12 w-full items-stretch">
          {/* COLUMN 1: TDEE */}
          <div className="flex flex-col gap-6 h-full">
            <div className="bg-mm-black/40 border border-white/10 rounded-3xl p-6 relative overflow-hidden group shadow-2xl flex-1 flex flex-col justify-center min-h-[280px]">
              <div className="absolute inset-0 bg-mm-gold/[0.02] pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-mm-gold/10 blur-[80px] pointer-events-none rounded-full group-hover:bg-mm-gold/15 transition-all duration-1000" />

              <div className="relative z-10 text-center space-y-2">
                <span className="text-sm font-heading tracking-[0.2em] text-mm-bone/60 uppercase">{t('dashboard.tdeeBaseline')}</span>
                <div className="flex justify-center items-baseline gap-2">
                  <h2 className="text-6xl lg:text-7xl xl:text-8xl font-heading tracking-tighter text-mm-bone leading-none drop-shadow-[0_0_20px_rgba(201,168,76,0.15)] group-hover:drop-shadow-[0_0_35px_rgba(201,168,76,0.25)] transition-all duration-700">
                    {animatedCalories}
                  </h2>
                  <span className="text-mm-gold/80 text-xl lg:text-2xl font-heading tracking-[0.1em] italic lowercase">kcal</span>
                </div>
                <div className="pt-2 flex flex-col items-center">
                  <div className="h-px w-24 bg-gradient-to-r from-transparent via-mm-gold/30 to-transparent mb-3" />
                  <p className="text-[14px] text-mm-bone/60 italic font-body tracking-wide px-4">{t('dashboard.tdeeSubtitle')}</p>
                </div>
              </div>
            </div>

            <div className="bg-mm-black/30 border border-white/5 rounded-2xl px-6 py-5 flex justify-between items-center group hover:bg-mm-black/50 transition-all duration-300">
              <span className="text-sm font-heading tracking-[0.15em] text-mm-bone/50 uppercase">{t('dashboard.basalMetabolicRate')}</span>
              <div className="text-2xl font-heading tracking-widest text-mm-bone/80 italic flex items-baseline gap-1">
                {animatedBmr} <span className="text-xs opacity-40 lowercase font-body not-italic">kcal</span>
              </div>
            </div>
          </div>

          {/* COLUMN 2: MACROS */}
          <div className="flex flex-col gap-6 h-full">
            <div className="bg-mm-black/60 border border-white/5 rounded-3xl p-6 xl:p-8 flex flex-col flex-1 shadow-xl">
              <h3 className="text-sm font-heading tracking-[0.2em] text-mm-bone/60 uppercase mb-6">{t('dashboard.macroBreakdown')}</h3>
              <div className="flex flex-col items-center justify-center gap-6 flex-1 w-full">
                <div className="shrink-0">
                  <MacroPieChart
                    protein={targets.protein}
                    carbs={targets.carbs}
                    fat={targets.fats}
                    calories={targets.calories}
                  />
                </div>
                <div className="flex-1 space-y-5 w-full pt-6 border-t border-white/5">
                  <div className="space-y-1">
                    <p className="text-mm-bone text-[15px] lg:text-[16px]">
                      <strong className="text-mm-gold">{t('dashboard.protein')} — {targets.protein}g / {targets.protein * 4}kcal / {targets.calories > 0 ? Math.round((targets.protein * 4 / targets.calories) * 100) : 0}%</strong>
                    </p>
                    <p className="text-xs lg:text-[13px] text-mm-bone/40 font-body leading-relaxed">{t('dashboard.proteinDesc')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-mm-bone text-[15px] lg:text-[16px]">
                      <strong className="text-sky-400">{t('dashboard.carbohydrates')} — {targets.carbs}g / {targets.carbs * 4}kcal / {targets.calories > 0 ? Math.round((targets.carbs * 4 / targets.calories) * 100) : 0}%</strong>
                    </p>
                    <p className="text-xs lg:text-[13px] text-mm-bone/40 font-body leading-relaxed">{t('dashboard.carbsDesc', { goal: input.goal.toUpperCase() })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-mm-bone text-[15px] lg:text-[16px]">
                      <strong className="text-mm-bone/80">{t('dashboard.fats')} — {targets.fats}g / {targets.fats * 9}kcal / {targets.calories > 0 ? (100 - Math.round((targets.protein * 4 / targets.calories) * 100) - Math.round((targets.carbs * 4 / targets.calories) * 100)) : 0}%</strong>
                    </p>
                    <p className="text-xs lg:text-[13px] text-mm-bone/40 font-body leading-relaxed">{t('dashboard.fatsDesc', { bodyType: input.bodyType })}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 3: SCORE & WELLNESS */}
          <div className="flex flex-col gap-6 h-full">
            <div className="bg-mm-black/40 border border-white/10 rounded-3xl p-6 xl:p-8 flex flex-col flex-1 items-center justify-center relative overflow-hidden group shadow-xl">
              <div className="absolute inset-0 bg-mm-gold/[0.02] pointer-events-none" />
              <div className="flex flex-col items-center text-center space-y-8 w-full z-10">
                <span className="text-sm uppercase tracking-[0.2em] text-mm-bone/60 font-heading">{t('dashboard.personalizationScore')}</span>
                <div className="relative flex items-center justify-center w-40 h-40">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" className="text-white/5 stroke-current" strokeWidth="12" fill="transparent" />
                    <circle 
                      cx="80" cy="80" r="70" 
                      className="text-mm-gold stroke-current drop-shadow-[0_0_10px_rgba(201,168,76,0.6)] score-circle-animated" 
                      strokeWidth="12" fill="transparent" 
                      strokeDasharray="440" 
                      strokeDashoffset={440 - (440 * (Number(animatedScore) || 0)) / 100} 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <div className="text-5xl font-heading tracking-widest text-mm-bone leading-none animate-pulse-subtle">
                    {animatedScore}<span className="text-2xl text-mm-gold/60 ml-1">%</span>
                  </div>
                </div>
                <span className="text-xs text-mm-bone/40 uppercase tracking-widest font-medium px-4">{t('dashboard.accuracyLabel')}</span>
              </div>
            </div>

            <div className="bg-mm-black/30 border border-white/5 rounded-3xl p-6 shadow-inner hover:border-mm-gold/30 transition-all duration-500 group/wellness">
              <div className="grid grid-cols-3 divide-x divide-white/10">
                <div className="flex flex-col items-center justify-center gap-2 hover:brightness-125 transition-all group/metric">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-mm-gold/5 border border-mm-gold/10 group-hover/metric:border-mm-gold/30 transition-all duration-500 shadow-inner">
                    <svg className="w-5 h-5 text-mm-gold/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-heading tracking-widest text-mm-bone leading-none">{Math.round(targets.fiber) || 30}</span>
                    <span className="text-[10px] text-mm-bone/40 uppercase tracking-[0.2em] font-medium mt-1">{t('dashboard.fiberGrams')}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-2 hover:brightness-125 transition-all group/metric">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-mm-bone/5 border border-mm-bone/10 group-hover/metric:border-mm-gold/30 transition-all duration-500 shadow-inner">
                    <svg className="w-5 h-5 text-mm-bone/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                    </svg>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-heading tracking-widest text-mm-bone leading-none">{targets.water || 3.7}</span>
                    <span className="text-[10px] text-mm-bone/40 uppercase tracking-[0.2em] font-medium mt-1">{t('dashboard.waterLiters')}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-2 hover:brightness-125 transition-all group/metric">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-mm-gold/5 border border-mm-gold/10 group-hover/metric:border-mm-gold/30 transition-all duration-500 shadow-inner">
                    <svg className="w-5 h-5 text-mm-gold/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-heading tracking-widest text-mm-bone leading-none">{(targets.steps || 10000).toLocaleString()}</span>
                    <span className="text-[10px] text-mm-bone/40 uppercase tracking-[0.2em] font-medium mt-1">{t('dashboard.stepTarget')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: AI METABOLIC INSIGHT PANEL */}
      <NotesPanel explanation={explanation} />

      {/* ROW 4: PERSONALIZATION EVIDENCE CARDS */}
      <PersonalizationGrid notes={result.notes || []} />

      {/* MEAL PLAN CTA */}
      <div className="pt-4 animate-fadeIn w-full">
        <button
          onClick={() => window.location.href = '/meal-plan'}
          className="w-full py-6 bg-mm-gold text-mm-black font-heading font-black tracking-[0.3em] uppercase text-[22px] md:text-2xl rounded-2xl shadow-[0_20px_50px_rgba(201,168,76,0.2)] border border-mm-gold/20 hover:bg-[#d4b96a] hover:shadow-[0_25px_60px_rgba(201,168,76,0.4)] hover:-translate-y-1 transition-all duration-500 active:scale-[0.98] group flex items-center justify-center gap-4 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none opacity-50" />
          <span className="relative z-10">{t('dashboard.buildMealPlan')}</span>
          <span className="relative z-10 text-3xl transition-transform duration-500 group-hover:translate-x-3">→</span>
        </button>
      </div>
    </div>
  );
}
