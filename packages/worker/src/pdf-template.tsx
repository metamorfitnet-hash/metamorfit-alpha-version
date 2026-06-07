import React from 'react';

// --- Types & Interfaces ---
export interface Identity {
  name: string;
  bodyType: string;
  goal: string;
  age?: number;
  weightKg?: number;
  heightCm?: number;
  bodyFatPct?: number;
  precisionMode?: string;
}

export interface MetabolicProfile {
  bmr: number;
  tdee: number;
  targetKcal: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  activityLevel: string;
  surplus?: number;
  water?: number;
  steps?: number;
  fiber?: number;
}

export interface Personalization {
  personalizationScore: number;
}

export interface IntelligenceNote {
  category: string;
  layer: number;
  personalizationScore: number;
  whyThisMatters: string;
  howToApplyToday: string;
}

export interface Ingredient {
  name: string;
  amount?: string | number;
  unit?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface Meal {
  name: string;
  timeOfDay?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients?: Ingredient[];
}

export interface DeliveredMacros {
  kcal: number;
  protein: number;
  fat: number;
  carb: number;
}

// --- Design Tokens (PDF Visual Rules v1) ---
export const COLORS = {
  gold: '#c9a84c',          // Preserved for legacy icons
  black: '#0a0a08',         
  dark: '#1a1a17',          
  offBlack: '#111110',      
  bone: '#e8e2d5',          
  boneMuted: 'rgba(232,226,213,0.6)', 
  divider: 'rgba(255,255,255,0.08)',  
  goldDivider: 'rgba(201,168,76,0.25)', 
  
  // Elite Dashboard Theme (More Vibrant Teal for readability / Warm Amber / Slate Grey)
  teal: '#14b8a6',
  amber: '#FFB703',
  slate: '#8D99AE',

  // Donut chart segment colors mapped to new theme
  donutProtein: '#c9a84c',  // Gold
  donutCarbs: '#006D77',    // Deep Teal
  donutFats: '#e8e2d5',     // Bone
  // Legacy aliases
  charcoal: '#1a1a17',
  charcoalLight: '#111110',
  white: '#e8e2d5',         
};

export const TYPOGRAPHY = {
  heading: 'Inter',         // Replaced Bebas Neue
  body: 'Inter',            // Replaced DM Sans
  scale: {
    h1: 36,
    h2: 28,
    h3: 20,
    body: 16,
    label: 12.5,
    ingredient: 11,        
  },
  lineHeight: {
    heading: 1.2,
    body: 1.5,
    compact: 1.15,          
  },
};

export const cleanText = (str: any): string => {
  if (str === undefined || str === null) return '';
  let stringVal = '';
  if (typeof str === 'string') {
    stringVal = str;
  } else if (typeof str === 'object') {
    if (str.text && typeof str.text === 'string') {
      stringVal = str.text;
    } else {
      try {
        stringVal = JSON.stringify(str);
      } catch (e) {
        stringVal = String(str);
      }
    }
  } else {
    stringVal = String(str);
  }
  return stringVal.replace(/(Whis:|ACTI|Mamitor|Woo aggressive|Woo)/g, '').trim();
};

export const SPACING = {
  pagePadding: 48,          // Page 1 hero page
  pagePaddingCompact: 34,   // Internal pages (~12mm)
  section: 48,
  block: 24,
  blockCompact: 16,         // Tighter block gap for internal pages
  line: 10,                 // 8–12 range midpoint
  lineCompact: 6,           // Compact line spacing for tables
  cellPadding: 12,
  cellPaddingCompact: 4,    // Minimal cell padding for ingredient rows
  cardPadding: 24,
  cardPaddingCompact: 16,   // Tighter card padding for internal pages
};

export const CATEGORY_ORDER = ['protein', 'energy', 'tactical', 'optimization', 'lifestyle'];
export const CATEGORY_LABELS: Record<string, string> = {
  protein: 'PROTEIN INFRASTRUCTURE',
  energy: 'METABOLIC POSITIONING',
  tactical: 'TACTICAL NUTRIENT TIMING',
  optimization: 'SYSTEMIC OPTIMIZATION',
  lifestyle: 'LIFESTYLE & RECOVERY',
};

// ============================================================
// §1. Icons (SVG) — Monoline, Gold, 18–22px per Visual Rules §5
// ============================================================
export const ICONS = {
  flame: (color = COLORS.gold) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color || ""} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'flex' }}>
      <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.256 1.147-3.107A4.473 4.473 0 008.5 14.5z" />
    </svg>
  ),
  protein: (color = COLORS.gold) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color || ""} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'flex' }}>
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  carb: (color = COLORS.gold) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color || ""} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'flex' }}>
      <path d="M6 2L3 6v15a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3 6h18M16 10a4 4 0 01-8 0" />
    </svg>
  ),
  fat: (color = COLORS.gold) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color || ""} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'flex' }}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  water: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold || ""} strokeWidth="2" style={{ display: 'flex' }}>
      <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
    </svg>
  ),
  movement: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold || ""} strokeWidth="2" style={{ display: 'flex' }}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  sleep: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold || ""} strokeWidth="2" style={{ display: 'flex' }}>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  ),
  precision: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold || ""} strokeWidth="2" style={{ display: 'flex' }}>
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  ),
  somatotype: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold || ""} strokeWidth="2" style={{ display: 'flex' }}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  metabolism: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold || ""} strokeWidth="2" style={{ display: 'flex' }}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  goal: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold || ""} strokeWidth="2" style={{ display: 'flex' }}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  activity: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold || ""} strokeWidth="2" style={{ display: 'flex' }}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
};

// §2. Notes Mapping — Categories map to icons
export const CATEGORY_ICONS: Record<string, () => React.ReactNode> = {
  precision: () => ICONS.precision(),
  somatotype: () => ICONS.somatotype(),
  metabolism: () => ICONS.metabolism(),
  goal: () => ICONS.goal(),
  activity: () => ICONS.activity(),
  // Fallback mappings for engine categories
  protein: () => ICONS.protein(),
  energy: () => ICONS.flame(),
  tactical: () => ICONS.flame(),
  optimization: () => ICONS.metabolism(),
  lifestyle: () => ICONS.sleep(),
};

