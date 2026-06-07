/**
 * METAMORFIT ELITE TYPE SYSTEM
 * Synchronized with Cinematic MVP Achievements
 */

export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'cut' | 'maintain' | 'bulk' | 'recomp';
export type BodyType = 'ectomorph' | 'mesomorph' | 'endomorph' | 'hardgainer';

/**
 * Core input used for scientific metabolic calculation.
 * Reflects the final onboarding flow including Body Type selection.
 */
export interface CalculatorInput {
  age: number;           // 16–80 years
  weight: number;        // kg
  height: number;        // cm
  sex: Sex;
  activityLevel: ActivityLevel;
  goal: Goal;
  bodyType: BodyType;    // Integrated from the Cinematic Landing Page
  bodyFatPercent?: number; // 5–45%
  precisionMode?: boolean;
  somatotypeTweak?: boolean;
  goalWeight?: number;
}

/**
 * Full metabolic recommendations provided after precision processing.
 */
export interface MacroTargets {
  calories: number;
  protein: number;       // grams
  carbs: number;         // grams
  fats: number;          // grams
  fiber: number;         // grams (14g per 1000kcal)
  water: number;         // liters (3.7L male / 2.7L female baseline)
  steps: number;         // daily step target (10k baseline)
}

export interface CalculatorNote {
  category: 'precision' | 'somatotype' | 'goal' | 'activity' | 'metabolism';
  layer: 'calculation' | 'modifier' | 'recommendation';
  text: string;
  whyItMatters?: string;
  howToApply?: string;
}

/**
 * Comprehensive result object for the Metabolic Engine UI.
 */
export interface CalculatorResult {
  bmr: number;
  tdee: number;
  targets: MacroTargets;
  breakdown: {
    proteinCalories: number;
    carbCalories: number;
    fatCalories: number;
  };
  notes: CalculatorNote[];
  personalizationScore: number;
  explanation?: string;
  ruleTrace?: {
    rulesFired: string[];
    constraintsApplied: string[];
    bfUsed: boolean;
    precisionMode: boolean;
    somatotype: string;
  };
}

/**
 * Standardized error handling for the Precision Engine.
 */
export interface CalculatorError {
  field: keyof CalculatorInput | 'general';
  message: string;
}

/**
 * Universal Metabolic API response structure.
 */
export interface ApiResponse {
  success: boolean;
  data?: CalculatorResult;
  errors?: CalculatorError[];
}

/**
 * Metamorfit Brand Tokens (Informational)
 */
export const BRAND_COLORS = {
  GOLD: '#c9a84c',
  BONE: '#e8e2d5',
  BLACK: '#0a0a08',
  DARK: '#1a1a17',
};
