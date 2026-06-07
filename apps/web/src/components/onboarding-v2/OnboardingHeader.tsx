import React from 'react';
import { useTranslation } from 'react-i18next';

export default function OnboardingHeader() {
  const { t } = useTranslation();
  return (
    <div className="w-full flex flex-col items-center text-center pb-6">
      <div 
        className="px-3 py-1 mb-6 rounded-full border text-[11px] font-semibold tracking-[0.15em] uppercase border-[var(--gold-primary)] text-[var(--gold-primary)] bg-transparent"
      >
        {t('header.badge')}
      </div>
      
      <h1 className="font-bebas text-[48px] md:text-[64px] uppercase leading-[0.9] tracking-tighter mb-4 flex flex-col">
        <span className="text-[var(--text-primary)]">{t('header.title1')}</span>
        <span className="text-[var(--gold-primary)]">{t('header.title2')}</span>
      </h1>
      
      <p 
        className="max-w-[580px] text-[16px] md:text-[18px] mx-auto leading-relaxed text-[var(--text-muted)]"
      >
        {t('header.subtitle')}
      </p>
    </div>
  );
}