// ============================================================
// §1. PageContainer (PageWrapper)
// — Applies page padding, MM Black bg, handles page breaks
// — compact mode: reduced padding for internal pages
// ============================================================
export const PageWrapper = ({ children, pageNumber, totalPages, compact }: { children: React.ReactNode; pageNumber: number; totalPages?: number; compact?: boolean }) => {
  const isInternal = compact || pageNumber > 1;
  return (
    <div style={{
      width: '595pt',
      height: '842pt',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: COLORS.black,
      color: COLORS.bone,
      padding: pageNumber === 3 ? `42px ${SPACING.pagePadding || ""}px` : SPACING.pagePadding, 
      overflow: 'hidden',
      fontFamily: TYPOGRAPHY.body,
      whiteSpace: 'pre-wrap',
      lineHeight: pageNumber === 3 ? 1.41 : TYPOGRAPHY.lineHeight.body,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%' }}>
        {children || ""}
      </div>
      <PageFooter pageNumber={pageNumber || ""} totalPages={totalPages || ""} minimal={isInternal || ""} />
    </div>
  );
};

// ============================================================
// §2. PageHeader — Compact for internal pages
// — Gold divider, tighter margins
// ============================================================
export const PageHeader = ({ title, subtitle, pageNumber }: { title: string; subtitle?: string; pageNumber?: number }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    marginBottom: pageNumber === 3 ? 13.6 : SPACING.blockCompact,
    borderBottom: `1px solid ${COLORS.goldDivider || ""}`,
    paddingBottom: SPACING.lineCompact,
  }}>
    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.h2, color: COLORS.gold, fontWeight: 600, fontFamily: TYPOGRAPHY.heading, lineHeight: TYPOGRAPHY.lineHeight.heading }}>{(String(title || "")).toUpperCase()}</div>
      {pageNumber !== undefined && (
        <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, color: COLORS.boneMuted }}>{`PAGE ${pageNumber || ""}`}</div>
      )}
    </div>
    {subtitle && (
      <div style={{ display: 'flex', marginTop: 2 }}>
        <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, color: COLORS.boneMuted, fontFamily: TYPOGRAPHY.body }}>{subtitle || ""}</div>
      </div>
    )}
  </div>
);

// Keep Subheader as alias for backward compat in renderer
export const Subheader = PageHeader;

// ============================================================
// §3. PageFooter
// — Full mode: branding + tagline + page number (Page 1 only)
// — Minimal mode: just page number (internal pages)
// ============================================================
export const PageFooter = ({ pageNumber, totalPages, minimal }: { pageNumber: number; totalPages?: number; minimal?: boolean }) => {
  if (minimal) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        borderTop: `1px solid ${COLORS.goldDivider || ""}`,
        paddingTop: SPACING.lineCompact,
        marginTop: SPACING.blockCompact,
        width: '100%',
      }}>
        <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, color: COLORS.boneMuted }}>{`PAGE ${pageNumber || ""}${totalPages ? ` / ${totalPages || ""}` : ''}`}</div>
      </div>
    );
  }
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTop: `1px solid ${COLORS.goldDivider || ""}`,
      paddingTop: SPACING.cellPadding,
      marginTop: SPACING.block,
      width: '100%',
    }}>
      <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, fontWeight: 600, color: COLORS.gold, fontFamily: TYPOGRAPHY.heading }}>METAMORFIT</div>
      <div style={{ display: 'flex', fontSize: 9, color: COLORS.boneMuted, fontStyle: 'italic' }}>Science-backed transformation for natural lifters.</div>
      <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, color: COLORS.bone }}>{`PAGE ${pageNumber || ""} ${totalPages ? `/ ${totalPages || ""}` : ''}`.toUpperCase()}</div>
    </div>
  );
};

// ============================================================
// §4. HeroHeader
// — Large H1 (Bebas Neue), subheader text, optional badge
// ============================================================
export const HeroHeader = ({ title, subtitle, dateLine, badge }: { title: string; subtitle?: string; dateLine?: string; badge?: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', minHeight: 160, overflow: 'hidden', backgroundColor: COLORS.dark, padding: SPACING.cardPadding, borderRadius: 6, width: '100%' }}>
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, fontWeight: 600, color: COLORS.gold, fontFamily: TYPOGRAPHY.heading }}>METAMORFIT</div>
      <div style={{ display: 'flex', width: 48, height: 1, backgroundColor: COLORS.gold, marginTop: 8, marginBottom: 16 }} />
      <div style={{ display: 'flex', flexDirection: 'column', fontSize: TYPOGRAPHY.scale.h1, fontWeight: 600, color: COLORS.gold, lineHeight: TYPOGRAPHY.lineHeight.heading, fontFamily: TYPOGRAPHY.heading, margin: 0 }}>
        {title.toUpperCase().split('\n').map((line, i) => (
          <div key={i || ""} style={{ display: 'flex' }}>{line || ""}</div>
        ))}
      </div>
      {subtitle && (
        <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.body, color: COLORS.bone, marginTop: 8, fontStyle: 'italic' }}>
          {subtitle || ""}
        </div>
      )}
      {dateLine && (
        <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, color: COLORS.boneMuted, marginTop: 6 }}>{(String(dateLine || "")).toUpperCase()}</div>
      )}
    </div>
    {badge && (
      <div style={{ display: 'flex', marginLeft: 20 }}>
        {badge || ""}
      </div>
    )}
  </div>
);

// ============================================================
// §5. ScoreBadge
// — Circular badge, gold border, DM Sans SemiBold numbers
// — Satori-safe: position:absolute overlay for text
// ============================================================
export const ScoreBadge = ({ score }: { score: number }) => {
  const r = 26;
  const circum = 2 * Math.PI * r;
  const dashoffset = circum - (score / 100) * circum;

  let label = "Baseline Profile";
  if (score >= 85) label = "Elite Precision";
  else if (score >= 65) label = "High Personalization";
  else if (score >= 45) label = "Moderate Precision";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {/* Score ring with HTML overlay for the number */}
      <div style={{ position: 'relative', width: 64, height: 64, display: 'flex' }}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ display: 'flex' }}>
          <circle cx="32" cy="32" r="26" stroke={COLORS.divider || ""} strokeWidth="4" />
          <circle
            cx="32" cy="32" r="26"
            stroke={COLORS.gold || ""}
            strokeWidth="4"
            strokeDasharray={`${circum || ""} ${circum || ""}`}
            strokeDashoffset={dashoffset || ""}
            strokeLinecap="round"
            transform="rotate(-90 32 32)"
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          fontWeight: 600,
          color: COLORS.gold,
          fontFamily: TYPOGRAPHY.body,
        }}>{`${score || ""}`}</div>
      </div>
      <div style={{ display: 'flex', fontSize: 8, fontWeight: 600, color: COLORS.boneMuted, fontFamily: TYPOGRAPHY.body }}>{(String(label || "")).toUpperCase()}</div>
    </div>
  );
};

