export interface MacroPayload {
  tdee: number;
  bmr: number;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  insights: string[];
  personalizationScore: number;
  somatotype: string;
  fiber?: number;
  water?: number;
  steps?: number;
  explanation?: string | null;
  goal?: string;
  name?: string;
  email?: string;
  age?: number;
  bodyFatPct?: number;
}
