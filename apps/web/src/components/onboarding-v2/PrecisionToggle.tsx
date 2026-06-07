import React from 'react';

interface Props {
  label: string;
  sublabel: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
}

export default function PrecisionToggle({ label, sublabel, checked, onChange, ariaLabel }: Props) {
  return (
    <div className="flex justify-between items-center w-full bg-[var(--bg-card)] p-4 rounded-[var(--border-radius-card)] border border-[var(--border-default)]">
      <div className="flex flex-col">
        <span className="font-sans font-semibold text-[14px] uppercase tracking-wide text-white">{label}</span>
        <span className="font-sans text-[11px] uppercase tracking-widest text-[#888888] mt-1">{sublabel}</span>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-[28px] w-[52px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
          ${checked ? 'bg-[var(--gold-primary)]' : 'bg-[#2e2e2e]'}
        `}
        role="switch"
        aria-checked={checked ? "true" : "false"}
        aria-label={ariaLabel || label || "Precision mode toggle"}
      >
        <span
          className={`
            pointer-events-none inline-block h-[24px] w-[24px] transform rounded-full shadow ring-0 transition duration-200 ease-in-out
            ${checked ? 'translate-x-[24px] bg-[#121212]' : 'translate-x-0 bg-[#888888]'}
          `}
        />
      </button>
    </div>
  );
}