// ============================================================
// §6. MacroDonut
// — Satori-safe donut chart, position:absolute overlay for text
// — Gold for protein, bone for carbs, dark gold for fats
// — Center label: total kcal (rendered as HTML overlay)
// ============================================================
export const MacroDonut = ({ protein, carbs, fat, calories }: { protein: number; carbs: number; fat: number; calories: number }) => {
  const totalG = protein + carbs + fat;
  const pPct = (protein / totalG) * 100;
  const cPct = (carbs / totalG) * 100;
  const fPct = (fat / totalG) * 100;

  const r = 60;
  const circum = 2 * Math.PI * r;

  const pOffset = 0;
  const cOffset = (pPct / 100) * circum;
  const fOffset = ((pPct + cPct) / 100) * circum;

  return (
    <div style={{ position: 'relative', width: 156, height: 156, display: 'flex' }}>
      <svg width="156" height="156" viewBox="0 0 156 156" fill="none" style={{ display: 'flex' }}>
        {/* Background ring – inline style beats global CSS rules */}
        <circle cx="78" cy="78" r="60" style={{fill: 'transparent'}} stroke={COLORS.offBlack || ""} strokeWidth="26" />
        {/* Protein (gold) – inline style beats global CSS */}
        <circle cx="78" cy="78" r="60" style={{fill: 'transparent'}} stroke={COLORS.donutProtein || ""} strokeWidth="26" strokeDasharray={`${(pPct/100)*circum} ${circum || ""}`} strokeDashoffset={-pOffset} strokeLinecap="round" />
        {/* Carbs (teal) – inline style beats global CSS */}
        <circle cx="78" cy="78" r="60" style={{fill: 'transparent'}} stroke={COLORS.donutCarbs || ""} strokeWidth="26" strokeDasharray={`${(cPct/100)*circum} ${circum || ""}`} strokeDashoffset={-cOffset} strokeLinecap="round" />
        {/* Fats (warm bone) – inline style beats global CSS */}
        <circle cx="78" cy="78" r="60" style={{fill: 'transparent'}} stroke={COLORS.donutFats || ""} strokeWidth="26" strokeDasharray={`${(fPct/100)*circum} ${circum || ""}`} strokeDashoffset={-fOffset} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        fontWeight: 600,
        fontFamily: TYPOGRAPHY.body,
      }}>
        <div style={{ display: 'flex', fontSize: 24, color: COLORS.bone }}>{`${calories || ""}`}</div>
        <div style={{ display: 'flex', fontSize: 10, color: COLORS.boneMuted }}>KCAL</div>
      </div>
    </div>
  );
};

// ============================================================
// §7. MacroGrid
// — 3-column layout; each block: macro name, grams, percent, kcal
// ============================================================
export const MacroGrid = ({ metabolicProfile }: { metabolicProfile: MetabolicProfile }) => {
  const targetCal = metabolicProfile.targetKcal || metabolicProfile.tdee;
  const macros = [
    { label: 'PROTEIN', val: metabolicProfile.proteinGrams, icon: ICONS.protein(COLORS.gold), pct: Math.round((metabolicProfile.proteinGrams * 4 / targetCal) * 100), multiplier: 4, color: COLORS.gold },
    { label: 'CARBOHYDRATES', val: metabolicProfile.carbsGrams, icon: ICONS.carb(COLORS.teal), pct: Math.round((metabolicProfile.carbsGrams * 4 / targetCal) * 100), multiplier: 4, color: COLORS.teal },
    { label: 'FATS', val: metabolicProfile.fatsGrams, icon: ICONS.fat(COLORS.bone), pct: Math.round((metabolicProfile.fatsGrams * 9 / targetCal) * 100), multiplier: 9, color: COLORS.bone },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', justifyContent: 'center', height: '100%' }}>
      {macros.map((m, i) => (
        <div key={i || ""} style={{ display: 'flex', flexDirection: 'column', borderBottom: i < 2 ? `1px solid ${COLORS.divider || ""}` : 'none', paddingBottom: 8, width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {m.icon || ""}
            <div style={{ display: 'flex', fontSize: 10, fontWeight: 700, color: m.color, fontFamily: TYPOGRAPHY.body }}>{m.label || ""}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 6, width: '100%', marginTop: 2 }}>
            <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, color: m.color, fontFamily: TYPOGRAPHY.body, lineHeight: 1 }}>{`${m.val || ""}`}</div>
            <div style={{ display: 'flex', fontSize: 10, color: COLORS.boneMuted, paddingBottom: 4 }}>G / DAY</div>
            <div style={{ display: 'flex', flex: 1 }} />
            <div style={{ display: 'flex', fontSize: 10, color: COLORS.boneMuted, paddingBottom: 4 }}>{`${m.val * m.multiplier} KCAL · ${m.pct || ""}%`}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// §8. NoteCard — Condensed inline format
// — Single-line bold label + inline text to save vertical space
// ============================================================
export const NoteCard = ({ title, text }: { title: string; text: string }) => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 6, 
      width: '100%', 
      backgroundColor: COLORS.dark, 
      border: `1px solid ${COLORS.goldDivider || ""}`, 
      borderRadius: 8,
      padding: '12px 14px',
      minHeight: 100,
    }}>
      <div style={{ display: 'flex', fontSize: 10, fontWeight: 700, color: COLORS.teal, fontFamily: TYPOGRAPHY.heading, letterSpacing: 0.5 }}>
        {title.toUpperCase()}
      </div>
      <div style={{ display: 'flex', fontSize: 10.5, color: COLORS.bone, lineHeight: 1.25, marginTop: 4 }}>
        {text || ""}
      </div>
    </div>
  );
};

// ============================================================
// §9. DailyTargets
// — Calories, protein minimum, carbs/fats, water, steps
// ============================================================
export const DailyTargets = ({ metabolicProfile }: { metabolicProfile: MetabolicProfile }) => (
  <div style={{ display: 'flex', flexDirection: 'row', gap: SPACING.cellPadding, width: '100%' }}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, fontWeight: 600, color: COLORS.boneMuted }}>DAILY CALORIES</div>
      <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.h1, fontWeight: 600, color: COLORS.gold, fontFamily: TYPOGRAPHY.body }}>{`${metabolicProfile.targetKcal || metabolicProfile.tdee}`}</div>
      <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, color: COLORS.boneMuted }}>TARGET</div>
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: `1px solid ${COLORS.divider || ""}`, borderRight: `1px solid ${COLORS.divider || ""}` }}>
      <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, fontWeight: 600, color: COLORS.boneMuted }}>PROTEIN MINIMUM</div>
      <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.h1, fontWeight: 600, color: COLORS.gold, fontFamily: TYPOGRAPHY.body }}>{`${metabolicProfile.proteinGrams || ""}G`}</div>
      <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, color: COLORS.boneMuted }}>HIT THIS FIRST</div>
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, fontWeight: 600, color: COLORS.boneMuted }}>CARBS / FAT</div>
      <div style={{ display: 'flex', fontSize: 20, fontWeight: 600, color: COLORS.gold, fontFamily: TYPOGRAPHY.body }}>{`${metabolicProfile.carbsGrams || ""}G / ${metabolicProfile.fatsGrams || ""}G`}</div>
      <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, color: COLORS.boneMuted }}>FUEL BALANCE</div>
    </div>
  </div>
);

