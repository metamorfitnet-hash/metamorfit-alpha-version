import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingState } from '../types';

interface Props {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => Promise<void> | void;
}

const ACTIVITY_IDS = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;

// Visual intensity bar — gives each tile a distinctive at-a-glance indicator
const ACTIVITY_BARS: Record<string, number> = {
  sedentary: 1,
  light: 2,
  moderate: 3,
  active: 4,
  very_active: 5,
};

function IntensityBar({ level }: { level: number }) {
  return (
    <div className="flex items-end gap-[3px] h-[18px]">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-[4px] rounded-sm transition-all duration-200 ${
            i <= level ? 'bg-[var(--gold-primary)]' : 'bg-[#333]'
          }`}
          style={{ height: `${(i / 5) * 100}%` }}
        />
      ))}
    </div>
  );
}

export default function Step5Activity({ state, updateState }: Props) {
  const { t } = useTranslation();
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Step 5: NO auto-advance. Selection updates the highlighted tile only.
  const handleSelect = (id: string) => {
    updateState({ activityLevel: id });
  };

  // Continue button: awaits backend sync then routes — single atomic call
  const handleContinue = async () => {
    if (!state.activityLevel) return;
    await updateState({ activityLevel: state.activityLevel, currentStep: 6 });
  };

  const isFormValid = Boolean(state.activityLevel);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isFormValid) {
        e.preventDefault();
        handleContinue();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isFormValid]);

  return (
    /* Step 5 — mobile-first: full-bleed tile stack + sticky Continue button.
       User must scroll through all activity descriptions before reaching CTA. */
    <div
      className={`w-full min-h-[calc(100dvh-160px)] flex flex-col transition-all duration-[300ms] ease-in-out ${
        animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {/* Header */}
      <div className="mb-5">
        <h2 className="font-bebas text-[22px] md:text-2xl tracking-wide text-white mb-1 uppercase">
          {t('step5.title')}
        </h2>
        <p className="font-sans text-[15px] text-[#888888]">{t('step5.desc')}</p>
      </div>

      {/* Full-bleed activity tile stack — replaces compact dropdown */}
      <div className="flex flex-col gap-3 mb-6 flex-shrink-0">
        {ACTIVITY_IDS.map((id) => {
          const isSelected = state.activityLevel === id;
          const barLevel = ACTIVITY_BARS[id];
          return (
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
                w-full text-left px-5 py-4 rounded-[var(--border-radius-card)]
                transition-all duration-[200ms] ease-in-out outline-none
                focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]
                active:scale-[0.99]
                ${isSelected
                  ? 'bg-[var(--bg-card-selected)] border-2 border-[var(--gold-primary)] shadow-[0_0_14px_rgba(212,175,55,0.22)]'
                  : 'bg-[var(--bg-card)] border border-[var(--border-default)] hover:bg-[var(--bg-card-hover)] hover:border-[#4a4a4a]'
                }
              `}
              role="button"
              tabIndex={0}
            >
              {/* Top row: label + intensity bar */}
              <div className="flex items-center justify-between mb-2">
                <h3 className={`font-bebas text-[20px] tracking-wide uppercase leading-none ${
                  isSelected ? 'text-[var(--gold-primary)]' : 'text-white'
                }`}>
                  {t(`step5.levels.${id}.label`)}
                </h3>
                <IntensityBar level={barLevel} />
              </div>
              {/* Description — always visible so mobile users read it without interaction */}
              <p className="font-sans text-[13px] text-[#888888] leading-relaxed">
                {t(`step5.levels.${id}.desc`)}
              </p>
            </button>
          );
        })}
      </div>

      {/* Spacer pushes continue toward bottom on taller viewports */}
      <div className="flex-1" />

      {/* Bottom-anchored Continue — sticky with gradient backdrop */}
      <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent">
        <button
          disabled={!isFormValid}
          onClick={handleContinue}
          className={`
            w-full py-4 rounded-[var(--border-radius-input)] font-sans font-bold
            uppercase tracking-[0.15em] text-[15px] transition-all duration-200
            ${isFormValid
              ? 'bg-[var(--gold-primary)] text-[#121212] hover:bg-[var(--gold-secondary)] hover:-translate-y-[1px] shadow-[0_4px_12px_rgba(212,175,55,0.2)]'
              : 'bg-[var(--bg-card)] text-[var(--text-dim)] pointer-events-none'
            }
          `}
        >
          {t('step5.continueBtn')}
        </button>
      </div>
    </div>
  );
}
