export interface OnboardingState {
  locale: 'en' | 'es';
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
  sex: 'male' | 'female' | null;
  age: number | null;
  persona: 'hardgainer' | 'rebuilder' | 'optimizer' | 'converter' | null;
  goal: 'maintain' | 'bulk' | 'cut' | 'recomp' | null;
  weightValue: number | null;
  weightUnit: 'kg' | 'lbs';
  heightValue: number | null;
  heightUnit: 'cm' | 'ft';
  somatotype: 'ectomorph' | 'mesomorph' | 'endomorph' | null;
  activityLevel: string | null;
  bodyFatEnabled: boolean;
  bodyFatPercent: number | null;
  somatotypeTweakEnabled: boolean;
}