// ============================================================
// §10. MealTable — Compact ingredient layout
// — 9.5pt font, 1.15 line-height, 4px cell padding
// — Gold dividers, right-aligned macro columns
// ============================================================
export const MealTable = ({ meal, compact = false }: { meal: Meal; compact?: boolean }) => (
  <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
    {/* Table header */}
    <div style={{ display: 'flex', flexDirection: 'row', borderBottom: `1px solid ${COLORS.goldDivider || ""}`, paddingBottom: SPACING.cellPaddingCompact, marginBottom: SPACING.cellPaddingCompact }}>
      <div style={{ display: 'flex', flex: 5, fontSize: TYPOGRAPHY.scale.ingredient, fontWeight: 600, color: COLORS.gold, fontFamily: TYPOGRAPHY.heading }}>INGREDIENT</div>
      <div style={{ display: 'flex', width: 40, fontSize: TYPOGRAPHY.scale.ingredient, fontWeight: 600, color: COLORS.gold, fontFamily: TYPOGRAPHY.heading, justifyContent: 'flex-end' }}>P</div>
      <div style={{ display: 'flex', width: 40, fontSize: TYPOGRAPHY.scale.ingredient, fontWeight: 600, color: COLORS.gold, fontFamily: TYPOGRAPHY.heading, justifyContent: 'flex-end' }}>C</div>
      <div style={{ display: 'flex', width: 40, fontSize: TYPOGRAPHY.scale.ingredient, fontWeight: 600, color: COLORS.gold, fontFamily: TYPOGRAPHY.heading, justifyContent: 'flex-end' }}>F</div>
      <div style={{ display: 'flex', width: 48, fontSize: TYPOGRAPHY.scale.ingredient, fontWeight: 600, color: COLORS.gold, fontFamily: TYPOGRAPHY.heading, justifyContent: 'flex-end' }}>KCAL</div>
    </div>
    {/* Table rows */}
    {(!meal.ingredients || meal.ingredients.length === 0) && (
      <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.ingredient, color: COLORS.boneMuted, fontStyle: 'italic', padding: `${SPACING.cellPaddingCompact || ""}px 0` }}>No primary ingredients listed.</div>
    )}
    {(meal.ingredients || []).map((ing, j) => (
      <div key={j || ""} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: compact ? '4px 0' : `${SPACING.cellPaddingCompact || ""}px 0`, borderBottom: j < (meal.ingredients?.length || 0) - 1 ? `1px solid ${COLORS.goldDivider || ""}` : 'none', width: '100%', lineHeight: compact ? 1.12 : TYPOGRAPHY.lineHeight.compact }}>
        <div style={{ display: 'flex', flex: 5, flexDirection: 'column', overflow: 'hidden', flexShrink: 1 }}>
          <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.ingredient, fontWeight: 500, color: COLORS.bone, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{ing.name || ""}</div>
          {(ing.amount || ing.unit) && (
            <div style={{ display: 'flex', fontSize: 8, color: COLORS.boneMuted }}>{(`${ing?.amount || ''} ${ing?.unit || ''}`)?.trim()}</div>
          )}
        </div>
        <div style={{ display: 'flex', width: 40, fontSize: TYPOGRAPHY.scale.ingredient, color: COLORS.bone, justifyContent: 'flex-end', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{Math.round(ing.protein)}g</div>
        <div style={{ display: 'flex', width: 40, fontSize: TYPOGRAPHY.scale.ingredient, color: COLORS.bone, justifyContent: 'flex-end', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{Math.round(ing.carbs)}g</div>
        <div style={{ display: 'flex', width: 40, fontSize: TYPOGRAPHY.scale.ingredient, color: COLORS.bone, justifyContent: 'flex-end', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{Math.round(ing.fats)}g</div>
        <div style={{ display: 'flex', width: 48, fontSize: TYPOGRAPHY.scale.ingredient, fontWeight: 600, color: COLORS.gold, justifyContent: 'flex-end', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{Math.round(ing.calories)}</div>
      </div>
    ))}
    {/* Meal totals row */}
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: `${SPACING.cellPaddingCompact || ""}px 0`, borderTop: `1px solid ${COLORS.goldDivider || ""}`, marginTop: 2, width: '100%' }}>
      <div style={{ display: 'flex', flex: 5, fontSize: TYPOGRAPHY.scale.ingredient, fontWeight: 600, color: COLORS.boneMuted, flexShrink: 1 }}>TOTAL</div>
      <div style={{ display: 'flex', width: 40, fontSize: TYPOGRAPHY.scale.ingredient, fontWeight: 600, color: COLORS.bone, justifyContent: 'flex-end', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{Math.round(meal.protein)}g</div>
      <div style={{ display: 'flex', width: 40, fontSize: TYPOGRAPHY.scale.ingredient, fontWeight: 600, color: COLORS.bone, justifyContent: 'flex-end', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{Math.round(meal.carbs)}g</div>
      <div style={{ display: 'flex', width: 40, fontSize: TYPOGRAPHY.scale.ingredient, fontWeight: 600, color: COLORS.bone, justifyContent: 'flex-end', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{Math.round(meal.fats)}g</div>
      <div style={{ display: 'flex', width: 48, fontSize: TYPOGRAPHY.scale.ingredient, fontWeight: 600, color: COLORS.gold, justifyContent: 'flex-end', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{Math.round(meal.calories)}</div>
    </div>
  </div>
);

// ============================================================
// §11. SectionTitle
// — H2 in Bebas Neue, gold underline divider
// ============================================================
export const SectionTitle = ({ title }: { title: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: SPACING.block }}>
    <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.h2, fontWeight: 600, color: COLORS.gold, fontFamily: TYPOGRAPHY.heading, lineHeight: TYPOGRAPHY.lineHeight.heading }}>{(String(title || "")).toUpperCase()}</div>
    <div style={{ display: 'flex', width: 48, height: 2, backgroundColor: COLORS.gold, marginTop: 6 }} />
  </div>
);

// ============================================================
// §12. MovementIconBlock
// — Steps icon + target, Hydration icon + target
// ============================================================
export const MovementIconBlock = ({ items }: { items: { icon: React.ReactNode; label: string; value: string; sub: string }[] }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.line, width: '100%' }}>
    {items.map((h, i) => (
      <div key={i || ""} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: SPACING.cellPadding, padding: `${SPACING.cellPadding || ""}px 0`, borderBottom: i < items.length - 1 ? `1px solid ${COLORS.divider || ""}` : 'none', width: '100%' }}>
        {h.icon || ""}
        <div style={{ display: 'flex', flex: 1, fontSize: TYPOGRAPHY.scale.label, fontWeight: 600, color: COLORS.boneMuted }}>{(String(h.label || "")).toUpperCase()}</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.h3, fontWeight: 600, color: COLORS.gold, fontFamily: TYPOGRAPHY.body }}>{`${h.value || ""}`}</div>
          <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, color: COLORS.boneMuted }}>{(String(h.sub || "")).toUpperCase()}</div>
        </div>
      </div>
    ))}
  </div>
);

