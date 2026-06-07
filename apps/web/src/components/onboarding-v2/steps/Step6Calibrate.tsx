import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingState } from '../types';
import PrecisionToggle from '../PrecisionToggle';

interface Props {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => void;
  onCalibrate: () => void;
  isCalibrating: boolean;
}

export default function Step6Calibrate({ state, updateState, onCalibrate, isCalibrating }: Props) {
  const { t } = useTranslation();
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isCalibrating) {
        e.preventDefault();
        onCalibrate();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isCalibrating, onCalibrate]);

  return (
    <div 
      className={`w-full transition-all duration-[300ms] ease-in-out ${
        animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="mb-6">
        <h2 className="font-bebas text-[18px] md:text-xl tracking-wide text-white mb-1 uppercase">{t('step6.title')}</h2>
        <p className="font-sans text-[15px] text-[#888888]">{t('step6.desc')}</p>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <PrecisionToggle
          label={t('step6.bodyFatLabel')}
          sublabel={t('step6.bodyFatSublabel')}
          checked={state.bodyFatEnabled}
          onChange={(checked) => updateState({ bodyFatEnabled: checked })}
        />
        
        <div 
          className={`overflow-hidden transition-all duration-200 ease-in-out ${
            state.bodyFatEnabled ? 'max-h-[120px] opacity-100 mb-2' : 'max-h-0 opacity-0 m-0'
          }`}
        >
          <div className="flex flex-col pt-2">
            <div className="relative w-full max-w-[200px]">
              <input 
                type="number" 
                placeholder="--"
                value={state.bodyFatPercent || ''}
                onChange={(e) => updateState({ bodyFatPercent: e.target.value ? parseInt(e.target.value, 10) : null })}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-default)] focus:border-[var(--border-selected)] text-white rounded-[var(--border-radius-input)] px-4 py-3 outline-none font-sans transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888888] font-sans text-[13px] font-semibold">%</span>
            </div>
            <p className="text-[#888888] font-sans text-[12px] mt-2 italic">
              {t('step6.bodyFatHint')}
            </p>
          </div>
        </div>

        <PrecisionToggle
          label={t('step6.somatotypeTweakLabel')}
          sublabel={t('step6.somatotypeTweakSublabel')}
          checked={state.somatotypeTweakEnabled}
          onChange={(checked) => updateState({ somatotypeTweakEnabled: checked })}
        />
      </div>

      <button
        disabled={isCalibrating}
        onClick={onCalibrate}
        className={`
          w-full py-4 rounded-[var(--border-radius-input)] font-bebas text-[18px] tracking-[0.1em] transition-all duration-200 flex items-center justify-center
          ${isCalibrating 
            ? 'bg-[var(--gold-secondary)] text-[#121212]' 
            : 'bg-[var(--gold-primary)] text-[#121212] hover:bg-[var(--gold-secondary)] hover:scale-[1.01]'
          }
        `}
      >
        {isCalibrating ? (
          <span className="animate-pulse flex items-center gap-2">
            <span className="text-[12px]">⬤</span> {t('step6.calibratingBtn')}
          </span>
        ) : (
          t('step6.calibrateBtn')
        )}
      </button>
    </div>
  );
}
