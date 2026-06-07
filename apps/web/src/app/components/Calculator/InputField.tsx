"use client";

import React from "react";

interface InputFieldProps {
  label: string;
  type: "number" | "text";
  value: number | string;
  onChange: (value: string) => void;
  error?: string;
  suffix?: string;
  placeholder?: string;
  labelAside?: string;
  disabled?: boolean;
}

export function InputField({
  label,
  type,
  value,
  onChange,
  error,
  suffix,
  placeholder,
  labelAside,
  disabled,
}: InputFieldProps) {
  return (
    <div className="flex flex-col group/input">
      <div className="h-12 flex items-end justify-between pb-2">
        <label className="text-[15px] font-medium text-mm-bone/60 uppercase tracking-[0.15em] group-focus-within/input:text-mm-gold transition-colors duration-500">
          {label}
          {suffix && <span className="text-[10px] ml-1 opacity-40 lowercase">({suffix})</span>}
        </label>
        {labelAside && (
          <span className="text-mm-bone/70 font-heading tracking-[0.15em] text-2xl uppercase">
            {labelAside}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type={type}
          value={value === 0 ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            bg-mm-black border rounded-xl px-4 py-3 text-mm-bone text-base 
            focus:border-mm-gold outline-none w-full transition-all duration-500
            placeholder:opacity-20 shadow-inner
            ${disabled ? "opacity-20 cursor-not-allowed border-mm-dark" : "cursor-text"}
            ${error ? "border-red-500/50" : "border-mm-dark group-hover/input:border-mm-dark/80"}
          `}
        />
        {/* Subtle inner glow on focus handled by transition-all duration-500 and border */}
      </div>
      {error && <span className="text-[10px] text-red-400 mt-1 uppercase tracking-wider animate-fadeIn">{error}</span>}
    </div>
  );
}
