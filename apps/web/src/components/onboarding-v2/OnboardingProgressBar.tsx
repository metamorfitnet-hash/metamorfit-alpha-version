import React from 'react';

interface Props {
  currentStep: number;
  totalSteps: number;
  isCalibrating?: boolean;
}

export default function OnboardingProgressBar({ currentStep, totalSteps, isCalibrating }: Props) {
  const percentage = isCalibrating ? 100 : (totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0);

  return (
    <div className="w-full pt-4">
      <div className="flex justify-between items-end mb-2">
        <div /> {/* Placeholder for layout balance if needed */}
        <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          STEP {currentStep} OF {totalSteps}
        </div>
      </div>
      
      <div 
        className="w-full rounded-full relative overflow-hidden h-1 bg-[#2e2e2e]"
        role="progressbar"
        aria-label="Onboarding progress"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div 
          className={`absolute top-0 left-0 h-full rounded-full bg-[var(--gold-primary)] transition-[width] ${isCalibrating ? 'animate-shimmer-v2 duration-[600ms] ease-[ease]' : 'duration-[400ms] ease-[ease]'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
