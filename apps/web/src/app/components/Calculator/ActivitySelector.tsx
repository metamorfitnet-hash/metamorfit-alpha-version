"use client";

import React from "react";
import { ActivityLevel } from "@/types/calculator";

interface ActivitySelectorProps {
  value: ActivityLevel;
  onChange: (value: ActivityLevel) => void;
  error?: string;
}

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: "sedentary", label: "Sedentary", description: "Office job / no exercise" },
  { value: "light", label: "Light", description: "1–2 days / week" },
  { value: "moderate", label: "Moderate", description: "3–5 days / week" },
  { value: "active", label: "Active", description: "6–7 days / week" },
  { value: "very_active", label: "Very Active", description: "Physical job / 2x daily" },
];

export function ActivitySelector({ value, onChange, error }: ActivitySelectorProps) {
  return (
    <div className="flex flex-col space-y-2 group/activity">
      <label className="text-[15px] font-medium text-mm-bone/60 uppercase tracking-[0.15em] group-focus-within/activity:text-mm-gold transition-colors duration-500">
        Activity Profile
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as ActivityLevel)}
          className={`
            bg-mm-black border rounded-xl px-4 py-3.5 text-mm-bone text-base 
            focus:border-mm-gold outline-none w-full transition-all duration-300
            appearance-none cursor-pointer shadow-inner
            ${error ? "border-red-500/50" : "border-mm-dark group-hover/activity:border-mm-dark/80"}
          `}
        >
          {ACTIVITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} — {opt.description}
            </option>
          ))}
        </select>
        {/* Custom Chevron handled via CSS or SVG if needed, keeping simple for now */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30 group-focus-within/activity:text-mm-gold group-focus-within/activity:opacity-100 transition-all">
          ▼
        </div>
      </div>
      {error && <span className="text-[10px] text-red-400 mt-1 uppercase tracking-wider animate-fadeIn">{error}</span>}
    </div>
  );
}