// ============================================================
// Foundation: Card & Badge (already spec-compliant from Step 1)
// ============================================================
export const Card = ({ children, headerTitle, headerIcon, headerColor = COLORS.gold, footerText, style = {} }: { children: React.ReactNode; headerTitle?: string; headerIcon?: React.ReactNode; headerColor?: string; footerText?: string; style?: React.CSSProperties }) => (
  <div style={{
    display: 'flex', 
    flexDirection: 'column',
    backgroundColor: COLORS.dark,
    borderRadius: 6,
    padding: SPACING.cardPaddingCompact,
    marginBottom: SPACING.blockCompact,
    pageBreakInside: 'avoid',
    ...style
  }}>
    {headerTitle && (
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.cellPaddingCompact, borderBottom: `1px solid ${COLORS.goldDivider || ""}`, paddingBottom: SPACING.lineCompact }}>
        {headerIcon || ""}
        <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.h3, color: headerColor, fontFamily: TYPOGRAPHY.heading, fontWeight: 700, lineHeight: TYPOGRAPHY.lineHeight.heading }}>{`${headerTitle || ""}`}</div>
      </div>
    )}
    <div style={{ display: 'flex', flexDirection: 'column' }}>{children || ""}</div>
    {footerText && (
      <div style={{ display: 'flex', marginTop: SPACING.cellPaddingCompact, paddingTop: SPACING.lineCompact, borderTop: `1px solid ${COLORS.goldDivider || ""}`, fontSize: TYPOGRAPHY.scale.label, color: COLORS.boneMuted }}>{footerText || ""}</div>
    )}
  </div>
);

export const Badge = ({ label, variant }: { label: string; variant: 'gold' | 'charcoal' | 'outline' }) => {
  const styles: Record<string, React.CSSProperties> = {
    gold: { backgroundColor: COLORS.gold, color: COLORS.black },
    charcoal: { backgroundColor: COLORS.offBlack, color: COLORS.boneMuted },
    outline: { border: `1px solid ${COLORS.gold || ""}`, color: COLORS.gold },
  };
  return (
    <div style={{
      display: 'flex',
      fontSize: TYPOGRAPHY.scale.label,
      fontWeight: 600,
      fontFamily: TYPOGRAPHY.body,
      padding: '3px 8px',
      borderRadius: 3,
      ...styles[variant]
    }}>{(String(label || "")).toUpperCase()}</div>
  );
};

// ============================================================
// Page Compositions — use extracted components, preserve data logic
// ============================================================

export const Page1 = ({ identity, personalization, totalPages = 3 }: { identity: Identity; personalization: Personalization; totalPages?: number }) => (
  <PageWrapper pageNumber={1 || ""} totalPages={totalPages || ""}>
    {/* Tier 1: Integrated Header */}
    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderBottom: `1px solid ${COLORS.teal || ""}`, paddingBottom: SPACING.cellPadding, marginBottom: SPACING.block }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, fontWeight: 700, color: COLORS.teal, letterSpacing: 1 }}>METAMORFIT</div>
        <div style={{ display: 'flex', fontSize: 32, fontWeight: 700, color: COLORS.bone }}>{(String(identity.name || "")).toUpperCase()}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, color: COLORS.slate }}>GENERATED</div>
        <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.body, fontWeight: 500, color: COLORS.bone }}>{new Date().toLocaleDateString()}</div>
      </div>
    </div>

    {/* Tier 2: Hero Metric Split */}
    <div style={{ display: 'flex', flexDirection: 'row', gap: SPACING.block, width: '100%', flex: 1, padding: `${SPACING.block || ""}px 0` }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: COLORS.dark, padding: SPACING.cardPadding, borderRadius: 8, borderLeft: `4px solid ${COLORS.teal || ""}`, justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {ICONS.flame(COLORS.teal)}
          <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, fontWeight: 700, color: COLORS.teal, letterSpacing: 1 }}>GOAL</div>
        </div>
        <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, color: COLORS.bone, lineHeight: 1 }}>{(String(identity.goal || "")).toUpperCase()}</div>
        <div style={{ display: 'flex', fontSize: 12, fontWeight: 300, color: COLORS.slate, marginTop: 8 }}>Fat Loss & Muscle Preservation</div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: COLORS.dark, padding: SPACING.cardPadding, borderRadius: 8, borderLeft: `4px solid ${COLORS.amber || ""}`, justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {ICONS.somatotype()}
          <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, fontWeight: 700, color: COLORS.amber, letterSpacing: 1 }}>TYPE</div>
        </div>
        <div style={{ display: 'flex', fontSize: 32, fontWeight: 700, color: COLORS.bone, lineHeight: 1 }}>{(String(identity.bodyType || "")).toUpperCase()}</div>
        <div style={{ display: 'flex', fontSize: 12, fontWeight: 300, color: COLORS.slate, marginTop: 8 }}>{personalization.personalizationScore}% Physiology Match</div>
      </div>
    </div>

    {/* Tier 3: Horizontal Biometric Bar */}
    <div style={{ display: 'flex', flexDirection: 'row', width: '100%', backgroundColor: COLORS.dark, borderRadius: 8, padding: SPACING.cellPadding, marginBottom: SPACING.block, justifyContent: 'center', alignItems: 'center', gap: 24 }}>
      <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.h3, fontWeight: 700, color: COLORS.bone }}>{`${identity.age || '--'}y`}</div>
      <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.h3, color: COLORS.slate }}>|</div>
      <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.h3, fontWeight: 700, color: COLORS.bone }}>{`${identity.weightKg || '--'}kg`}</div>
      <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.h3, color: COLORS.slate }}>|</div>
      <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.h3, fontWeight: 700, color: COLORS.bone }}>{`${identity.heightCm || '--'}cm`}</div>
      <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.h3, color: COLORS.slate }}>|</div>
      <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.h3, fontWeight: 700, color: COLORS.bone }}>{`${identity.bodyFatPct || '--'}% BF`}</div>
    </div>
  </PageWrapper>
);

