import React, { useEffect, useState } from 'react';

export default function AhaPreview({ formData, isLanguageSpanish, onEngineReady }) {
  // Localization Dictionary
  const t = {
    en: {
      title: "Designing your transformation blueprint",
      calculating: "Analyzing metabolic baselines",
      target: "Daily Caloric Target",
      focus: "Nutritional Focus",
      building: "Assembling personalized meal ecosystem...",
    },
    es: {
      title: "Diseñando tu plan de transformación",
      calculating: "Analizando bases metabólicas",
      target: "Objetivo Calórico Diario",
      focus: "Enfoque Nutricional",
      building: "Construyendo ecosistema de comidas personalizado...",
    }
  };

  const copy = isLanguageSpanish ? t.es : t.en;
  
  // Local counting animation state
  const [animatedCalories, setAnimatedCalories] = useState(0);
  
  // Client-side baseline derivation (mirroring backend logic for instant feedback)
  const targetCalories = formData?.calculatedSurplusBaseline || 2850; 

  useEffect(() => {
    let start = 0;
    const duration = 1800; // 1.8 seconds cinematic count-up
    const startTime = performance.now();

    function updateNumber(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Decelerating cubic-ease-out curve
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedCalories(Math.floor(easeProgress * targetCalories));

      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      }
    }

    requestAnimationFrame(updateNumber);
  }, [targetCalories]);

  return (
    <div className="w-full max-w-2xl mx-auto min-h-[500px] flex flex-col justify-between py-16 px-6 text-white select-none bg-neutral-950 font-sans">
      
      {/* Top Section: Heading & Category Tracker */}
      <div className="space-y-4 animate-fade-in-up">
        <p className="text-xs tracking-[0.25em] uppercase text-neutral-500 font-semibold">
          {copy.calculating}
        </p>
        <h2 className="text-3xl md:text-4xl font-extralight tracking-tight text-neutral-100 leading-tight">
          {copy.title}
        </h2>
      </div>

      {/* Hero Metric Section: Large Scale Transformation Metric */}
      <div className="my-auto py-14 flex flex-col items-center justify-center border-y border-neutral-900 space-y-3">
        <span className="text-7xl md:text-8xl font-thin tracking-tighter text-white tabular-nums">
          {animatedCalories}
        </span>
        <span className="text-xs tracking-[0.2em] uppercase text-neutral-400 font-medium">
          {copy.target} (kcal)
        </span>
      </div>

      {/* Footer Section: Live Pulsing Status and Archetype Extraction */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-neutral-400 tracking-wide pt-6 border-t border-neutral-900/40">
        <div className="flex items-center space-x-3">
          {/* Minimalist Micro-Pulse Element */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500/70 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <p className="font-light italic text-neutral-400 animate-pulse">{copy.building}</p>
        </div>
        
        {/* Dynamic Context Anchor */}
        <div className="text-left sm:text-right border-l sm:border-l-0 sm:border-r border-neutral-800 pl-3 sm:pl-0 sm:pr-3">
          <span className="text-neutral-500 uppercase tracking-[0.15em] block text-[9px] font-bold">{copy.focus}</span>
          <span className="font-light text-neutral-200 text-sm tracking-wide">
            {formData?.goalArchetype || formData?.goal || 'Metabolic Optimization'}
          </span>
        </div>
      </div>

    </div>
  );
}
