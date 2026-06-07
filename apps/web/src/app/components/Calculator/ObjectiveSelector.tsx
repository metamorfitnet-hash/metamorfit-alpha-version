"use client";

import React from "react";
import { Goal } from "@/types/calculator";

interface ObjectiveSelectorProps {
  value: Goal;
  onChange: (value: Goal) => void;
}

const GOAL_CONFIG: Record<Goal, string> = {
  cut: "Accelerate transformation with a precise caloric deficit.",
  maintain: "Maintain peak physical state with perfectly balanced intake.",
  bulk: "Fuel structural growth with a calculated caloric surplus.",
  recomp: "Build muscle while losing fat with targeted nutrient partitioning.",
};

export function ObjectiveSelector({ value, onChange }: ObjectiveSelectorProps) {
  return (
    <div className="flex flex-col space-y-4 pt-0.5">
      <h3 className="text-center md:text-left text-mm-bone/80 tracking-[0.2em] text-xl font-heading uppercase">
        Select Your Objective
      </h3>
      <div className="grid grid-cols-2 gap-3 p-1.5 bg-mm-black/60 rounded-2xl border border-white/5 shadow-inner">
        {(["maintain", "cut", "bulk", "recomp"] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            className={`
              py-2.5 rounded-xl font-heading tracking-[0.1em] text-lg uppercase 
              transition-all duration-300 hover:scale-[1.03] active:scale-95 group relative overflow-hidden
              ${value === g 
                ? "bg-mm-gold text-mm-black shadow-xl shadow-mm-gold/30" 
                : "text-mm-bone/30 hover:text-mm-bone hover:bg-white/5"}
            `}
          >
            {value === g && (
              <div className="absolute inset-0 bg-white/10 pointer-events-none" />
            )}
            <span className="relative z-10">{g}</span>
          </button>
        ))}
      </div>
      <p className="text-center md:text-left text-sm text-mm-bone/40 italic font-body leading-relaxed max-w-lg mx-auto md:mx-0 min-h-[40px] animate-fadeIn">
        {GOAL_CONFIG[value]}
      </p>
    </div>
  );
}
