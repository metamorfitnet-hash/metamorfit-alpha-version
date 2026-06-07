"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DM_Serif_Display } from "next/font/google";
import { Header } from "@/components/Header";

const dmSerif = DM_Serif_Display({
  weight: "400",
  style: "italic",
  subsets: ["latin"],
});

type StepData = {
  num: string;
  title: string;
  desc: string;
  delay: string;
};

function StepCard({ step }: { step: StepData }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.animationDelay = step.delay;
    }
  }, [step.delay]);

  return (
    <div className="lp-step-card" ref={cardRef}>
      <div className="step-num">{step.num}</div>
      <div>
        <div className="step-title">{step.title}</div>
        <div className="step-desc">{step.desc}</div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();


  return (
    <div className="landing-page-wrapper min-h-screen selection:bg-lp-gold/30">
      {/* Ambient radial glow behind hero */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[640px] h-[420px] bg-[radial-gradient(ellipse,_rgba(212,175,55,0.065)_0%,_transparent_68%)] pointer-events-none" />

      {/* HEADER */}
      <Header variant="landing" />

      {/* MAIN */}
      <main className="flex-1 flex flex-col items-center px-[clamp(1.25rem,5vw,3rem)] py-[clamp(2.5rem,5vh,4.5rem)] pb-[clamp(2rem,4vh,3.5rem)] relative content-wrapper">
        <div className="w-full max-w-[540px] flex flex-col items-center gap-[clamp(2rem,4vh,3.5rem)]">

          {/* HERO */}
          <section className="text-center w-full animate-lp-fade-up">
            <p className="inline-flex items-center gap-[0.6rem] text-[0.63rem] tracking-[0.24em] uppercase text-lp-gold mb-[1.1rem] before:content-[''] before:w-[20px] before:h-[1px] before:bg-lp-gold-mid after:content-[''] after:w-[20px] after:h-[1px] after:bg-lp-gold-mid">
              Personalized Transformation
            </p>

            <h1 className="font-bebas text-[clamp(2.8rem,10vw,5.2rem)] leading-[0.9] tracking-[0.04em] text-lp-cream mb-[1.1rem]">
              Your Body.<br />
              Your Data.<br />
              <em className={`${dmSerif.className} not-italic text-lp-gold block`}>Your Plan.</em>
            </h1>

            <p className={`${dmSerif.className} italic text-[clamp(0.9rem,2.2vw,1.05rem)] text-lp-cream-dim leading-[1.55] max-w-[420px] mx-auto mb-[1.8rem]`}>
              Metamorfit is a science-backed system for natural lifters who are done guessing.
              Enter your biometrics, get precision macros, and receive a plan built entirely around you.
            </p>

            <Link href="/onboarding-v2" className="lp-btn-primary cursor-pointer">
              Start My Plan
            </Link>

            <div className="flex items-center justify-center gap-[1.4rem] mt-[1.4rem] flex-wrap">
              <span className="flex items-center gap-[0.45rem] text-[0.65rem] tracking-[0.1em] uppercase text-lp-muted before:content-[''] before:w-[4px] before:h-[4px] before:rounded-full before:bg-lp-gold">
                Evidence-based
              </span>
              <span className="flex items-center gap-[0.45rem] text-[0.65rem] tracking-[0.1em] uppercase text-lp-muted before:content-[''] before:w-[4px] before:h-[4px] before:rounded-full before:bg-lp-gold">
                AI-assisted
              </span>
              <span className="flex items-center gap-[0.45rem] text-[0.65rem] tracking-[0.1em] uppercase text-lp-muted before:content-[''] before:w-[4px] before:h-[4px] before:rounded-full before:bg-lp-gold">
                Zero guesswork
              </span>
            </div>
          </section>

          {/* DIVIDER */}
          <div className="w-full flex items-center gap-[0.9rem] animate-lp-fade-in [animation-delay:300ms]">
            <div className="flex-1 h-[1px] bg-lp-line" />
            <span className="text-[0.62rem] tracking-[0.2em] uppercase text-lp-muted whitespace-nowrap">
              Your Transformation Roadmap
            </span>
            <div className="flex-1 h-[1px] bg-lp-line" />
          </div>

          {/* STEPS */}
          <div className="w-full flex flex-col gap-[0.5rem]" id="steps">
            {[
              { num: '01', title: 'Choose Your Body Type', desc: 'Ectomorph, mesomorph, or endomorph — your somatotype shapes every calculation that follows.', delay: '300ms' },
              { num: '02', title: 'Enter Your Biometrics', desc: 'Age, height, weight, and activity level feed the Mifflin-St Jeor formula for a precise caloric baseline.', delay: '400ms' },
              { num: '03', title: 'Get Your Macro Targets', desc: 'Protein, carbs, and fat are split to match your goal — structured bulk, lean cut, or body recomp.', delay: '500ms' },
              { num: '04', title: 'Build Your Meal Plan with AI', desc: 'AI estimates nutrition in real time and assembles your daily structure around your exact targets.', delay: '600ms' },
              { num: '05', title: 'Download Your Personalized PDF', desc: 'Your complete plan exports as a formatted PDF — macro targets, meals, and daily totals in one document.', delay: '700ms' },
            ].map((step, i) => (
              <StepCard key={i} step={step} />
            ))}
          </div>

          {/* CONTINUE */}
          <div className="w-full flex flex-col items-center gap-[0.85rem] opacity-0 animate-lp-fade-up [animation-delay:850ms]">
            <Link href="/onboarding-v2" className="lp-btn-continue cursor-pointer border-none flex items-center justify-center">
              Continue
            </Link>
            <p className="text-[0.66rem] text-lp-muted tracking-[0.06em] text-center">
              Takes less than 3 minutes &nbsp;·&nbsp; No account required
            </p>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-lp-header-bg border-t border-lp-line h-[42px] flex items-center justify-between px-[clamp(1.25rem,5vw,3rem)] shrink-0 animate-lp-fade-in [animation-delay:900ms]">
        <div className="font-bebas text-[1rem] tracking-[0.13em] text-lp-gold">
          Metamorfit
        </div>
        <div className={`hidden md:block italic text-[0.72rem] text-lp-muted ${dmSerif.className}`}>
          Discipline. Data. Results.
        </div>
        <div className="text-[0.62rem] tracking-[0.06em] text-lp-muted">
          © 2025 Metamorfit
        </div>
      </footer>

    </div>
  );
}
