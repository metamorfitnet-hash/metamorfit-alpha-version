"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BodyType } from "@/types/calculator";
import { useCalculator } from "@/hooks/useCalculator";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { Header } from "@/components/Header";
import { CalculatorForm } from "../components/Calculator/CalculatorForm";
import { ResultsPanel } from "../components/Calculator/ResultsPanel";
import { useTranslation } from "react-i18next";

function CalculatorContent() {
  const { finalized, sessionPayload, loading } = useOnboardingSession();
  const router = useRouter();
  const { i18n } = useTranslation();
  const isEs = i18n.language === 'es';

  // If we haven't recovered session yet, wait a moment.
  // If we determine it's definitely not finalized, redirect to onboarding.
  useEffect(() => {
    // We give the session hook a moment to read from sessionStorage.
    // If after 1 second we still don't have a payload, redirect back to onboarding.
    const timer = setTimeout(() => {
      const stored = sessionStorage.getItem('mm_finalized');
      if (stored !== 'true') {
        router.push('/onboarding-v2');
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [router]);

  // ── RESULTS VIEW (finalized) ────────────────────────────────────────────────
  if (!loading && finalized && sessionPayload) {
    console.log("[CalculatorContent] Rendering results with payload:", sessionPayload);
    const adaptedResult = {
      targets: {
        calories: sessionPayload.calories,
        protein:  sessionPayload.protein,
        carbs:    sessionPayload.carbs,
        fats:     sessionPayload.fat,
        fiber:    sessionPayload.fiber || 39,
        water:    sessionPayload.water || 3.1,
        steps:    sessionPayload.steps || 8000,
      },
      tdee:                sessionPayload.tdee,
      bmr:                 sessionPayload.bmr,
      personalizationScore: sessionPayload.personalizationScore,
      explanation:         (sessionPayload as any).explanation || null,
      notes:               sessionPayload.insights || [],
    };

    const fallbackInput = {
      goal: (sessionPayload as any).goal || 'maintenance',
      bodyType: sessionPayload.somatotype || 'mesomorph',
      precisionMode: false
    };

    return (
      <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-fadeIn">
        <ResultsPanel result={adaptedResult as any} input={fallbackInput as any} onReset={() => router.push('/onboarding-v2')} />
      </div>
    );
  }

  // ── LOADING / REDIRECT VIEW ─────────────────────────────────────────
  console.log("[CalculatorContent] Rendering loading state. finalized:", finalized, "payload:", !!sessionPayload, "storageFinalized:", typeof window !== 'undefined' ? sessionStorage.getItem('mm_finalized') : 'ssr');
  
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8 animate-fadeIn items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-mm-black flex items-center justify-center text-4xl mb-8 text-mm-gold/40 shadow-inner border border-white/5 animate-pulse">
        ⚡
      </div>
      <h3 className="mb-4 tracking-[0.3em] text-mm-bone/40 uppercase text-center font-heading">
        {isEs ? "Sincronizando Motor..." : "Synchronizing Engine..."}
      </h3>
      <p className="max-w-xs text-base text-mm-bone/30 font-body leading-relaxed mx-auto">
        {isEs ? "Recuperando tus objetivos metabólicos. Si aún no te has calibrado, serás redirigido." : "Retrieving your metabolic targets. If you haven't calibrated yet, you will be redirected."}
      </p>
    </div>
  );
}

export default function CalculatorPage() {
  const { finalized } = useOnboardingSession();
  const { i18n } = useTranslation();
  const isEs = i18n.language === 'es';

  return (
    <div className="animate-fadeIn min-h-screen selection:bg-mm-gold/30 flex flex-col">
      {/* Navigation */}
      <Header variant="app" />

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-24 px-6 overflow-x-hidden">

        {/* ── RESULTS HEADER ── */}
        <div className="pt-40 pb-10 text-center max-w-5xl mx-auto animate-fadeIn relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-mm-gold/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="inline-block px-5 py-1.5 mb-8 rounded-full bg-mm-gold/5 border border-mm-gold/10 relative z-10">
            <span className="text-mm-gold text-sm font-heading tracking-[0.3em] uppercase opacity-80">
              {finalized 
                ? (isEs ? "Motor Sincronizado" : "Engine Synchronized") 
                : (isEs ? "Motor Metabólico de Precisión v2.0" : "Precision Metabolic Engine v2.0")}
            </span>
          </div>
          <h1 className="relative z-10 mb-8">
            {isEs ? "Resultados de" : "Macro Breakdown"} <span className="text-mm-gold">{isEs ? "Desglose de Macros." : "Results."}</span>
          </h1>
        </div>

        <Suspense fallback={<div className="text-mm-gold font-heading text-center py-32 text-2xl tracking-widest animate-pulse">{isEs ? "Inicializando Motor..." : "Initializing Engine..."}</div>}>
          <CalculatorContent />
        </Suspense>

      </main>
    </div>
  );
}
