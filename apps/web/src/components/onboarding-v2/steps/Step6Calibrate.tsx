import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingState } from '../types';

interface Props {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => void;
  onCalibrate: (identity: { name: string; email: string }) => void;
  isCalibrating: boolean;
}

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function Step6Calibrate({ state, updateState, onCalibrate, isCalibrating }: Props) {
  const { t } = useTranslation();
  const [animateIn, setAnimateIn] = useState(false);
  const [nameInput, setNameInput] = useState(state.name || '');
  const [emailInput, setEmailInput] = useState(state.email || '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [activeFocus, setActiveFocus] = useState<'name'|'email'|null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const isEs = state.locale === 'es';

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Focus the first field (name) automatically
  useEffect(() => {
    const focusTimer = setTimeout(() => nameRef.current?.focus(), 350);
    return () => clearTimeout(focusTimer);
  }, []);

  const handleSubmit = async () => {
    const trimmedName = nameInput.trim();
    const trimmedEmail = emailInput.trim();
    let hasError = false;

    if (!trimmedName) {
      setNameError(isEs ? 'Por favor, introduce tu nombre.' : 'Please enter your first name.');
      hasError = true;
    } else {
      setNameError(null);
    }

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setEmailError(isEs ? 'Por favor, introduce una dirección de correo válida.' : 'Please enter a valid email address.');
      hasError = true;
    } else {
      setEmailError(null);
    }

    if (hasError) return;

    // Patch identity into ledger before finalize fires
    await updateState({ name: trimmedName, email: trimmedEmail });

    // Pass identity explicitly to avoid stale React state closure in OnboardingContainer
    onCalibrate({ name: trimmedName, email: trimmedEmail });
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
  }, [isCalibrating, nameInput, emailInput]);

  const formValid = nameInput.trim() !== '' && isValidEmail(emailInput.trim());

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
            ? 'Tu motor metabólico está listo.'
            : 'Your metabolic engine is ready.'}
        </h2>

        <p className="font-sans text-[15px] text-[#888888] leading-relaxed max-w-[420px] mx-auto">
          {isEs
            ? 'Para personalizar tu plan de macros y guardar tu perfil, dinos cómo debemos llamarte y a dónde enviar las futuras actualizaciones de tu plan.'
            : 'To personalize your macro blueprint and save your profile, let us know what to call you and where to send future plan updates.'}
        </p>
      </div>

      {/* ── IDENTITY CAPTURE ─────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4">
        {/* First Name Input */}
        <div>
          <label
            htmlFor="lead-name"
            className="font-sans font-semibold text-[12px] text-[#888888] uppercase tracking-[0.14em] mb-2 block"
          >
            {isEs ? 'Nombre' : 'First Name'}
          </label>

          <div
            className={`relative w-full rounded-[var(--border-radius-input)] border transition-all duration-200 ${
              nameError
                ? 'border-[#e05252] shadow-[0_0_0_3px_rgba(224,82,82,0.12)]'
                : activeFocus === 'name'
                ? 'border-[var(--gold-primary)] shadow-[0_0_0_3px_rgba(212,175,55,0.12)]'
                : 'border-[var(--border-default)]'
            }`}
          >
            <input
              ref={nameRef}
              id="lead-name"
              type="text"
              autoComplete="given-name"
              placeholder={isEs ? 'Ej. Alex' : 'e.g. Alex'}
              value={nameInput}
              disabled={isCalibrating}
              onChange={(e) => {
                setNameInput(e.target.value);
                if (nameError) setNameError(null);
              }}
              onFocus={() => setActiveFocus('name')}
              onBlur={() => setActiveFocus(null)}
              className="w-full bg-[var(--bg-card)] text-white rounded-[var(--border-radius-input)] px-4 py-4 outline-none font-sans text-[15px] placeholder:text-[#444] disabled:opacity-50 transition-colors"
            />
            {nameInput.trim() !== '' && !isCalibrating && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--gold-primary)] text-[16px]">
                ✓
              </div>
            )}
          </div>
          {nameError && (
            <p className="text-[#e05252] font-sans text-[12px] mt-1.5">{nameError}</p>
          )}
        </div>

        {/* Email Input */}
        <div>
          <label
            htmlFor="lead-email"
            className="font-sans font-semibold text-[12px] text-[#888888] uppercase tracking-[0.14em] mb-2 block"
          >
            {isEs ? 'Correo electrónico' : 'Email address'}
          </label>

          <div
            className={`relative w-full rounded-[var(--border-radius-input)] border transition-all duration-200 ${
              emailError
                ? 'border-[#e05252] shadow-[0_0_0_3px_rgba(224,82,82,0.12)]'
                : activeFocus === 'email'
                ? 'border-[var(--gold-primary)] shadow-[0_0_0_3px_rgba(212,175,55,0.12)]'
                : 'border-[var(--border-default)]'
            }`}
          >
            <input
              id="lead-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={isEs ? 'tu@correo.com' : 'you@email.com'}
              value={emailInput}
              disabled={isCalibrating}
              onChange={(e) => {
                setEmailInput(e.target.value);
                if (emailError) setEmailError(null);
              }}
              onFocus={() => setActiveFocus('email')}
              onBlur={() => setActiveFocus(null)}
              className="w-full bg-[var(--bg-card)] text-white rounded-[var(--border-radius-input)] px-4 py-4 outline-none font-sans text-[15px] placeholder:text-[#444] disabled:opacity-50 transition-colors"
            />
            {isValidEmail(emailInput.trim()) && !isCalibrating && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--gold-primary)] text-[16px]">
                ✓
              </div>
            )}
          </div>
          {emailError && (
            <p className="text-[#e05252] font-sans text-[12px] mt-1.5">{emailError}</p>
          )}
          <p className="font-sans text-[11px] text-[#555] mt-2 leading-relaxed">
            {isEs
              ? 'Sin spam. Solo tu plan de transformación. Cancelar en cualquier momento.'
              : 'No spam. Just your transformation plan. Unsubscribe anytime.'}
          </p>
        </div>
      </div>

      {/* ── SUBMIT CTA ─────────────────────────────────────────────────────────── */}
      <button
        id="lead-capture-submit"
        disabled={isCalibrating || !formValid}
        onClick={handleSubmit}
        className={`
          w-full py-4 rounded-[var(--border-radius-input)] font-bebas text-[20px]
          tracking-[0.1em] transition-all duration-200 flex items-center justify-center gap-3
          ${isCalibrating
            ? 'bg-[var(--gold-secondary)] text-[#121212] cursor-wait'
            : formValid
            ? 'bg-[var(--gold-primary)] text-[#121212] hover:bg-[var(--gold-secondary)] hover:scale-[1.01] shadow-[0_4px_16px_rgba(212,175,55,0.25)]'
            : 'bg-[var(--bg-card)] text-[var(--text-dim)] border border-[var(--border-default)] pointer-events-none'
          }
        `}
      >
        {isCalibrating ? (
          <span className="animate-pulse flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#121212] animate-bounce [animation-delay:0ms]" />
            <span className="inline-block w-2 h-2 rounded-full bg-[#121212] animate-bounce [animation-delay:150ms]" />
            <span className="inline-block w-2 h-2 rounded-full bg-[#121212] animate-bounce [animation-delay:300ms]" />
            <span className="ml-1">
              {isEs ? 'Calculando Macros...' : 'Calculating Macros...'}
            </span>
          </span>
        ) : (
          <>
            <span>{isEs ? 'Calcular Macros' : 'Calculate Macros'}</span>
            <span className="text-[18px]">→</span>
          </>
        )}
      </button>
    </div>
  );
}