export const Page2 = ({ identity, metabolicProfile, notes, totalPages = 3 }: { identity: Identity; metabolicProfile: MetabolicProfile; notes: IntelligenceNote[]; totalPages?: number }) => {
  const targetCal = metabolicProfile.targetKcal || metabolicProfile.tdee;
  const surplusVal = metabolicProfile.surplus || 0;
  const isDeficit = surplusVal < 0;
  const absSurplus = Math.abs(surplusVal);
  const surplusLabel = isDeficit ? `${absSurplus || ""} CALORIE DEFICIT` : `${absSurplus || ""} SURPLUS`;
  const surplusColor = isDeficit ? COLORS.teal : COLORS.gold;
  const surplusIcon = isDeficit ? '↓' : '↑';

  return (
    <PageWrapper pageNumber={2 || ""} totalPages={totalPages || ""} compact>
      <PageHeader title="YOUR PERSONALIZED PLAN LOGIC" pageNumber={2 || ""} />

      <Card headerTitle="YOUR ENERGY EQUATION" style={{ marginBottom: SPACING.blockCompact }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: SPACING.cellPaddingCompact, width: '100%' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {ICONS.flame()}
            <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, fontWeight: 600, color: COLORS.boneMuted, marginTop: 4 }}>BASE METABOLIC</div>
            <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.h2, fontWeight: 600, color: COLORS.gold, fontFamily: TYPOGRAPHY.body }}>{`${metabolicProfile.bmr || 1850}`}</div>
            <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, color: COLORS.boneMuted }}>KCAL / BMR</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: `1px solid ${COLORS.goldDivider || ""}`, borderRight: `1px solid ${COLORS.goldDivider || ""}` }}>
            {ICONS.flame(COLORS.gold)}
            <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, fontWeight: 600, color: COLORS.boneMuted, marginTop: 4 }}>TOTAL DAILY ENERGY</div>
            <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.h2, fontWeight: 600, color: COLORS.gold, fontFamily: TYPOGRAPHY.body }}>{`${metabolicProfile.tdee || ""}`}</div>
            <Badge label="MAINTENANCE" variant="outline" />
          </div>
          <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: isDeficit ? 'rgba(20, 184, 166, 0.05)' : 'rgba(201, 168, 76, 0.05)', borderRadius: 8, padding: '8px 0' }}>
            <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.body, color: surplusColor, fontWeight: 700 }}>{surplusIcon || ""}</div>
            <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, fontWeight: 700, color: COLORS.teal, marginTop: 4 }}>YOUR DAILY TARGET</div>
            <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.h1, fontWeight: 700, color: COLORS.gold, fontFamily: TYPOGRAPHY.body }}>{`${metabolicProfile.targetKcal || metabolicProfile.tdee + (metabolicProfile.surplus || 0)}`}</div>
            <Badge label={(String(surplusLabel || "")).toUpperCase()} variant={isDeficit ? "outline" : "gold"} />
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'row', gap: SPACING.cellPaddingCompact, marginBottom: SPACING.blockCompact, height: 380 }}>
        <Card style={{ flex: 1.1, marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', transform: 'scale(1.2)', marginTop: 20 }}>
            <MacroDonut
              protein={metabolicProfile.proteinGrams || ""}
              carbs={metabolicProfile.carbsGrams || ""}
              fat={metabolicProfile.fatsGrams || ""}
              calories={targetCal || ""}
            />
          </div>
        </Card>
        <Card headerTitle="MACRO BREAKDOWN & LOGIC" style={{ flex: 1.4, marginBottom: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', padding: '4px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', fontSize: 13.5, color: COLORS.bone }}>
                <strong>Protein — {metabolicProfile.proteinGrams || ""}g / {metabolicProfile.proteinGrams * 4}kcal / {Math.round((metabolicProfile.proteinGrams * 4 / targetCal) * 100)}%</strong>
              </div>
              <div style={{ display: 'flex', fontSize: 11, fontWeight: 300, color: COLORS.slate }}>Building block for muscle retention.</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 12, height: 12, backgroundColor: COLORS.donutProtein, borderRadius: 2 }} />
                <div style={{ display: 'flex', fontSize: 13.5, color: COLORS.bone }}>
                  <strong>Protein — {metabolicProfile.proteinGrams || ""}g / {metabolicProfile.proteinGrams * 4}kcal / {Math.round((metabolicProfile.proteinGrams * 4 / targetCal) * 100)}%</strong>
                </div>
              </div>
              <div style={{ display: 'flex', fontSize: 11, fontWeight: 300, color: COLORS.slate, paddingLeft: 20 }}>Building block for muscle retention.</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 12, height: 12, backgroundColor: COLORS.donutCarbs, borderRadius: 2 }} />
                <div style={{ display: 'flex', fontSize: 13.5, color: COLORS.bone }}>
                  <strong>Carbohydrates — {metabolicProfile.carbsGrams || ""}g / {metabolicProfile.carbsGrams * 4}kcal / {Math.round((metabolicProfile.carbsGrams * 4 / targetCal) * 100)}%</strong>
                </div>
              </div>
              <div style={{ display: 'flex', fontSize: 11, fontWeight: 300, color: COLORS.slate, paddingLeft: 20 }}>{`Strategic energy for ${(String(identity.goal || "")).toUpperCase()} phase.`}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 12, height: 12, backgroundColor: COLORS.donutFats, borderRadius: 2 }} />
                <div style={{ display: 'flex', fontSize: 13.5, color: COLORS.bone }}>
                  <strong>Fats — {metabolicProfile.fatsGrams || ""}g / {metabolicProfile.fatsGrams * 9}kcal / {100 - Math.round((metabolicProfile.proteinGrams * 4 / targetCal) * 100) - Math.round((metabolicProfile.carbsGrams * 4 / targetCal) * 100)}%</strong>
                </div>
              </div>
              <div style={{ display: 'flex', fontSize: 11, fontWeight: 300, color: COLORS.slate, paddingLeft: 20 }}>{`Optimized fuel for ${identity.bodyType || ""} metabolism.`}</div>
            </div>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
};

