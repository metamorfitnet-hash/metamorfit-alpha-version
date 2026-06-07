'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ThankYouPage() {
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

    const workerUrl = process.env.NEXT_PUBLIC_WORKER_A_URL || 'https://metamorfit-worker-beta.metamorfitnet.workers.dev';
    const baseUrl = (workerUrl.endsWith('/') ? workerUrl.slice(0, -1) : workerUrl) + '/api';
    const UI_SECRET = process.env.NEXT_PUBLIC_MM_UI_SECRET || 'meta_beta_sec_994a8f9c2d1b73e_74561_xyz';

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
              <div className="relative w-[140px] h-[140px] md:w-[180px] md:h-[180px] overflow-hidden rounded-[12px]">
                <Image 
                  src="/felipe.jpg" 
                  alt="Felipe — Founder, Metamorfit" 
                  fill 
                  className="object-cover object-top"
                  priority
                />
              </div>
            </div>

            {/* Eyebrow */}
            <p className="opacity-0-init animate-fadeInUp-0 font-sans font-light tracking-[0.25em] text-xs md:text-sm text-mm-gold uppercase">
              Metamorfit Web App
            </p>

            {/* Headline */}
            <h1 className="opacity-0-init animate-fadeInUp-1 font-display text-4xl md:text-5xl lg:text-6xl leading-none tracking-wide text-mm-bone uppercase !mb-0">
              Your Personalized<br />
              <span className="text-mm-gold">Meal Plan</span><br />
              Is On Its Way.
            </h1>

            {/* Subheadline */}
            <p className="opacity-0-init animate-fadeInUp-2 font-serif italic text-base md:text-lg lg:text-xl text-mm-bone/80 max-w-prose">
              You didn&apos;t just run a calculator. You took the first step toward eating with precision — and that&apos;s exactly how real transformation starts.
            </p>

            {/* Divider */}
            <div className="w-16 h-px shimmer-line animate-shimmerLine opacity-60 mt-2"></div>

            {/* Credibility Blurb */}
            <p className="opacity-0-init animate-fadeInUp-3 font-sans font-light text-sm md:text-base text-mm-bone/60 max-w-prose leading-relaxed !mb-0">
              I&apos;m <span className="text-mm-bone font-medium">Felipe</span> — natural ectomorph, bulking specialist, and founder of Metamorfit. I built this system after years of frustration: training hard, eating more than people believed, and still seeing nothing change. The answer wasn&apos;t more volume. It was understanding my biology — digestion, recovery, hormonal balance — and building a protocol around it. Metamorfit is the system I wish I&apos;d had. Now it&apos;s yours.
            </p>

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
              Check Your Inbox
            </h2>
            <p className="font-sans font-light text-sm md:text-base text-mm-bone/65 max-w-prose leading-relaxed !mb-0">
              Your PDF meal plan is being delivered right now. Open it, review your daily macro targets, and start applying it today. The numbers are built around your body — trust the precision.
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
                Download Your Plan
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
                Generating PDF...
              </button>
            )}
            <p className="font-sans font-light text-xs md:text-sm text-mm-bone/40 tracking-wide !mb-0">
              Don&apos;t see it? Check your spam or promotions folder — it&apos;s there.
            </p>
          </section>

          {/* Shimmer Divider */}
          <div className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl px-4 md:px-8 lg:px-12">
            <div className="h-px w-full shimmer-line animate-shimmerLine opacity-30"></div>
          </div>

          {/* ════════════════════════════════════════════════ */}
          {/* BLOCK 3 — WHAT HAPPENS NEXT                     */}
          {/* ════════════════════════════════════════════════ */}
          <section className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl px-4 md:px-8 lg:px-12 py-10 md:py-12 lg:py-14 flex flex-col gap-6 section-fade" id="next-steps">
            <div className="flex flex-col gap-1">
              <p className="font-sans font-light tracking-[0.2em] text-xs text-mm-gold uppercase !mb-0">What to do now</p>
              <h2 className="font-display text-2xl md:text-3xl lg:text-4xl tracking-wide text-mm-bone uppercase !mb-0">What Happens Next</h2>
            </div>
            <ul className="flex flex-col gap-5 m-0 p-0">
              <li className="flex gap-4 items-start">
                <span className="shrink-0 w-7 h-7 rounded-full border border-mm-gold/40 flex items-center justify-center font-display text-sm text-mm-gold mt-0.5">01</span>
                <div>
                  <p className="font-sans font-medium text-sm md:text-base text-mm-bone mb-0.5">Open your plan and review your macro targets.</p>
                  <p className="font-sans font-light text-sm text-mm-bone/55 leading-relaxed !mb-0">Protein is your priority — hit that number first, every single day. The rest builds around it.</p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <span className="shrink-0 w-7 h-7 rounded-full border border-mm-gold/40 flex items-center justify-center font-display text-sm text-mm-gold mt-0.5">02</span>
                <div>
                  <p className="font-sans font-medium text-sm md:text-base text-mm-bone mb-0.5">Structure your eating for the next 7 days.</p>
                  <p className="font-sans font-light text-sm text-mm-bone/55 leading-relaxed !mb-0">Consistency in the first week matters more than perfection. Set your meals, then execute.</p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <span className="shrink-0 w-7 h-7 rounded-full border border-mm-gold/40 flex items-center justify-center font-display text-sm text-mm-gold mt-0.5">03</span>
                <div>
                  <p className="font-sans font-medium text-sm md:text-base text-mm-bone mb-0.5">Expect a follow-up within 24 hours.</p>
                  <p className="font-sans font-light text-sm text-mm-bone/55 leading-relaxed !mb-0">You&apos;ll receive additional guidance on how to track, adjust, and optimize your intake as your body adapts.</p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <span className="shrink-0 w-7 h-7 rounded-full border border-mm-gold/40 flex items-center justify-center font-display text-sm text-mm-gold mt-0.5">04</span>
                <div>
                  <p className="font-sans font-medium text-sm md:text-base text-mm-bone mb-0.5">This plan is your foundation.</p>
                  <p className="font-sans font-light text-sm text-mm-bone/55 leading-relaxed !mb-0">The Metamorfit Web App — launching soon — will be the system that tracks, adapts, and holds your nutrition to a higher standard.</p>
                </div>
              </li>
            </ul>
          </section>

          {/* Shimmer Divider */}
          <div className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl px-4 md:px-8 lg:px-12">
            <div className="h-px w-full shimmer-line animate-shimmerLine opacity-30"></div>
          </div>

          {/* ════════════════════════════════════════════════ */}
          {/* BLOCK 4 — IDENTITY-BASED ENCOURAGEMENT         */}
          {/* ════════════════════════════════════════════════ */}
          <section className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl px-4 md:px-8 lg:px-12 py-10 md:py-12 lg:py-14 flex flex-col items-center text-center gap-5 section-fade" id="identity">
            <span className="font-serif text-6xl md:text-8xl text-mm-gold/15 leading-none select-none">&quot;</span>
            <blockquote className="font-serif italic text-lg md:text-2xl lg:text-3xl text-mm-bone/85 max-w-prose leading-relaxed -mt-6 border-none m-0 p-0 text-center">
              You didn&apos;t guess today. You didn&apos;t scroll another thread hoping someone would tell you what to eat.
            </blockquote>
            <p className="font-sans font-light text-sm md:text-base text-mm-bone/60 max-w-prose leading-relaxed !mb-0">
              You submitted your data. You ran the numbers. You built a plan. That&apos;s not something everyone does — that&apos;s discipline expressing itself before the work has even started.
            </p>
            <p className="font-sans font-light text-sm md:text-base text-mm-bone/60 max-w-prose leading-relaxed !mb-0">
              Your body can grow. The biology is workable. What it needs is precision — and you just gave it that.
            </p>
            <p className="font-display text-xl md:text-2xl tracking-widest text-mm-gold uppercase mt-2 !mb-0">
              Hold the Standard.
            </p>
          </section>

          {/* Shimmer Divider */}
          <div className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl px-4 md:px-8 lg:px-12">
            <div className="h-px w-full shimmer-line animate-shimmerLine opacity-30"></div>
          </div>

          {/* ════════════════════════════════════════════════ */}
          {/* BLOCK 5 — WEB APP TEASER                        */}
          {/* ════════════════════════════════════════════════ */}
          <section className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl px-4 md:px-8 lg:px-12 py-10 md:py-12 lg:py-14 flex flex-col gap-6 section-fade" id="app-teaser">
            <div className="flex flex-col gap-1">
              <p className="font-sans font-light tracking-[0.2em] text-xs text-mm-gold uppercase !mb-0">Coming Soon</p>
              <h2 className="font-display text-2xl md:text-3xl lg:text-4xl tracking-wide text-mm-bone uppercase !mb-0">The Full<br className="md:hidden" /> Metamorfit Web App</h2>
            </div>
            <p className="font-sans font-light text-sm md:text-base text-mm-bone/60 max-w-prose leading-relaxed !mb-0">
              Your meal plan is a strong start — but the Web App will take this further than a PDF ever could. Built specifically for natural lifters who want to eat with intention every day.
            </p>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-mm-dark border border-mm-gold/10 p-5 flex flex-col gap-2 hover:border-mm-gold/25 transition-colors duration-300 rounded">
                <div className="w-8 h-8 rounded-full bg-mm-gold/10 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-mm-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.607L5 14.5m14.8.5-2.49-2.49M5 14.5L2.51 12.01" />
                  </svg>
                </div>
                <p className="font-sans font-medium text-sm text-mm-bone !mb-0">AI Nutrition Estimation</p>
                <p className="font-sans font-light text-xs text-mm-bone/50 leading-relaxed !mb-0">Log meals by description — no barcode scanning, no guesswork. Intelligent, fast, and built for real eating patterns.</p>
              </div>

              <div className="bg-mm-dark border border-mm-gold/10 p-5 flex flex-col gap-2 hover:border-mm-gold/25 transition-colors duration-300 rounded">
                <div className="w-8 h-8 rounded-full bg-mm-gold/10 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-mm-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                  </svg>
                </div>
                <p className="font-sans font-medium text-sm text-mm-bone !mb-0">Dynamic Meal Planning</p>
                <p className="font-sans font-light text-xs text-mm-bone/50 leading-relaxed !mb-0">Meal plans structured around your macros, goals, and food preferences — and updated as your targets evolve.</p>
              </div>

              <div className="bg-mm-dark border border-mm-gold/10 p-5 flex flex-col gap-2 hover:border-mm-gold/25 transition-colors duration-300 rounded">
                <div className="w-8 h-8 rounded-full bg-mm-gold/10 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-mm-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <p className="font-sans font-medium text-sm text-mm-bone !mb-0">Macro Tracking</p>
                <p className="font-sans font-light text-xs text-mm-bone/50 leading-relaxed !mb-0">Daily targets with clear visual feedback. Know exactly where you stand — protein, fat, carbs — at any point in the day.</p>
              </div>

              <div className="bg-mm-dark border border-mm-gold/10 p-5 flex flex-col gap-2 hover:border-mm-gold/25 transition-colors duration-300 rounded">
                <div className="w-8 h-8 rounded-full bg-mm-gold/10 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-mm-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                  </svg>
                </div>
                <p className="font-sans font-medium text-sm text-mm-bone !mb-0">Progressive Accountability</p>
                <p className="font-sans font-light text-xs text-mm-bone/50 leading-relaxed !mb-0">A system that adapts as your body evolves — not a static tracker, but infrastructure for sustained, intentional growth.</p>
              </div>
            </div>

            <p className="font-sans font-light text-sm text-mm-bone/45 max-w-prose italic !mb-0">
              This isn&apos;t another calorie counter. It&apos;s infrastructure for serious natural lifters.
            </p>
          </section>

          {/* Shimmer Divider */}
          <div className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl px-4 md:px-8 lg:px-12">
            <div className="h-px w-full shimmer-line animate-shimmerLine opacity-30"></div>
          </div>

          {/* ════════════════════════════════════════════════ */}
          {/* BLOCK 6 — SOFT CTA                              */}
          {/* ════════════════════════════════════════════════ */}
          <section className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl px-4 md:px-8 lg:px-12 py-10 md:py-12 lg:py-14 flex flex-col items-center text-center gap-5 section-fade" id="soft-cta">
            <p className="font-sans font-light tracking-[0.2em] text-xs text-mm-gold uppercase !mb-0">Stay in the Loop</p>
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl tracking-wide text-mm-bone uppercase !mb-0">
              The System Is Being Built.<br />
              <span className="text-mm-gold">Be First In.</span>
            </h2>
            <p className="font-sans font-light text-sm md:text-base text-mm-bone/55 max-w-prose leading-relaxed !mb-0">
              Follow Metamorfit for science-backed content on bulking, digestion, recovery, and natural muscle growth — and be first to know when the Web App launches.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link
                href="#"
                aria-label="Follow Metamorfit on Instagram"
                className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 h-12 md:h-14 border border-mm-gold/40 text-mm-bone font-sans font-light text-sm tracking-widest uppercase transition-all duration-200 hover:-translate-y-0.5 hover:border-mm-gold hover:text-mm-gold no-underline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                Instagram
              </Link>
              <Link
                href="#"
                aria-label="Join the Metamorfit Web App waitlist"
                className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 h-12 md:h-14 bg-mm-gold text-mm-black font-sans font-medium text-sm tracking-widest uppercase transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(201,168,76,0.25)] no-underline"
              >
                Join the Waitlist
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            <p className="font-sans font-light text-xs text-mm-bone/30 tracking-widest uppercase mt-1 !mb-0">
              No spam. No hype. Just the system.
            </p>
          </section>

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
