import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingState } from '../types';
import UnitToggle from '../UnitToggle';

interface Props {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => void;
}

export default function Step3Metrics({ state, updateState }: Props) {
  const { t } = useTranslation();
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleWeightUnitChange = (newUnit: string) => {
    const from = state.weightUnit;
    const to = newUnit.toLowerCase() as 'kg' | 'lbs';
    let newValue = state.weightValue;

    if (newValue !== null && from !== to) {
      if (from === 'kg' && to === 'lbs') {
        newValue = Math.round(newValue * 2.20462 * 10) / 10;
      } else if (from === 'lbs' && to === 'kg') {
        newValue = Math.round((newValue / 2.20462) * 10) / 10;
      }
    }
    updateState({ weightUnit: to, weightValue: newValue });
  };

  const handleHeightUnitChange = (newUnit: string) => {
    const from = state.heightUnit;
    const to = newUnit === 'FT/IN' ? 'ft' : 'cm';
    let newValue = state.heightValue;

    if (newValue !== null && from !== to) {
      if (from === 'cm' && to === 'ft') {
        newValue = Math.round(newValue / 2.54);
      } else if (from === 'ft' && to === 'cm') {
        newValue = Math.round(newValue * 2.54);
      }
    }
    updateState({ heightUnit: to, heightValue: newValue });
  };

  // Convert heightValue to display FT/IN
  let displayFt = '';
  let displayIn = '';
  if (state.heightUnit === 'ft' && state.heightValue !== null) {
    displayFt = Math.floor(state.heightValue / 12).toString();
    displayIn = (state.heightValue % 12).toString();
  }

  const handleFtChange = (val: string) => {
    const f = parseInt(val, 10);
    const i = parseInt(displayIn, 10) || 0;
    if (isNaN(f) && isNaN(i)) {
      updateState({ heightValue: null });
    } else {
      updateState({ heightValue: (isNaN(f) ? 0 : f) * 12 + i });
    }
  };

  const handleInChange = (val: string) => {
    const f = parseInt(displayFt, 10) || 0;
    const i = parseInt(val, 10);
    if (isNaN(f) && isNaN(i)) {
      updateState({ heightValue: null });
    } else {
      updateState({ heightValue: f * 12 + (isNaN(i) ? 0 : i) });
    }
  };

  const isFormValid = 
    state.weightValue !== null && state.weightValue > 0 && 
    state.heightValue !== null && state.heightValue > 0;

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isFormValid) {
        e.preventDefault();
        updateState({ currentStep: 4 });
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
      <div className="mb-8">
        <h2 className="font-bebas text-[18px] md:text-xl tracking-wide text-white mb-1 uppercase">{t('step3.title')}</h2>
        <p className="font-sans text-[15px] text-[#888888]">{t('step3.desc')}</p>
      </div>

      <div className="flex flex-col gap-6 mb-10">
        {/* Weight */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <label className="font-sans font-semibold text-[13px] text-[#888888] uppercase tracking-[0.1em]">{t('step3.weightLabel')}</label>
            <UnitToggle 
              options={['KG', 'LBS']} 
              activeOption={state.weightUnit.toUpperCase()} 
              onChange={handleWeightUnitChange} 
            />
          </div>
          <input 
            type="number"
            placeholder="--"
            value={state.weightValue || ''}
            onChange={(e) => updateState({ weightValue: e.target.value ? parseFloat(e.target.value) : null })}
            className="w-full bg-[var(--bg-card)] border border-[var(--border-default)] focus:border-[var(--border-selected)] text-white rounded-[var(--border-radius-input)] px-4 py-3 outline-none font-sans transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        {/* Height */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <label className="font-sans font-semibold text-[13px] text-[#888888] uppercase tracking-[0.1em]">{t('step3.heightLabel')}</label>
            <UnitToggle 
              options={['CM', 'FT/IN']} 
              activeOption={state.heightUnit === 'cm' ? 'CM' : 'FT/IN'} 
              onChange={handleHeightUnitChange} 
            />
          </div>
          {state.heightUnit === 'cm' ? (
            <input 
              type="number"
              placeholder="--"
              value={state.heightValue || ''}
              onChange={(e) => updateState({ heightValue: e.target.value ? parseFloat(e.target.value) : null })}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-default)] focus:border-[var(--border-selected)] text-white rounded-[var(--border-radius-input)] px-4 py-3 outline-none font-sans transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          ) : (
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input 
                  type="number"
                  placeholder="--"
                  value={displayFt}
                  onChange={(e) => handleFtChange(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-default)] focus:border-[var(--border-selected)] text-white rounded-[var(--border-radius-input)] px-4 py-3 outline-none font-sans transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888888] font-sans text-[13px] font-semibold">FT</span>
              </div>
              <div className="flex-1 relative">
                <input 
                  type="number"
                  placeholder="--"
                  value={displayIn}
                  onChange={(e) => handleInChange(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-default)] focus:border-[var(--border-selected)] text-white rounded-[var(--border-radius-input)] px-4 py-3 outline-none font-sans transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888888] font-sans text-[13px] font-semibold">IN</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        disabled={!isFormValid}
        onClick={() => updateState({ currentStep: 4 })}
        className={`
          w-full py-4 rounded-[var(--border-radius-input)] font-sans font-bold uppercase tracking-[0.15em] text-[15px] transition-all duration-200
          ${isFormValid 
            ? 'bg-[var(--gold-primary)] text-[#121212] hover:bg-[var(--gold-secondary)] hover:-translate-y-[1px] shadow-[0_4px_12px_rgba(212,175,55,0.2)]' 
            : 'bg-[var(--bg-card)] text-[var(--text-dim)] pointer-events-none'
          }
        `}
      >
        {t('step3.continueBtn')}
      </button>
    </div>
  );
}
