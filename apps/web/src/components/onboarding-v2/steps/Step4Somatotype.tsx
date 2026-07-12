import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingState } from '../types';

interface Props {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => void;
}

const SOMATOTYPE_IDS = ['ectomorph', 'mesomorph', 'endomorph'] as const;

const SOMATOTYPE_ICONS = {
  ectomorph: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v16M9 8h6M10 12h4M9 16h6" />
    </svg>
  ),
  mesomorph: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4l-4 4v8l4 4 4-4V8z" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  ),
  endomorph: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="6" width="12" height="12" rx="4" />
      <path d="M12 6v12" />
      <path d="M6 12h12" />
    </svg>
  ),
};

export default function Step4Somatotype({ state, updateState }: Props) {
  const { t } = useTranslation();
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Step 4: Selection updates highlight only — NO auto-advance.
  // The explicit Continue button is the only path forward.
  const handleSomatoClick = (typeId: OnboardingState['somatotype']) => {
    updateState({ somatotype: typeId });
    // NOTE: auto-advance (setTimeout → currentStep: 5) deliberately removed
    // per lead magnet UX spec — user must tap the Continue button.
  };

  const isFormValid = state.somatotype !== null;

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isFormValid) {
        e.preventDefault();
        updateState({ currentStep: 5 });
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isFormValid, updateState]);

  return (
    <div
      className={`w-full transition-all duration-[300ms] ease-in-out ${
        animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-bebas text-[22px] md:text-2xl tracking-wide text-white mb-1 uppercase">
          {t('step4.title')}
        </h2>
        <p className="font-sans text-[15px] text-[#888888]">{t('step4.desc')}</p>
      </div>

      {/* Full-bleed tile column on mobile, 3-col on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {SOMATOTYPE_IDS.map((id) => {
          const isSelected = state.somatotype === id;
          return (
            <button
              key={id}
              onClick={() => handleSomatoClick(id as OnboardingState['somatotype'])}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSomatoClick(id as OnboardingState['somatotype']);
                }
              }}
              className={`
                flex flex-col items-center p-6 rounded-[var(--border-radius-card)]
                text-center transition-all duration-[200ms] ease-in-out outline-none
                focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]
                w-full min-h-[140px] active:scale-[0.98]
                ${isSelected
                  ? 'bg-[var(--bg-card-selected)] border-2 border-[var(--gold-primary)] shadow-[0_0_16px_rgba(212,175,55,0.28)] scale-[1.01]'
                  : 'bg-[var(--bg-card)] border border-[var(--border-default)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--gold-secondary)]'
                }
              `}
              role="button"
              tabIndex={0}
            >
              <div className={`mb-4 ${isSelected ? 'text-[var(--gold-primary)]' : 'text-[#888888]'}`}>
                {SOMATOTYPE_ICONS[id]}
              </div>
              <h3 className={`font-bebas text-[22px] tracking-wide uppercase mb-2 ${
                isSelected ? 'text-[var(--gold-primary)]' : 'text-white'
              }`}>
                {t(`step4.somatotypes.${id}.label`)}
              </h3>
              <p className="font-sans text-[13px] text-[#888888] leading-[1.6]">
                {t(`step4.somatotypes.${id}.desc`)}
              </p>
            </button>
          );
        })}
      </div>

      {/* Explicit Continue button — the sole route forward */}
      <button
        disabled={!isFormValid}
        onClick={() => updateState({ currentStep: 5 })}
        className={`
          w-full py-4 rounded-[var(--border-radius-input)] font-sans font-bold
          uppercase tracking-[0.15em] text-[15px] transition-all duration-200
          ${isFormValid
            ? 'bg-[var(--gold-primary)] text-[#121212] hover:bg-[var(--gold-secondary)] hover:-translate-y-[1px] shadow-[0_4px_12px_rgba(212,175,55,0.2)]'
            : 'bg-[var(--bg-card)] text-[var(--text-dim)] pointer-events-none'
          }
        `}
      >
        {t('step4.continueBtn')}
      </button>
    </div>
  );
}
