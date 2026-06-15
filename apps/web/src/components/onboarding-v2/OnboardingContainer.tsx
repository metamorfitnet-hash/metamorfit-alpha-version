'use client';

import React, { useState } from 'react';
import '../../i18n';
import './theme.css';
import { OnboardingState } from './types';
import OnboardingHeader from './OnboardingHeader';
import OnboardingProgressBar from './OnboardingProgressBar';
import Step1PersonaSelect from './steps/Step1PersonaSelect';
import Step2GoalSelect from './steps/Step2GoalSelect';
import Step3Metrics from './steps/Step3Metrics';
import Step4Somatotype from './steps/Step4Somatotype';
import Step5Activity from './steps/Step5Activity';
import Step6Calibrate from './steps/Step6Calibrate';
import { useOnboardingSession } from '@/hooks/useOnboardingSession';
import { useTranslation } from 'react-i18next';
import AhaPreview from '../AhaPreview';

export default function OnboardingContainer() {
  const { ledger, initSession, saveStep, finalize, loading: sessionLoading, error: sessionError } = useOnboardingSession();
  const { i18n } = useTranslation();
  
  const [lifecycle, setLifecycle] = useState<'FORM' | 'PREVIEW' | 'STABLE_RESULTS'>('FORM');
  const [state, setState] = useState<OnboardingState>({
    locale: 'en',
    currentStep: 1,
    sex: null,
    age: null,
    persona: null,
    goal: null,
    weightValue: null,
    weightUnit: 'kg',
    heightValue: null,
    heightUnit: 'cm',
    somatotype: null,
    activityLevel: null,
    bodyFatEnabled: false,
    bodyFatPercent: null,
    somatotypeTweakEnabled: false,
    email: null,
  });

  // Sync session data to local state if recovered
  React.useEffect(() => {
    // Safely hydrate language from localStorage to prevent SSR mismatch
    const savedLocale = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'es')) {
      if (i18n.language !== savedLocale) {
        i18n.changeLanguage(savedLocale);
      }
    }

    if (ledger && ledger.data) {
      if (ledger.data.locale && ledger.data.locale !== i18n.language) {
        i18n.changeLanguage(ledger.data.locale);
        localStorage.setItem('i18nextLng', ledger.data.locale);
      }
      setState(prev => ({ 
        ...prev, 
        ...ledger.data, 
        // Only use server step if we are on step 1 (initial load recovery), otherwise trust local state
        currentStep: prev.currentStep > 1 ? prev.currentStep : (ledger.currentStep || 1) as any 
      }));
    }
  }, [ledger?.userId]);

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isSuccessFlash, setIsSuccessFlash] = useState(false);

  const updateState = async (updates: Partial<OnboardingState>) => {
    // 1. Immediately sync input data to local state for snappy UI (but hold the step transition)
    const isRouting = updates.currentStep !== undefined;
    const nextStep = updates.currentStep;
    const dataUpdates = { ...updates };
    if (isRouting) delete dataUpdates.currentStep;
    
    setState(prev => ({ ...prev, ...dataUpdates }));
    
    // 2. Await the centralized KV Ledger update
    try {
      if (ledger?.userId) {
        await saveStep(updates);
      } else if (state.currentStep === 1 && updates.persona) {
        // Init session on first interaction — pass current locale to seed the KV ledger
        await initSession(state.locale);
        await saveStep({ ...state, ...updates });
      }
    } catch (err) {
      console.error("Failed to sync state to ledger:", err);
    }
    
    // 3. Execute the step transition ONLY after backend completes saving
    if (isRouting && nextStep !== undefined) {
      console.log("🔍 DEBUG FRONTEND: Auto-advance triggering to step:", nextStep);
      setState(prev => ({ ...prev, currentStep: nextStep as any }));
    }
  };

  const handleLanguageToggle = async (newLocale: 'en' | 'es') => {
    i18n.changeLanguage(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('i18nextLng', newLocale);
    }
    await updateState({ locale: newLocale });
  };

  const handleBack = () => {
    if (state.currentStep > 1 && !isCalibrating) {
      updateState({ currentStep: (state.currentStep - 1) as OnboardingState['currentStep'] });
    }
  };

  const handleCalibrate = async () => {
    // Guard: ensure the shadow calculator in AhaPreview has all 4 required biometric inputs.
    // If any are missing, the animation would fall back to 2850.
    const missingInputs = !state.weightValue || !state.heightValue || !state.age || !state.sex;
    if (missingInputs) {
      console.warn('[OnboardingContainer] handleCalibrate: Missing biometric inputs for shadow calc.', {
        weightValue: state.weightValue,
        heightValue: state.heightValue,
        age: state.age,
        sex: state.sex,
      });
    } else {
      console.log('[OnboardingContainer] Transitioning to PREVIEW with full formData snapshot:', {
        weightValue: state.weightValue,
        weightUnit: state.weightUnit,
        heightValue: state.heightValue,
        heightUnit: state.heightUnit,
        age: state.age,
        sex: state.sex,
        activityLevel: state.activityLevel,
        goal: state.goal,
        locale: state.locale,
      });
    }
    setIsCalibrating(true);
    setLifecycle('PREVIEW');

    try {
      let finalData;
      try {
        // 1. Try to Finalize via Engine's Ledger API
        finalData = await finalize();
      } catch (err) {
        console.warn("Ledger API failed, using fallback calculation", err);
        // Fallback: calculate manually using /api/calculate if ledger isn't available
        const mappedGoal = {
          'cut': 'fat_loss',
          'maintain': 'maintenance',
          'bulk': 'muscle_gain',
          'recomp': 'recomp'
        }[state.goal?.toLowerCase() || 'maintain'] || 'maintenance';

        const payload = {
          age: Number(state.age) || 30,
          sex: state.sex?.toLowerCase() || 'male',
          weightKg: state.weightUnit === 'lbs' ? Number(state.weightValue) * 0.453592 : Number(state.weightValue),
          weight: state.weightUnit === 'lbs' ? Number(state.weightValue) * 0.453592 : Number(state.weightValue),
          heightCm: state.heightUnit === 'ft' ? Number(state.heightValue) * 2.54 : Number(state.heightValue),
          height: state.heightUnit === 'ft' ? Number(state.heightValue) * 2.54 : Number(state.heightValue),
          activityLevel: state.activityLevel?.toLowerCase() || 'sedentary',
          goal: mappedGoal,
          bodyType: state.somatotype?.toLowerCase() || 'mesomorph',
          bodyFatPercent: state.bodyFatPercent ? Number(state.bodyFatPercent) : undefined,
          precisionMode: state.bodyFatEnabled,
          somatotypeTweak: state.somatotypeTweakEnabled,
          locale: state.locale
        };

        const res = await fetch('/api/calculator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Calculation API failed");
        
        const data = await res.json();
        
        // Transform the payload to look like MacroPayload so /calculator page can read it
        finalData = {
          calories: data.targets?.calories || data.targetKcal || 0,
          protein: data.targets?.protein || data.macros?.protein || 0,
          carbs: data.targets?.carbs || data.macros?.carbs || 0,
          fat: data.targets?.fats || data.macros?.fats || 0,
          tdee: data.tdee || 0,
          bmr: data.bmr || 0,
          personalizationScore: data.personalizationScore || 0,
          insights: data.notes || data.insights || data.intelligenceNotes || [],
          explanation: data.explanation || null,
          somatotype: state.somatotype?.toLowerCase() || 'mesomorph',
          goal: state.goal?.toLowerCase() || 'maintenance',
        };

        // Manually save to sessionStorage so /calculator works!
        sessionStorage.setItem('mm_finalized', 'true');
        sessionStorage.setItem('mm_session_payload', JSON.stringify(finalData));
      }

      // 2. Trigger Success Animation & Redirect
      setTimeout(() => {
        setIsSuccessFlash(true);
      }, 600);

      setTimeout(() => {
        setLifecycle('STABLE_RESULTS');
        window.location.href = '/calculator'; // Results Panel logic reads from ledger/session
      }, 1000);

    } catch (err) {
      console.error("Calculation Error:", err);
      setIsCalibrating(false);
      setLifecycle('FORM');
      alert("Metabolic Engine Error. Please check your inputs.");
    }
  };

  return (
    <div className="onboarding-v2-scope min-h-screen w-full flex flex-col items-center">
      <div 
        className={`w-full max-w-[700px] px-4 py-8 flex flex-col relative transition-shadow duration-[300ms] ${
          isSuccessFlash ? 'shadow-[0_0_24px_rgba(212,175,55,0.4)]' : ''
        }`}
      >
        <div className="absolute top-8 right-4 flex gap-2 z-10">
          <button 
            onClick={() => handleLanguageToggle('en')}
            className={`px-3 py-1 text-xs font-bold rounded ${state.locale === 'en' ? 'bg-[var(--gold-primary)] text-black' : 'bg-transparent text-[var(--text-muted)] border border-[var(--gold-primary)]'}`}
          >
            EN
          </button>
          <button 
            onClick={() => handleLanguageToggle('es')}
            className={`px-3 py-1 text-xs font-bold rounded ${state.locale === 'es' ? 'bg-[var(--gold-primary)] text-black' : 'bg-transparent text-[var(--text-muted)] border border-[var(--gold-primary)]'}`}
          >
            ES
          </button>
        </div>

        {lifecycle === 'FORM' && (
          <>
            <OnboardingHeader />
            <OnboardingProgressBar currentStep={state.currentStep} totalSteps={6} isCalibrating={isCalibrating} />
            
            <div className="mt-8 flex-1 relative w-full">
              {state.currentStep === 1 && (
                <Step1PersonaSelect state={state} updateState={updateState} />
              )}

              {state.currentStep === 2 && (
                <Step2GoalSelect state={state} updateState={updateState} />
              )}

              {state.currentStep === 3 && (
                <Step3Metrics state={state} updateState={updateState} />
              )}

              {state.currentStep === 4 && (
                <Step4Somatotype state={state} updateState={updateState} />
              )}

              {state.currentStep === 5 && (
                <Step5Activity state={state} updateState={updateState} />
              )}

              {state.currentStep === 6 && (
                <Step6Calibrate 
                  state={state} 
                  updateState={updateState} 
                  onCalibrate={handleCalibrate} 
                  isCalibrating={isCalibrating} 
                />
              )}

              {state.currentStep > 6 && (
                <div className="p-6 rounded-[var(--border-radius-card)] bg-[var(--bg-card)]">
                   <h2 className="font-bebas text-2xl mb-4 text-[var(--text-primary)]">Step {state.currentStep} Placeholder</h2>
                   <p className="text-[var(--text-muted)]">This step will be implemented in the next phase.</p>
                   
                   <div className="mt-6 flex gap-4">
                      {state.currentStep < 6 && (
                          <button 
                              onClick={() => updateState({ currentStep: (state.currentStep + 1) as OnboardingState['currentStep'] })}
                              className="px-6 py-2 rounded font-bold uppercase tracking-wide hover:opacity-90 transition-opacity bg-[var(--gold-primary)] text-[#121212]"
                          >
                              Next Step (Dev)
                          </button>
                      )}
                   </div>
                </div>
              )}

              {state.currentStep > 1 && (
                <button 
                  onClick={handleBack}
                  className="mt-6 font-medium text-sm flex items-center gap-2 hover:text-white transition-colors text-[var(--text-muted)]"
                >
                  ← BACK
                </button>
              )}
            </div>
          </>
        )}

        {lifecycle === 'PREVIEW' && (
          <AhaPreview 
            formData={state} 
            isLanguageSpanish={state.locale === 'es'} 
            onEngineReady={() => {}}
          />
        )}
      </div>
    </div>
  );
}
