"use client";

import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './DailyTargetsPanel.css';

interface MacroData {
  consumed: number;
  target: number;
}

interface DailyTargetsPanelProps {
  calorieTarget: number;
  caloriesConsumed: number;
  macros: {
    protein: MacroData;
    carbs: MacroData;
    fats: MacroData;
  };
  isLoading?: boolean;
}

const MacroGauge = ({ label, data, isEs }: { label: string; data: MacroData; isEs: boolean }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const consumedRatio = Math.min(data.consumed / data.target, 1);
  const arcLength = consumedRatio * circumference;
  const gapLength = circumference - arcLength;

  // Over target logic
  const isOver = data.consumed > data.target;

  return (
    <div className="macro-column">
      <div className="macro-section-label">{label}</div>
      <div className="gauge-container">
        <svg className="gauge-svg" viewBox="0 0 148 148">
          <defs>
            <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          {/* Layer 1: Dark base track ring */}
          <circle cx="74" cy="74" r="60" fill="none" stroke="#080808" strokeWidth="9" strokeLinecap="butt" />

          {/* Layer 2: Tick/segmented overlay */}
          <circle
            cx="74" cy="74" r="60" fill="none"
            stroke="#ffffff" strokeWidth="1"
            strokeDasharray="1 11" strokeOpacity="0.15"
          />

          {/* Layer 3: Gold progress arc */}
          <circle
            cx="74" cy="74" r="60" fill="none"
            className="gauge-progress-arc"
            stroke={isOver ? "#c0392b" : "#d4af37"} strokeWidth="9"
            strokeDasharray={`${arcLength} ${gapLength}`}
            strokeDashoffset="0"
            transform="rotate(-90 74 74)"
            strokeLinecap="butt"
          />

          {/* Layer 4 & 5: Inner disc */}
          <circle cx="74" cy="74" r="47" fill="#0c0c0c" stroke="#222" strokeWidth="0.5" />

          {/* Layer 6 & 7: Text */}
          <text x="74" y="68" textAnchor="middle" className="gauge-consumed-val">
            {Math.round(data.consumed)}g
          </text>
          <text x="74" y="86" textAnchor="middle" className="gauge-consumed-label">
            {isEs ? "CONSUMIDO" : "CONSUMED"}
          </text>
        </svg>
      </div>

      <div className="data-cell-block">
        <div className="data-cell">
          <div className="cell-label">{isEs ? "OBJETIVO" : "TARGET"}</div>
          <div className="cell-value target">{Math.round(data.target)}g</div>
        </div>
        <div className="data-cell">
          <div className="cell-label">{isEs ? "RESTANTE" : "LEFT"}</div>
          <div className={`cell-value ${isOver ? 'over' : 'left'}`}>
            {Math.round(data.target - data.consumed)}g
          </div>
        </div>
      </div>
    </div>
  );
};

export const DailyTargetsPanel: React.FC<DailyTargetsPanelProps> = ({
  calorieTarget,
  caloriesConsumed,
  macros,
  isLoading = false,
}) => {
  const { i18n } = useTranslation();
  const isEs = i18n.language === 'es';

  const remaining = calorieTarget - caloriesConsumed;
  const isOver = remaining < 0;
  const fillWidth = Math.min((caloriesConsumed / calorieTarget) * 100, 100);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fillRef.current) {
      fillRef.current.style.setProperty('--fill-width', `${fillWidth}%`);
    }
  }, [fillWidth]);

  if (isLoading) {
    return (
      <div className="daily-targets-panel loading">
        {/* Skeleton UI could be added here */}
        <div className="text-center text-mm-gold">{isEs ? "Cargando Datos de Metabolismo..." : "Loading Metabolism Data..."}</div>
      </div>
    );
  }

  return (
    <div className="daily-targets-panel">
      {/* Section 1 — Title Block */}
      <div className="title-block">
        <h2 className="panel-title">{isEs ? "OBJETIVOS DIARIOS" : "DAILY TARGETS"}</h2>
        <div className="hero-calorie-row">
          <span className="hero-calorie-number">{Math.round(calorieTarget)}</span>
          <span className="calorie-unit">{isEs ? "KCAL / DÍA" : "KCAL / DAY"}</span>
        </div>
      </div>

      {/* Section 2 — Calorie Progress Bar */}
      <div className="calorie-progress-section">
        <div className="calorie-bar-header">
          <div className="calorie-bar-label">{isEs ? "CALORÍAS TOTALES" : "TOTAL CALORIES"}</div>
          <div className="calorie-bar-data">
            <span className="data-item">{Math.round(caloriesConsumed)} {isEs ? "consumidas" : "consumed"}</span>
            <span className="data-divider">·</span>
            <span className="data-item">{Math.round(calorieTarget)} {isEs ? "objetivo" : "target"}</span>
            <span className="data-divider">·</span>
            <span className={`data-item ${isOver ? 'over' : 'remaining'}`}>
              {Math.round(remaining)} {isEs ? "restantes" : "remaining"}
            </span>
          </div>
        </div>
        <div className="progress-track-wrapper">
          <div 
            ref={fillRef}
            className="progress-fill" 
          >
            <div className="fill-glow" />
          </div>
        </div>
      </div>

      {/* Section 3 — Macro Gauges */}
      <div className="macro-gauges-grid">
        <MacroGauge label={isEs ? "PROTEÍNA" : "PROTEIN"} data={macros.protein} isEs={isEs} />
        <MacroGauge label={isEs ? "CARBOHIDRATOS" : "CARBOHYDRATES"} data={macros.carbs} isEs={isEs} />
        <MacroGauge label={isEs ? "GRASAS" : "DIETARY FATS"} data={macros.fats} isEs={isEs} />
      </div>

      {/* Section 4 — Footer Line */}
      <div className="footer-line-section">
        <div className="footer-hairline" />
        <p className="footer-tagline">{isEs ? "La precisión es la base de la maestría. Alinea tu ingesta con tu biología." : "Precision is the foundation of mastery. Align your intake with your biology."}</p>
        <div className="footer-hairline" />
      </div>
    </div>
  );
};
