import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingState } from '../types';

interface Props {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => void;
  onCalibrate: () => void;
  isCalibrating: boolean;
}

export default function Step6Calibrate({ state, onCalibrate, isCalibrating }: Props) {
  const { t } = useTranslation();
  const [animateIn, setAnimateIn] = useState(false);

  const isEs = state.locale === 'es';

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    // Trigger the finalization pipeline directly since identity is already captured
    onCalibrate();
  };

  // Allow Enter key to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isCalibrating) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCalibrating]);

  return (
    <div
      className={`w-full transition-all duration-[300ms] ease-in-out ${
        animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {/* ── VALUE PROPOSITION HEADER ─────────────────────────────────────────── */}
      <div className="mb-8 text-center">
        {/* Gold accent line */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="h-[1px] w-10 bg-[var(--gold-primary)]" />
          <span className="font-bebas text-[var(--gold-primary)] text-[11px] tracking-[0.3em] uppercase">
            {isEs ? 'Último paso' : 'Final step'}
          </span>
          <div className="h-[1px] w-10 bg-[var(--gold-primary)]" />
        </div>

        <h2 className="font-bebas text-[28px] md:text-[32px] tracking-wide text-white uppercase leading-tight mb-3">
          {isEs
            ? 'Tu manual de transformación está listo.'
            : 'Your transformation manual is ready.'}
        </h2>

        <p className="font-sans text-[15px] text-[#888888] leading-relaxed max-w-[420px] mx-auto">
          {isEs
            ? 'Tu plan personalizado de ganancia muscular, analizado por IA y calibrado específicamente para tu fisiología de hardgainer, se está compilando ahora mismo y será enviado directamente a tu bandeja de entrada.'
            : 'Your personalized muscle-building plan — AI-analyzed and calibrated specifically for your hardgainer physiology — is being compiled right now and will be routed directly to your inbox.'}
        </p>
      </div>

      {/* ── WHAT THEY RECEIVE ─────────────────────────────────────────────────── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-[var(--border-radius-card)] px-5 py-4 mb-8">
        <p className="font-sans text-[11px] text-[var(--gold-primary)] uppercase tracking-[0.2em] mb-3">
          {isEs ? 'Lo que recibirás' : "What you'll receive"}
        </p>
        <ul className="flex flex-col gap-2">
          {(isEs
            ? [
                'Tu objetivo calórico preciso y división de macros',
                'Estrategia de proteínas calibrada para tu metabolismo ectomorfo',
                'Contexto de IA sobre por qué este plan funciona para ti',
                'Documento PDF completo y premium entregado en minutos',
              ]
            : [
                'Your precise caloric target and macro split',
                'Protein strategy calibrated for your ectomorph metabolism',
                'AI context on exactly why this plan works for your body',
                'Full premium PDF document delivered within minutes',
              ]
          ).map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 font-sans text-[13px] text-[#cccccc]">
              <span className="text-[var(--gold-primary)] mt-[1px] shrink-0">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* ── SUBMIT CTA ─────────────────────────────────────────────────────────── */}
      <button
        id="lead-capture-submit"
        disabled={isCalibrating}
        onClick={handleSubmit}
        className={`
          w-full py-4 rounded-[var(--border-radius-input)] font-bebas text-[20px]
          tracking-[0.1em] transition-all duration-200 flex items-center justify-center gap-3
          ${isCalibrating
            ? 'bg-[var(--gold-secondary)] text-[#121212] cursor-wait'
            : 'bg-[var(--gold-primary)] text-[#121212] hover:bg-[var(--gold-secondary)] hover:scale-[1.01] shadow-[0_4px_16px_rgba(212,175,55,0.25)]'
          }
        `}
      >
        {isCalibrating ? (
          <span className="animate-pulse flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#121212] animate-bounce [animation-delay:0ms]" />
            <span className="inline-block w-2 h-2 rounded-full bg-[#121212] animate-bounce [animation-delay:150ms]" />
            <span className="inline-block w-2 h-2 rounded-full bg-[#121212] animate-bounce [animation-delay:300ms]" />
            <span className="ml-1">
              {isEs ? 'Compilando tu plan...' : 'Compiling your plan...'}
            </span>
          </span>
        ) : (
          <>
            <span>{isEs ? 'Generar mi plan' : 'Generate my plan'}</span>
            <span className="text-[18px]">→</span>
          </>
        )}
      </button>
    </div>
  );
}
