import React from 'react';

interface Props {
  options: [string, string];
  activeOption: string;
  onChange: (newOption: string) => void;
  ariaLabel?: string;
}

export default function UnitToggle({ options, activeOption, onChange, ariaLabel }: Props) {
  return (
    <div className="flex bg-[var(--bg-card)] border border-[var(--border-default)] rounded-full p-[2px]">
      {options.map((opt) => {
        const isActive = activeOption === opt;
        return (
          <button
            key={opt}
            onClick={() => {
              if (!isActive) onChange(opt);
            }}
            className={`
              px-3 py-1 rounded-full text-[11px] font-sans font-bold uppercase tracking-wider transition-colors duration-200
              ${isActive 
                ? 'bg-[var(--gold-primary)] text-[#121212]' 
                : 'text-[var(--text-muted)] hover:text-white'
              }
            `}
            role="switch"
            aria-checked={isActive ? "true" : "false"}
            aria-label={ariaLabel ? `${ariaLabel} ${opt}` : `Select ${opt} unit`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
