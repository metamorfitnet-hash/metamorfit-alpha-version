import React from "react";
import { useTranslation } from "react-i18next";

type NotesPanelProps = {
  explanation?: string | null;
  legacyInsights?: {
    id: string;
    title: string;
    category: string;
    body: string;
  }[];
};

export function NotesPanel({ explanation, legacyInsights }: NotesPanelProps) {
  const { t } = useTranslation();
  const hasExplanation = Boolean(explanation && explanation.trim().length > 0);

  return (
    <section
      aria-label="AI Metabolic Insight"
      className="w-full rounded-[2rem] border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 px-5 py-6 md:px-8 md:py-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
    >
      {/* Header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/30">
            <span className="text-sm font-bold uppercase tracking-widest text-amber-400">
              AI
            </span>
          </div>
          <div>
            <h2 className="text-base font-heading font-semibold uppercase tracking-[0.2em] text-neutral-100">
              {t('dashboard.metabolicInsightTitle')}
            </h2>
            <p className="text-[11px] uppercase tracking-widest text-neutral-500 mt-0.5">
              {t('dashboard.metabolicInsightSubtitle')}
            </p>
          </div>
        </div>

        {hasExplanation && (
          <div className="flex items-center self-start sm:self-auto gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
              {t('dashboard.liveAnalysis')}
            </span>
          </div>
        )}
      </header>

      {/* Body */}
      <div className="space-y-6">
        {hasExplanation ? (
          <article className="rounded-2xl bg-black/40 p-5 md:p-8 ring-1 ring-white/5 border-l-2 border-amber-500/30">
            <div className="whitespace-pre-line text-base md:text-[17px] leading-[1.85] text-neutral-100 font-body opacity-95 tracking-wide">
              {(() => {
                if (!explanation) return null;
                const hasHeaders = explanation.includes('STRATEGY:') || explanation.includes('FUEL MATRIX:');
                if (hasHeaders) {
                  const parts = explanation.split(/(STRATEGY:|FUEL MATRIX:|EDGE TIP:)/g).filter(p => p.trim() !== '');
                  return (
                    <div className="space-y-4">
                      {parts.map((part, i) => {
                        const trimmed = part.trim();
                        if (['STRATEGY:', 'FUEL MATRIX:', 'EDGE TIP:'].includes(trimmed)) {
                          return <span key={i} className="block text-[11px] font-bold uppercase tracking-[0.25em] text-amber-500 mt-4 mb-1 first:mt-0">{trimmed.replace(':', '')}</span>;
                        }
                        return <p key={i} className="text-base md:text-[17px] leading-[1.85] text-neutral-100 font-body opacity-95 tracking-wide m-0">{trimmed}</p>;
                      })}
                    </div>
                  );
                }
                
                return explanation.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, i) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-bold text-white tracking-normal">{part.slice(2, -2)}</strong>;
                  }
                  if (part.startsWith('*') && part.endsWith('*')) {
                    return <em key={i} className="italic text-neutral-300">{part.slice(1, -1)}</em>;
                  }
                  return part;
                });
              })()}
            </div>
          </article>
        ) : legacyInsights && legacyInsights.length > 0 ? null : (
          <article className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 p-6 text-center">
            <p className="text-sm md:text-base text-neutral-500 leading-relaxed max-w-md mx-auto">
              {t('dashboard.awaitingSync')}
            </p>
          </article>
        )}

        {/* Optional: Legacy Insights */}
        {legacyInsights && legacyInsights.length > 0 && (
          <div className="pt-6 border-t border-white/5">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {legacyInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-xl bg-neutral-900/50 p-6 ring-1 ring-white/[0.03] hover:ring-white/[0.08] transition-all duration-300"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-500 mb-2.5">
                    {insight.category}
                  </p>
                  <p className="text-[16.5px] font-bold text-neutral-100 leading-tight">
                    {insight.title}
                  </p>
                  {insight.body && (
                    <p className="mt-2 text-[15px] leading-relaxed text-neutral-200 italic font-medium opacity-95">
                      {insight.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
