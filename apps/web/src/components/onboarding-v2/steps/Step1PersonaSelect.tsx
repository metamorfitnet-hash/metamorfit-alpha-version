import React, { useState, useEffect } from 'react';
import { OnboardingState } from '../types';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

interface Props {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => void;
}

export default function Step1PersonaSelect({ state, updateState }: Props) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const PERSONAS = [
    {
      id: 'hardgainer',
      label: t('step1.personas.hardgainer.label'),
      desc: t('step1.personas.hardgainer.desc'),
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4v16m-4-4h8M8 8h8" />
        </svg>
      )
    },
    {
      id: 'rebuilder',
      label: t('step1.personas.rebuilder.label'),
      desc: t('step1.personas.rebuilder.desc'),
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      )
    },
    {
      id: 'optimizer',
      label: t('step1.personas.optimizer.label'),
      desc: t('step1.personas.optimizer.desc'),
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="M18 9l-5 5-4-4-5 5" />
        </svg>
      )
    },
    {
      id: 'converter',
      label: t('step1.personas.converter.label'),
      desc: t('step1.personas.converter.desc'),
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // ── Language Selection ────────────────────────────────────────────────────────
  // Immediately calls i18next.changeLanguage + persists to localStorage + patches state.
  // This fires BEFORE any biometric data is entered, so the chosen locale is available
  // when initSession() is called on persona commit.
  const handleLocaleSelect = (lang: 'en' | 'es') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
    updateState({ locale: lang });
  };

  const handlePersonaClick = (personaId: OnboardingState['persona']) => {
    if (!state.sex) {
      setError(t('step1.errorSex'));
      return;
    }
    if (!state.age || state.age < 13 || state.age > 80) {
      setError(t('step1.errorAge'));
      return;
    }
    setError(null);
    updateState({ persona: personaId });
    setTimeout(() => {
      updateState({ currentStep: 2 });
    }, 400);
  };

  const isFormValid =
    state.sex !== null &&
    state.age !== null &&
    state.age >= 13 &&
    state.age <= 80 &&
    state.persona !== null &&
    state.name !== null && state.name.trim() !== '' &&
    state.email !== null && isValidEmail(state.email);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isFormValid) {
        e.preventDefault();
        updateState({ currentStep: 2 });
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
      {/* ── FRONT-LOADED LANGUAGE SELECTOR ─────────────────────────────────────
          Displayed at the very top of the card, before any biographical inputs.
          Selecting a language immediately applies i18next.changeLanguage() so all
          translated strings update in real time. The chosen locale is bound to
          state.locale and will be passed to POST /api/ledger/init when the session
          is created on persona commit.
      ─────────────────────────────────────────────────────────────────────────── */}
      <div className="mb-7">
        <p className="font-sans text-[11px] text-[#555] uppercase tracking-[0.18em] mb-3">
          {state.locale === 'es' ? 'Selecciona tu idioma' : 'Select your language'}
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={() => handleLocaleSelect('en')}
            className={`
              flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-[var(--border-radius-card)]
              font-sans font-bold text-[14px] tracking-[0.08em] uppercase
              transition-all duration-200 outline-none
              focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]
              active:scale-[0.98]
              ${state.locale === 'en'
                ? 'bg-[var(--gold-primary)] text-[#121212] shadow-[0_0_14px_rgba(212,175,55,0.3)]'
                : 'bg-[var(--bg-card)] border border-[var(--border-default)] text-[#888888] hover:border-[var(--gold-secondary)] hover:text-white'
              }
            `}
          >
            {/* US flag emoji as a lightweight, no-dependency locale indicator */}
            <span className="text-[18px] leading-none">🇺🇸</span>
            English
          </button>
          <button
            onClick={() => handleLocaleSelect('es')}
            className={`
              flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-[var(--border-radius-card)]
              font-sans font-bold text-[14px] tracking-[0.08em] uppercase
              transition-all duration-200 outline-none
              focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]
              active:scale-[0.98]
              ${state.locale === 'es'
                ? 'bg-[var(--gold-primary)] text-[#121212] shadow-[0_0_14px_rgba(212,175,55,0.3)]'
                : 'bg-[var(--bg-card)] border border-[var(--border-default)] text-[#888888] hover:border-[var(--gold-secondary)] hover:text-white'
              }
            `}
          >
            <span className="text-[18px] leading-none">🇪🇸</span>
            Español
          </button>
        </div>
      </div>

      {/* Divider between language selector and biometric form */}
      <div className="w-full h-[1px] bg-[#1e1e1e] mb-7" />

      {/* ── IDENTITY CAPTURE ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="font-bebas text-[18px] md:text-xl mb-4 tracking-wide text-white uppercase">
          {state.locale === 'es' ? 'Tu Identidad' : 'Your Identity'}
        </h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label htmlFor="name-input" className="font-sans font-semibold text-[13px] text-[#888888] uppercase tracking-[0.1em] mb-2">
              {state.locale === 'es' ? 'Nombre / Cómo te llamamos' : 'First Name / What should we call you?'}
            </label>
            <input
              id="name-input"
              type="text"
              placeholder={state.locale === 'es' ? 'Ej. Alex' : 'e.g. Alex'}
              value={state.name || ''}
              onChange={(e) => updateState({ name: e.target.value })}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-default)] focus:border-[var(--border-selected)] text-white rounded-[var(--border-radius-input)] px-4 py-3 outline-none font-sans transition-colors"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="email-input" className="font-sans font-semibold text-[13px] text-[#888888] uppercase tracking-[0.1em] mb-2">
              {state.locale === 'es' ? 'Correo Electrónico' : 'Email Address'}
            </label>
            <input
              id="email-input"
              type="email"
              placeholder={state.locale === 'es' ? 'tu@correo.com' : 'you@email.com'}
              value={state.email || ''}
              onChange={(e) => {
                const val = e.target.value;
                updateState({ email: val });
                if (val && !isValidEmail(val)) {
                  setEmailError(state.locale === 'es' ? 'Por favor, introduce un correo electrónico válido.' : 'Please enter a valid email address.');
                } else {
                  setEmailError(null);
                }
              }}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-default)] focus:border-[var(--border-selected)] text-white rounded-[var(--border-radius-input)] px-4 py-3 outline-none font-sans transition-colors"
            />
            {emailError && (
              <p className="text-[#e05252] font-sans text-[12px] mt-2">{emailError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Divider between identity and biometric form */}
      <div className="w-full h-[1px] bg-[#1e1e1e] mb-7" />

      {/* ── BIOMETRIC INPUTS ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="font-bebas text-[18px] md:text-xl mb-4 tracking-wide text-white uppercase">
          {t('step1.title')}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label htmlFor="sex-select" className="font-sans font-semibold text-[13px] text-[#888888] uppercase tracking-[0.1em] mb-2">
              {t('step1.sexLabel')}
            </label>
            <div className="relative">
              <select
                id="sex-select"
                value={state.sex || ''}
                onChange={(e) => updateState({ sex: e.target.value as 'male' | 'female' })}
                className="w-full appearance-none bg-[var(--bg-card)] border border-[var(--border-default)] focus:border-[var(--border-selected)] text-white rounded-[var(--border-radius-input)] px-4 py-3 outline-none font-sans transition-colors cursor-pointer"
              >
                <option value="" disabled>{t('step1.sexSelect')}</option>
                <option value="male">{t('step1.sexMale')}</option>
                <option value="female">{t('step1.sexFemale')}</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--gold-primary)]">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <label htmlFor="age-input" className="font-sans font-semibold text-[13px] text-[#888888] uppercase tracking-[0.1em] mb-2">
              {t('step1.ageLabel')}
            </label>
            <input
              id="age-input"
              type="number"
              placeholder="--"
              value={state.age || ''}
              onChange={(e) => updateState({ age: e.target.value ? parseInt(e.target.value, 10) : null })}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-default)] focus:border-[var(--border-selected)] text-white rounded-[var(--border-radius-input)] px-4 py-3 outline-none font-sans transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
        {error && (
          <p className="text-[#e05252] font-sans text-[12px] mt-2">{error}</p>
        )}
      </div>

      <div className="w-full h-[1px] bg-[#2e2e2e] mb-8" />

      {/* ── PERSONA TILES ─────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="font-bebas text-2xl tracking-wide text-white mb-1">{t('step1.whoAreYou')}</h2>
        <p className="font-sans text-[15px] text-[#888888]">{t('step1.whoAreYouDesc')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {PERSONAS.map((p) => {
          const isSelected = state.persona === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handlePersonaClick(p.id as OnboardingState['persona'])}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePersonaClick(p.id as OnboardingState['persona']);
                }
              }}
              className={`
                flex flex-col items-start p-5 rounded-[var(--border-radius-card)]
                text-left transition-all duration-[200ms] ease-in-out outline-none
                focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]
                active:scale-[0.98]
                ${isSelected
                  ? 'bg-[var(--bg-card-selected)] border-2 border-[var(--gold-primary)] shadow-[0_0_12px_rgba(212,175,55,0.25)]'
                  : 'bg-[var(--bg-card)] border border-[var(--border-default)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--gold-secondary)]'
                }
              `}
              role="button"
              tabIndex={0}
            >
              <div className={`mb-3 ${isSelected ? 'text-[var(--gold-primary)]' : 'text-[#888888]'}`}>
                {p.icon}
              </div>
              <h3 className={`font-bebas text-xl tracking-wide uppercase mb-1 ${
                isSelected ? 'text-[var(--gold-primary)]' : 'text-white'
              }`}>
                {p.label}
              </h3>
              <p className="font-sans text-[13px] text-[#888888] leading-snug">{p.desc}</p>
            </button>
          );
        })}
      </div>

      <button
        disabled={!isFormValid}
        onClick={() => updateState({ currentStep: 2 })}
        className={`
          w-full py-4 rounded-[var(--border-radius-input)] font-sans font-bold
          uppercase tracking-[0.15em] text-[15px] transition-all duration-200
          ${isFormValid
            ? 'bg-[var(--gold-primary)] text-[#121212] hover:bg-[var(--gold-secondary)] hover:-translate-y-[1px] shadow-[0_4px_12px_rgba(212,175,55,0.2)]'
            : 'bg-[var(--bg-card)] text-[var(--text-dim)] pointer-events-none'
          }
        `}
      >
        {t('step1.continueBtn')}
      </button>
    </div>
  );
}
