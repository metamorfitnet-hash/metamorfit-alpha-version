import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingState } from '../types';

interface Props {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => Promise<void> | void;
}

const ACTIVITY_IDS = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;

export default function Step5Activity({ state, updateState }: Props) {
  const { t } = useTranslation();
  const [animateIn, setAnimateIn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Step 5: NO auto-advance. Selection updates dropdown only.
  const handleSelect = (id: string) => {
    setIsOpen(false);
    updateState({ activityLevel: id });
  };

  // Continue button: awaits backend sync then routes — single atomic call
  const handleContinue = async () => {
    if (!state.activityLevel) return;
    await updateState({ activityLevel: state.activityLevel, currentStep: 6 });
  };

  const isFormValid = state.activityLevel !== null;

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isFormValid && !isOpen) {
        e.preventDefault();
        handleContinue();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isFormValid, isOpen]);

  const selectedLabel = state.activityLevel
    ? t(`step5.levels.${state.activityLevel}.label`)
    : null;
  const selectedDesc = state.activityLevel
    ? t(`step5.levels.${state.activityLevel}.desc`)
    : null;

  return (
    <div 
      className={`w-full transition-all duration-[300ms] ease-in-out ${
        animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="mb-6">
        <h2 className="font-bebas text-[18px] md:text-xl tracking-wide text-white mb-1 uppercase">{t('step5.title')}</h2>
        <p className="font-sans text-[15px] text-[#888888]">{t('step5.desc')}</p>
      </div>

      <div className="w-full relative mb-6" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          className={`
            w-full flex items-center justify-between px-4 py-4 rounded-[var(--border-radius-input)] text-left font-sans transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]
            ${isOpen ? 'border-[var(--gold-primary)] bg-[var(--bg-card)]' : 'border-[var(--border-default)] bg-[var(--bg-card)] hover:border-[#4a4a4a]'}
            border
          `}
        >
          <span className={`text-[15px] ${selectedLabel ? 'text-white' : 'text-[#555555]'}`}>
            {selectedLabel ?? t('step5.placeholder')}
          </span>
          <div className={`transition-transform duration-200 text-[var(--gold-primary)] ${isOpen ? 'rotate-180' : ''}`}>
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#1c1c1c] border border-[var(--border-default)] rounded-[var(--border-radius-input)] shadow-[0_8px_24px_rgba(0,0,0,0.6)] z-20 overflow-hidden">
            <div className="max-h-[280px] overflow-y-auto">
              {ACTIVITY_IDS.map((id) => (
                <button
                  key={id}
                  onClick={() => handleSelect(id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(id);
                    }
                  }}
                  className={`
                    w-full text-left px-4 py-3 font-sans text-[14px] transition-colors outline-none focus-visible:bg-[#2a2a2a]
                    ${state.activityLevel === id ? 'text-[var(--gold-primary)] bg-[#2a2410]' : 'text-white hover:bg-[#2a2a2a]'}
                  `}
                >
                  {t(`step5.levels.${id}.label`)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-full relative min-h-[40px] mb-8">
        {selectedDesc && (
          <p className="font-sans text-[14px] text-[var(--text-muted)] italic leading-relaxed animate-fadeIn">
            {selectedDesc}
          </p>
        )}
      </div>

      <button
        disabled={!isFormValid}
        onClick={handleContinue}
        className={`
          w-full py-4 rounded-[var(--border-radius-input)] font-sans font-bold uppercase tracking-[0.15em] text-[15px] transition-all duration-200
          ${isFormValid 
            ? 'bg-[var(--gold-primary)] text-[#121212] hover:bg-[var(--gold-secondary)] hover:-translate-y-[1px] shadow-[0_4px_12px_rgba(212,175,55,0.2)]' 
            : 'bg-[var(--bg-card)] text-[var(--text-dim)] pointer-events-none'
          }
        `}
      >
        {t('step5.continueBtn')}
      </button>
    </div>
  );
}
