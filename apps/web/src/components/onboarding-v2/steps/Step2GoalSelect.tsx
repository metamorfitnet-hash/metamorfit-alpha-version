import React, { useState, useEffect } from 'react';
import { OnboardingState } from '../types';
import { useTranslation } from 'react-i18next';

interface Props {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => Promise<void> | void;
}

export default function Step2GoalSelect({ state, updateState }: Props) {
  const { t } = useTranslation();
  const [animateIn, setAnimateIn] = useState(false);

  const GOALS = [
    {
      id: 'maintain',
      label: t('step2.goals.maintain.label'),
      desc: t('step2.goals.maintain.desc')
    },
    {
      id: 'bulk',
      label: t('step2.goals.bulk.label'),
      desc: t('step2.goals.bulk.desc')
    },
    {
      id: 'cut',
      label: t('step2.goals.cut.label'),
      desc: t('step2.goals.cut.desc')
    },
    {
      id: 'recomp',
      label: t('step2.goals.recomp.label'),
      desc: t('step2.goals.recomp.desc')
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Step 2: NO auto-advance. Selection only updates the highlight.
  const handleGoalClick = (goalId: OnboardingState['goal']) => {
    updateState({ goal: goalId });
  };

  // Continue button: awaits backend sync then routes — single atomic call
  const handleContinue = async () => {
    if (!state.goal) return;
    await updateState({ goal: state.goal, currentStep: 3 });
  };

  const isFormValid = state.goal !== null;

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
    /* Step 2 — mobile-first layout: natural scroll forces user to read
       descriptions before reaching the bottom-anchored Continue button. */
    <div
      className={`w-full min-h-[calc(100dvh-160px)] flex flex-col transition-all duration-[300ms] ease-in-out ${
        animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-bebas text-[22px] md:text-2xl tracking-wide text-white mb-1 uppercase">
          {t('step2.title')}
        </h2>
        <p className="font-sans text-[15px] text-[#888888]">{t('step2.desc')}</p>
      </div>

      {/* Tile grid — full-bleed on mobile, 2-col on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 flex-shrink-0">
        {GOALS.map((g) => {
          const isSelected = state.goal === g.id;
          return (
            <button
              key={g.id}
              onClick={() => handleGoalClick(g.id as OnboardingState['goal'])}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleGoalClick(g.id as OnboardingState['goal']);
                }
              }}
              className={`
                w-full p-5 rounded-[var(--border-radius-card)] text-left
                transition-all duration-[200ms] ease-in-out outline-none
                min-h-[100px] flex flex-col justify-between
                focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]
                active:scale-[0.98]
                ${isSelected
                  ? 'bg-[var(--bg-card-selected)] border-2 border-[var(--gold-primary)] shadow-[0_0_16px_rgba(212,175,55,0.25)]'
                  : 'bg-[var(--bg-card)] border border-[var(--border-default)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--gold-secondary)]'
                }
              `}
              role="button"
              tabIndex={0}
            >
              {/* Goal label */}
              <h3
                className={`font-bebas text-[22px] tracking-wide uppercase leading-none mb-2 ${
                  isSelected ? 'text-[var(--gold-primary)]' : 'text-white'
                }`}
              >
                {g.label}
              </h3>
              {/* Description inline inside the tile */}
              <p className="font-sans text-[13px] text-[#888888] leading-relaxed">
                {g.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Spacer pushes continue button toward bottom on tall viewports */}
      <div className="flex-1" />

      {/* Bottom-anchored Continue — sticky on mobile so it doesn't disappear off-screen */}
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
          {t('step2.continueBtn')}
        </button>
      </div>
    </div>
  );
}
