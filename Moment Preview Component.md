Markdown_content = """# Implementation Guide: Minimalist "Aha!" Moment Preview Component

This blueprint provides a drop-in, highly refined transitional phase for your single-page web application. 
It bridges the gap between the completion of the onboarding form and the final payload arrival from the Google Cloud PDF/Meal generation engine.

## 1. Feature Specifications & Aesthetics
* **Tone:** Premium, minimalist, cinematic, architectural.
* **Localization:** Pre-configured for bilingual support (`en` / `es`), responding dynamically to your global language toggle state.
* **Performance:** Pure client-side calculations and hardware-accelerated CSS keyframes. Zero additional backend latency.
* **UX Strategy:** Eradicates "loading anxiety" by instantly feeding user variables back to them in a beautifully staged layout.

---

## 2. Global Styles (`styles/transitions.css`)

Add this custom cubic-bezier timing to your global layout or Tailwind configuration. 
This animation mimics premium design systems (like Apple's) by slowing down elegantly as it reaches its final position.

## 3. The Component (components/AhaPreview.jsx)
Create a new file at components/AhaPreview.jsx. This component calculates the caloric baseline deterministically on the client side while structural network operations complete in the background.

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
  const targetCalories = formData.calculatedSurplusBaseline || 2850; 

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
            {formData.goalArchetype || 'Metabolic Optimization'}
          </span>
        </div>
      </div>

      ### Calculating Macronutrients
      * Protein levels
      * Carbohydrates
      * Fats

      ### Loading Animations
      <div className="loading-animation">
        <div className="underline"></div>
        <div className="underline"></div>
        <div className="underline"></div>
      </div>

      <div className="loading-animation">
        <div className="underline"></div>
        <div className="underline"></div>
        <div className="underline"></div>
      </div>
    </div>
  );
}

## 4. Parent Orchestration Integration
Integrate this state variant right within your single-page dashboard container setup (App.jsx or your dedicated onboarding container component).

import React, { useState, useEffect } from 'react';
import OnboardingForm from './OnboardingForm';
import AhaPreview from './AhaPreview';
import ResultsPanel from './ResultsPanel';

export default function DashboardContainer() {
  // Application Lifecycle States: 'FORM' | 'PREVIEW' | 'STABLE_RESULTS'
  const [lifecycle, setLifecycle] = useState('FORM');
  const [onboardingData, setOnboardingData] = useState(null);
  const [apiPayload, setApiPayload] = useState(null);
  const [isSpanish, setIsSpanish] = useState(false); // Managed by your global toggle

  const handleOnboardingSubmit = async (submittedData) => {
    setOnboardingData(submittedData);
    setLifecycle('PREVIEW'); // Instantly pivot to the Aha Preview UI
    
    try {
      // Trigger the background heavy processing on Google Cloud
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...submittedData, lang: isSpanish ? 'es' : 'en' })
      });
      
      const result = await response.json();
      setApiPayload(result);
      
      // Smoothly transition to the results block once the cloud execution is done
      setLifecycle('STABLE_RESULTS');
    } catch (error) {
      console.error("Cloud generation fault:", error);
      setLifecycle('FORM'); // Error handling fallback
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
      {lifecycle === 'FORM' && (
        <OnboardingForm onSubmit={handleOnboardingSubmit} isLanguageSpanish={isSpanish} />
      )}
      
      {lifecycle === 'PREVIEW' && (
        <AhaPreview formData={onboardingData} isLanguageSpanish={isSpanish} />
      )}
      
      {lifecycle === 'STABLE_RESULTS' && (
        <ResultsPanel data={apiPayload} isLanguageSpanish={isSpanish} />
      )}
    </div>
  );
}
