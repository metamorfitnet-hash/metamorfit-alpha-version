import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingState } from '../types';

interface Props {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => void;
}

export default function Step4BodyFat({ state, updateState }: Props) {
  const { t } = useTranslation();
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Always allow continue — body fat is optional
  const handleContinue = () => {
    updateState({ currentStep: 7 });
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleContinue();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div 
      className={`w-full transition-all duration-[300ms] ease-in-out ${
        animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="mb-8">
        <h2 className="font-bebas text-[18px] md:text-xl tracking-wide text-white mb-1 uppercase">
          {t('step6bf.title')}
        </h2>
        <p className="font-sans text-[15px] text-[#888888]">
          {t('step6bf.desc')}
        </p>
      </div>

      <div className="flex flex-col gap-6 mb-10">
        <div className="flex flex-col">
          <label className="font-sans font-semibold text-[13px] text-[#888888] uppercase tracking-[0.1em] mb-2">
            {t('step6bf.bodyFatLabel')}
          </label>
          <div className="relative">
            <input 
              type="number"
              placeholder="--"
              min="1"
              max="99"
              value={state.bodyFatPercent || ''}
              onChange={(e) => updateState({ bodyFatPercent: e.target.value ? parseFloat(e.target.value) : null })}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-default)] focus:border-[var(--border-selected)] text-white rounded-[var(--border-radius-input)] px-4 py-3 outline-none font-sans transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888888] font-sans text-[13px] font-semibold">%</span>
          </div>
        </div>
      </div>

      {/* Always-enabled CTA — body fat is optional */}
      <button
        onClick={handleContinue}
        className="w-full py-4 rounded-[var(--border-radius-input)] font-sans font-bold uppercase tracking-[0.15em] text-[15px] transition-all duration-200 bg-[var(--gold-primary)] text-[#121212] hover:bg-[var(--gold-secondary)] hover:-translate-y-[1px] shadow-[0_4px_12px_rgba(212,175,55,0.2)]"
      >
        {t('step6bf.continueBtn')}
      </button>
    </div>
  );
}
