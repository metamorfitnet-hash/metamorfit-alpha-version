"use client";

import { useEffect, useState } from "react";

interface MacroPieChartProps {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

export default function MacroPieChart({ protein, carbs, fat, calories }: MacroPieChartProps) {
  const [segments, setSegments] = useState<{ color: string; offset: number; length: number }[]>([]);

  useEffect(() => {
    const total = (protein * 4) + (carbs * 4) + (fat * 9) || 1; 
    
    const pPerc = (protein * 4) / total;
    const cPerc = (carbs * 4) / total;
    const fPerc = (fat * 9) / total;

    const radius = 35; 
    const circumference = 2 * Math.PI * radius;

    const newSegments = [
      {
        color: "#c9a84c", // Protein (mm-gold)
        length: pPerc * circumference,
        offset: 0,
      },
      {
        color: "#e8e2d5", // Carbs (mm-bone)
        length: cPerc * circumference,
        offset: pPerc * circumference,
      },
      {
        color: "#78716c", // Fats (mm-steel)
        length: fPerc * circumference,
        offset: (pPerc + cPerc) * circumference,
      },
    ];

    setSegments(newSegments);
  }, [protein, carbs, fat]);

  return (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx="50"
            cy="50"
            r="35"
            fill="transparent"
            stroke={seg.color}
            strokeWidth="12"
            strokeDasharray={`${seg.length} ${219.91}`}
            strokeDashoffset={-seg.offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-in-out"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-heading tracking-tighter text-mm-bone leading-none">{Math.round(calories)}</span>
        <span className="text-[10px] font-heading tracking-widest text-mm-bone/40 uppercase mt-1">kcal</span>
      </div>
    </div>
  );
}
