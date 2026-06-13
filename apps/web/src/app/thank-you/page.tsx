'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import '@/i18n';

export default function ThankYouPage() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const saved = (localStorage.getItem('i18nextLng') || 'en').substring(0, 2);
    if (saved && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    }
  }, [i18n]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.section-fade');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('mm_uid');
    if (!userId) {
      setIsPolling(false);
      return;
    }

    const workerUrl = process.env.NEXT_PUBLIC_WORKER_A_URL || 'https://metamorfit-worker-alpha.metamorfitnet.workers.dev';
    const baseUrl = (workerUrl.endsWith('/') ? workerUrl.slice(0, -1) : workerUrl) + '/api';
    const UI_SECRET = process.env.NEXT_PUBLIC_MM_UI_SECRET || 'meta_alpha_sec_a7c2e9f1b3d8k9m_42891_abc';

    const checkStatus = async () => {
      try {
        const res = await fetch(`${baseUrl}/ledger/${userId}`, {
          headers: {
            'Authorization': `Bearer ${UI_SECRET}`,
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.results?.pdfUrl) {
            setPdfUrl(data.results.pdfUrl);
            setIsPolling(false);
          } else if (data.status === 'delivered') {
            setIsPolling(false); // PDF generated but no URL saved?
          }
        }
      } catch (err) {
        console.error("Error polling for PDF status:", err);
      }
    };

    // Initial check
    checkStatus();

    // Poll every 3 seconds if not ready
    const interval = setInterval(() => {
      if (isPolling) checkStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [isPolling]);

  return (
    <>
      <style>{`
        .opacity-0-init { opacity: 0; }
        .shimmer-line {
          background: linear-gradient(90deg, transparent 0%, #c9a84c 40%, #e8c96a 50%, #c9a84c 60%, transparent 100%);
          background-size: 200% auto;
        }
        .noise-overlay::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
        }
        .section-fade { opacity: 0; transform: translateY(20px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .section-fade.visible { opacity: 1; transform: translateY(0); }
        
        @keyframes fadeInUpCustom {
          0% { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerLine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .animate-fadeInUp-0 { animation: fadeInUpCustom 0.6s ease-out forwards; }
        .animate-fadeInUp-1 { animation: fadeInUpCustom 0.6s ease-out 0.1s forwards; }
        .animate-fadeInUp-2 { animation: fadeInUpCustom 0.6s ease-out 0.2s forwards; }
        .animate-fadeInUp-3 { animation: fadeInUpCustom 0.6s ease-out 0.3s forwards; }
        
        .animate-shimmerLine { animation: shimmerLine 2.5s linear infinite; }
        .animate-spin-slow { animation: spinSlow 2s linear infinite; }
        .hero-glow {
          background: radial-gradient(circle at center, rgba(201,168,76,0.18), transparent 70%);
          transform: scale(1.6);
        }
      `}</style>
      <div className="bg-mm-black font-sans text-mm-bone antialiased noise-overlay min-h-screen">
        <main className="relative z-10 min-h-screen w-full flex flex-col items-center overflow-x-hidden">

          {/* ════════════════════════════════════════════════ */}
          {/* BLOCK 1 — HERO                                  */}
          {/* ════════════════════════════════════════════════ */}
          <section className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl px-4 md:px-8 lg:px-12 py-12 md:py-16 lg:py-20 flex flex-col items-center text-center gap-6 section-fade" id="hero">

            {/* Photo Frame */}
            <div className="relative mb-4">
              <div className="relative w-[140px] h-[140px] md:w-[180px] md:h-[180px] overflow-hidden rounded-[12px] border border-mm-gold/15 bg-mm-dark/70">
                <Image
                  src="/logo.jpg"
                  alt={t('thankYou.photoAlt', 'Metamorfit logo')}
                  fill
                  sizes="(max-width: 768px) 140px, 180px"
                  className="object-cover object-center"
                  priority
                />
              </div>
            </div>

            {/* Eyebrow */}
            <p className="opacity-0-init animate-fadeInUp-0 font-sans font-light tracking-[0.25em] text-xs md:text-sm text-mm-gold uppercase">
              {t('thankYou.eyebrow', 'Metamorfit Web App')}
            </p>

            {/* Headline */}
            <h1 className="opacity-0-init animate-fadeInUp-1 font-display text-4xl md:text-5xl lg:text-6xl leading-none tracking-wide text-mm-bone uppercase !mb-0">
              {t('thankYou.headlineLine1', 'Your Personalized')}<br />
              <span className="text-mm-gold">{t('thankYou.headlineLine2', 'Meal Plan')}</span><br />
              {t('thankYou.headlineLine3', 'Is On Its Way.')}
            </h1>

            {/* Subheadline */}
            <p className="opacity-0-init animate-fadeInUp-2 font-serif italic text-base md:text-lg lg:text-xl text-mm-bone/80 max-w-prose">
              {t('thankYou.subheadline', 'You didn\'t just run a calculator. You took the first step toward eating with precision — and that\'s exactly how real transformation starts.')}
            </p>

            {/* Divider */}
            <div className="w-16 h-px shimmer-line animate-shimmerLine opacity-60 mt-2"></div>

          </section>

          {/* Shimmer Divider */}
          <div className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl px-4 md:px-8 lg:px-12">
            <div className="h-px w-full shimmer-line animate-shimmerLine opacity-30"></div>
          </div>

          {/* ════════════════════════════════════════════════ */}
          {/* BLOCK 2 — DOWNLOAD ACCESS                       */}
          {/* ════════════════════════════════════════════════ */}
          <section className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl px-4 md:px-8 lg:px-12 py-10 md:py-12 lg:py-14 flex flex-col items-center text-center gap-5 section-fade" id="download">
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl tracking-wide text-mm-bone uppercase !mb-0">
              {t('thankYou.checkInboxTitle', 'Check Your Inbox')}
            </h2>
            <p className="font-sans font-light text-sm md:text-base text-mm-bone/65 max-w-prose leading-relaxed !mb-0">
              {t('thankYou.checkInboxBody', 'Your PDF meal plan is being delivered right now. Open it, review your daily macro targets, and start applying it today. The numbers are built around your body — trust the precision.')}
            </p>
            
            {pdfUrl ? (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download your personalized meal plan PDF"
                className="mt-1 flex w-full md:w-auto justify-center items-center gap-3 px-7 h-[52px] md:h-14 bg-mm-gold text-mm-black font-sans font-medium text-sm md:text-base tracking-widest uppercase transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(201,168,76,0.25)] active:translate-y-0 no-underline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v11" />
                </svg>
                {t('thankYou.downloadButton', 'Download Your Plan')}
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="mt-1 flex w-full md:w-auto justify-center items-center gap-3 px-7 h-[52px] md:h-14 border border-mm-gold/40 text-mm-gold/60 bg-transparent font-sans font-medium text-sm md:text-base tracking-widest uppercase cursor-not-allowed opacity-80 transition-all duration-200"
              >
                <svg className="animate-spin-slow h-4 w-4 text-mm-gold/60 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('thankYou.generatingLabel', 'Generating PDF...')}
              </button>
            )}
            <p className="font-sans font-light text-xs md:text-sm text-mm-bone/40 tracking-wide !mb-0">
              {t('thankYou.emailTip', 'Don\'t see it? Check your spam or promotions folder — it\'s there.')}
            </p>
          </section>

          {/* Shimmer Divider */}
          <div className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl px-4 md:px-8 lg:px-12">
            <div className="h-px w-full shimmer-line animate-shimmerLine opacity-30"></div>
          </div>


          {/* ════════════════════════════════════════════════ */}
          {/* FOOTER                                          */}
          {/* ════════════════════════════════════════════════ */}
          <footer className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl px-4 md:px-8 lg:px-12 pb-10 flex flex-col items-center gap-3">
            <div className="h-px w-full shimmer-line animate-shimmerLine opacity-20 mb-4"></div>
            <p className="font-display text-lg tracking-widest text-mm-gold !mb-0">METAMORFIT</p>
            <p className="font-sans font-light text-xs text-mm-bone/25 tracking-wide text-center !mb-0">
              Science-Backed Transformation for Natural Lifters &nbsp;·&nbsp; © 2025 Metamorfit
            </p>
          </footer>

        </main>
      </div>
    </>
  );
}