export const Page3 = ({ meals, metabolicProfile, pageNumber, totalPages }: { meals: Meal[]; metabolicProfile: MetabolicProfile; pageNumber: number; totalPages: number }) => (
  <PageWrapper pageNumber={pageNumber || ""} totalPages={totalPages || ""}>
    <PageHeader title="YOUR DAILY ACTION BLUEPRINT" pageNumber={pageNumber || ""} />

    <div style={{ display: 'flex', flexDirection: 'column', gap: 14.4, width: '100%' }}>
      
      {/* §9. DailyTargets */}
      <Card headerTitle="YOUR DAILY TARGETS" style={{ marginBottom: 0, padding: '10px 13px' }}>
        <DailyTargets metabolicProfile={metabolicProfile || ""} />
      </Card>

      <Card headerTitle="SUGGESTED MEAL STRUCTURE" style={{ marginBottom: 0, padding: '10px 13px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          {(meals.length > 0 ? meals : [
            { name: 'Meal 1 - Morning', timeOfDay: '7:00-9:00 AM', calories: 600, protein: 40, carbs: 60, fats: 20 },
            { name: 'Meal 2 - Mid Day', timeOfDay: '12:00-1:00 PM', calories: 800, protein: 50, carbs: 100, fats: 25 },
            { name: 'Meal 3 - Evening', timeOfDay: '5:00-7:00 PM', calories: 750, protein: 45, carbs: 80, fats: 25 },
          ]).map((meal, i) => (
            <div key={i || ""} style={{ display: 'flex', flexDirection: 'column', gap: 4, borderBottom: i < (meals.length || 3) - 1 ? `1px solid ${COLORS.goldDivider || ""}` : 'none', paddingBottom: 6, width: '100%', pageBreakInside: 'avoid' }}>
              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.body, fontWeight: 600, color: COLORS.bone, fontFamily: TYPOGRAPHY.heading }}>{(String(meal.name || "")).toUpperCase()}</div>
                <div style={{ display: 'flex', fontSize: 9.5, color: COLORS.boneMuted }}>{`${meal.timeOfDay || '~TBD'}`.toUpperCase()}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {ICONS.protein()} <div style={{ display: 'flex', fontSize: 9.5, color: COLORS.bone }}>{`${meal.protein || ""}G`}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {ICONS.carb()} <div style={{ display: 'flex', fontSize: 9.5, color: COLORS.bone }}>{`${meal.carbs || ""}G`}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {ICONS.fat()} <div style={{ display: 'flex', fontSize: 9.5, color: COLORS.bone }}>{`${meal.fats || ""}G`}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {ICONS.flame()}
                  <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.h3, fontWeight: 600, color: COLORS.gold, fontFamily: TYPOGRAPHY.body }}>{`${meal.calories || ""}`}</div>
                  <div style={{ display: 'flex', fontSize: 9.5, color: COLORS.boneMuted }}>KCAL</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* §12. MovementIconBlock — Daily Habits */}
      <Card headerTitle="DAILY HABIT TARGETS" style={{ marginBottom: 0, padding: '10px 13px' }}>
        <MovementIconBlock items={[
          { icon: ICONS.water(), label: 'Water Intake', value: `${metabolicProfile.water || 3.5}L`, sub: 'Hit this minimum' },
          { icon: ICONS.movement(), label: 'Daily Movement', value: (metabolicProfile.steps || 8500).toLocaleString(), sub: 'Steps minimum' },
          { icon: ICONS.sleep(), label: 'Sleep Target', value: '7-9', sub: 'Hours per night' },
        ]} />
      </Card>

      <div style={{
        marginTop: 0,
        backgroundColor: COLORS.dark,
        borderRadius: 6,
        padding: '10px 20px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 9.5, fontWeight: 600, color: COLORS.boneMuted }}>READY TO LEVEL UP?</div>
          <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.body, fontWeight: 600, color: COLORS.bone, marginTop: 2 }}>Track, Adapt & Transform with the Metamorfit App</div>
        </div>
        <div style={{
          display: 'flex',
          backgroundColor: COLORS.gold,
          color: COLORS.black,
          padding: `${SPACING.line || ""}px ${SPACING.cellPadding || ""}px`,
          borderRadius: 4,
          fontSize: 9.5,
          fontWeight: 600,
          fontFamily: TYPOGRAPHY.body,
        }}>JOIN THE WAITLIST →</div>
      </div>
    </div>
    </PageWrapper>
  );

// ============================================================
// §8. NotesPage — Two-column condensed layout
// ============================================================
export const NotesPage = ({ 
  intelligenceNotes, 
  explanation,
  pageNumber, 
  totalPages 
}: { 
  intelligenceNotes: IntelligenceNote[]; 
  explanation?: string;
  pageNumber: number; 
  totalPages: number; 
}) => {
  const sortedNotes = [...intelligenceNotes].sort((a, b) => {
    const catA = CATEGORY_ORDER.indexOf(a.category);
    const catB = CATEGORY_ORDER.indexOf(b.category);
    if (catA !== catB) return catA - catB;
    if (a.layer !== b.layer) return a.layer - b.layer;
    return b.personalizationScore - a.personalizationScore;
  }).slice(0, 4);

  return (
    <PageWrapper pageNumber={pageNumber || ""} totalPages={totalPages || ""}>
      <PageHeader title="PERSONALIZED PLAN NOTES" pageNumber={pageNumber || ""} />

      {explanation && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          backgroundColor: COLORS.dark, 
          border: `1px solid ${COLORS.goldDivider || ""}`, 
          borderRadius: 8, 
          padding: 16, 
          marginBottom: 16,
          width: '100%'
        }}>
          <div style={{ display: 'flex', fontSize: 9, fontWeight: 700, color: COLORS.gold, marginBottom: 6, letterSpacing: 1 }}>AI METABOLIC INSIGHT</div>
          <div style={{ display: 'flex', fontSize: 10.5, color: COLORS.bone, lineHeight: 1.3, fontStyle: 'italic' }}>{explanation || ""}</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: '100%' }}>
        {sortedNotes.map((note, i) => {
          const titles = ["METABOLIC FORMULA", "SOMATOTYPE ALIGNMENT", "RECOMPOSITION FACTOR", "ACTIVITY SCALE"];
          const title = titles[i] || "METABOLIC INSIGHT";
          return (
            <div key={i || ""} style={{ display: 'flex', width: '240px' }}>
              <NoteCard title={title} text={cleanText(note.whyThisMatters)} />
            </div>
          );
        })}
      </div>
    </PageWrapper>
  );
};

// ============================================================
// §10. MealDetailsPage — DailyTargets at top + filtered meals
// — Skips meals with no ingredients or all-zero/TBD macros
// ============================================================

/** Check if a meal is empty (no real data) */
function isMealEmpty(meal: Meal): boolean {
  if (!meal.ingredients || meal.ingredients.length === 0) return true;
  // Skip if all ingredients are placeholder
  const allPlaceholder = meal.ingredients.every(ing =>
    ing.name.toLowerCase().includes('no ingredients') ||
    ing.name.toLowerCase().includes('tbd') ||
    (ing.calories === 0 && ing.protein === 0 && ing.carbs === 0 && ing.fats === 0)
  );
  return allPlaceholder;
}

export const MealDetailsPage = ({
  meals,
  metabolicProfile,
  pageNumber,
  totalPages,
  showTargets
}: {
  meals: Meal[];
  metabolicProfile?: MetabolicProfile;
  pageNumber: number;
  totalPages: number;
  showTargets?: boolean;
}) => {
  // Filter out empty/TBD meals
  const validMeals = meals.filter(m => !isMealEmpty(m));

  return (
    <PageWrapper pageNumber={pageNumber || ""} totalPages={totalPages || ""}>
      <PageHeader title="DETAILED MEAL BREAKDOWN" pageNumber={pageNumber || ""} />

      {/* DailyTargets at top of first meal page to eliminate dead space */}
      {showTargets && metabolicProfile && (
        <Card headerTitle="YOUR DAILY TARGETS" headerColor={COLORS.teal || ""} style={{ marginBottom: SPACING.blockCompact, padding: SPACING.cardPaddingCompact }}>
          <DailyTargets metabolicProfile={metabolicProfile || ""} />
        </Card>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.blockCompact, width: '100%' }}>
        {validMeals.length === 0 && (
          <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, color: COLORS.boneMuted, fontStyle: 'italic' }}>No meal data available.</div>
        )}
        {validMeals.map((meal, i) => {
          const isSnack = meal.name.toUpperCase() === 'SNACK';
          return (
            <Card 
              key={i || ""} 
              headerTitle={(String(meal.name || "")).toUpperCase()} 
              headerColor={COLORS.teal || ""} 
              style={{ 
                padding: isSnack ? '10px 16px' : SPACING.cardPaddingCompact, 
                marginBottom: 0,
                minHeight: isSnack ? 0 : undefined,
                pageBreakInside: isSnack ? 'auto' : 'avoid'
              }}
            >
              <MealTable meal={meal || ""} compact={isSnack || ""} />
            </Card>
          );
        })}
      </div>
    </PageWrapper>
  );
};

