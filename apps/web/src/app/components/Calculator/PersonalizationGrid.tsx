import React from "react";
import { CalculatorNote } from "@/types/calculator";

interface PersonalizationGridProps {
  notes: CalculatorNote[];
}

export function PersonalizationGrid({ notes }: PersonalizationGridProps) {
  if (!notes || notes.length === 0) return null;

  // RELAXED FILTER: Render all notes that contain text
  const activeNotes = notes.filter(n => n.text && n.text.trim().length > 0);
  
  if (activeNotes.length === 0) return null;

  return (
    <div className="w-full mt-8 block opacity-100 visibility-visible">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 w-full">
        {activeNotes.map((note, index) => {
          // Identify if this is a formula-based note to add specific labeling
          const isFormula = note.text.toLowerCase().includes('formula') || 
                           note.text.toLowerCase().includes('katch') || 
                           note.text.toLowerCase().includes('mifflin');
          
          return (
            <div 
              key={index}
              className="relative bg-mm-black/80 backdrop-blur-md border border-mm-gold/20 rounded-xl p-4 md:p-5 group hover:border-mm-gold/40 transition-all duration-700 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(201,168,76,0.1)] overflow-hidden flex flex-col justify-between"
            >
              {/* Subtle gold gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-mm-gold/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative z-10 flex flex-col gap-1.5">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-emerald-400 font-body font-bold tracking-widest uppercase">
                    {note.category}
                  </span>
                  <div className="h-[1px] w-8 bg-emerald-400/20 group-hover:w-12 transition-all duration-700" />
                </div>
                
                <div className="text-[14px] md:text-[15px] font-body font-medium leading-snug text-mm-bone group-hover:text-white transition-colors">
                  {note.text}
                </div>
              </div>
              
              {/* Decorative corner accent */}
              <div className="absolute bottom-0 right-0 w-8 h-8 opacity-10 group-hover:opacity-30 transition-opacity">
                <div className="absolute bottom-2 right-2 w-px h-4 bg-mm-gold" />
                <div className="absolute bottom-2 right-2 w-4 h-px bg-mm-gold" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