// ============================================================
// §13. Calibration Recap Page (Page 6)
// ============================================================
export const CalibrationRecapPage = ({
  metabolicProfile,
  delivered,
  pageNumber,
  totalPages
}: {
  metabolicProfile: MetabolicProfile;
  delivered: DeliveredMacros;
  pageNumber: number;
  totalPages: number;
}) => {
  const targetKcal = metabolicProfile.targetKcal || metabolicProfile.tdee;
  
  const pVar = delivered.protein - metabolicProfile.proteinGrams;
  const cVar = delivered.carb - metabolicProfile.carbsGrams;

  const rows = [
    { label: 'Calories', goal: targetKcal, plan: delivered.kcal, var: delivered.kcal - targetKcal, unit: '' },
    { label: 'Protein', goal: metabolicProfile.proteinGrams, plan: delivered.protein, var: pVar, unit: 'g' },
    { label: 'Carbs', goal: metabolicProfile.carbsGrams, plan: delivered.carb, var: cVar, unit: 'g' },
    { label: 'Fats', goal: metabolicProfile.fatsGrams, plan: delivered.fat, var: delivered.fat - metabolicProfile.fatsGrams, unit: 'g' },
  ];

  return (
    <PageWrapper pageNumber={pageNumber || ""} totalPages={totalPages || ""}>
      <PageHeader title="CALIBRATION RECAP" pageNumber={pageNumber || ""} />

      <Card headerTitle="COMPARATIVE AUDIT" style={{ padding: SPACING.cardPaddingCompact }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* Header Row */}
          <div style={{ display: 'flex', flexDirection: 'row', borderBottom: `1px solid ${COLORS.teal || ""}`, paddingBottom: SPACING.cellPaddingCompact, marginBottom: SPACING.cellPaddingCompact }}>
            <div style={{ display: 'flex', flex: 3, fontSize: TYPOGRAPHY.scale.body, fontWeight: 700, color: COLORS.teal, fontFamily: TYPOGRAPHY.heading }}>METRIC</div>
            <div style={{ display: 'flex', flex: 2, fontSize: TYPOGRAPHY.scale.body, fontWeight: 700, color: COLORS.teal, fontFamily: TYPOGRAPHY.heading, justifyContent: 'flex-end' }}>GOAL</div>
            <div style={{ display: 'flex', flex: 2, fontSize: TYPOGRAPHY.scale.body, fontWeight: 700, color: COLORS.teal, fontFamily: TYPOGRAPHY.heading, justifyContent: 'flex-end' }}>PLAN</div>
            <div style={{ display: 'flex', flex: 2, fontSize: TYPOGRAPHY.scale.body, fontWeight: 700, color: COLORS.teal, fontFamily: TYPOGRAPHY.heading, justifyContent: 'flex-end' }}>VARIANCE</div>
          </div>
          
          {/* Data Rows */}
          {rows.map((r, i) => {
            const varColor = COLORS.bone; 
            const varSign = r.var > 0 ? '+' : '';
            const isNegative = r.var < 0;
            return (
              <div key={i || ""} style={{ display: 'flex', flexDirection: 'row', padding: `${SPACING.cellPaddingCompact || ""}px 4px`, borderBottom: i < rows.length - 1 ? `1px solid ${COLORS.goldDivider || ""}` : 'none', width: '100%', backgroundColor: isNegative ? 'rgba(255, 0, 0, 0.1)' : 'transparent' }}>
                <div style={{ display: 'flex', flex: 3, fontSize: TYPOGRAPHY.scale.body, fontWeight: 500, color: COLORS.boneMuted }}>{(String(r.label || "")).toUpperCase()}</div>
                <div style={{ display: 'flex', flex: 2, fontSize: TYPOGRAPHY.scale.body, color: COLORS.bone, justifyContent: 'flex-end', fontVariantNumeric: 'tabular-nums' }}>{`${r.goal || ""}${r.unit || ""}`}</div>
                <div style={{ display: 'flex', flex: 2, fontSize: TYPOGRAPHY.scale.body, color: COLORS.bone, justifyContent: 'flex-end', fontVariantNumeric: 'tabular-nums' }}>{`${r.plan || ""}${r.unit || ""}`}</div>
                <div style={{ display: 'flex', flex: 2, fontSize: TYPOGRAPHY.scale.body, fontWeight: 600, color: isNegative ? '#ff6b6b' : varColor, justifyContent: 'flex-end', fontVariantNumeric: 'tabular-nums' }}>{`${varSign || ""}${r.var || ""}${r.unit || ""}`}</div>
              </div>
            );
          })}
          
          <div style={{ marginTop: SPACING.blockCompact, padding: SPACING.cardPaddingCompact, backgroundColor: COLORS.offBlack, borderColor: COLORS.teal, border: '1px solid', borderRadius: 6, display: 'flex', flexDirection: 'column', pageBreakInside: 'avoid' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lineCompact }}>
              {pVar < -50 && (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  {ICONS.protein(COLORS.teal)}
                  <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, color: COLORS.bone, lineHeight: TYPOGRAPHY.lineHeight.body, fontWeight: 500, marginTop: 2 }}>
                    Protein Gap Detected: We recommend adding one high-protein snack (e.g., Whey Isolate or 50g chicken) to reach Elite targets.
                  </div>
                </div>
              )}

              {cVar > 0 && (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  {ICONS.carb(COLORS.slate)}
                  <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, color: COLORS.bone, lineHeight: TYPOGRAPHY.lineHeight.body, fontWeight: 500, marginTop: 2 }}>
                    Carb Note: Your intake includes high-fiber greens and lentils, which are essential for digestive health during a cut.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, borderTop: `1px solid ${COLORS.goldDivider || ""}`, paddingTop: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.label, color: COLORS.bone }}>Precision not feeling right?</div>
                  <div style={{ display: 'flex', backgroundColor: COLORS.teal, color: COLORS.bone, padding: '4px 12px', borderRadius: 4, fontSize: TYPOGRAPHY.scale.label, fontWeight: 600 }}>Request Consultation (support@metamorfit.io)</div>
                </div>
                <div style={{ display: 'flex', fontSize: TYPOGRAPHY.scale.ingredient, color: COLORS.slate, fontStyle: 'italic', marginTop: 4 }}>
                  Adherence over Perfection: Aim for 80% daily consistency.
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
    </PageWrapper>
  );
};
