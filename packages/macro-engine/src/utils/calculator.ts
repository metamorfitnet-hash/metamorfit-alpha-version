import { z } from 'zod';

export const CalculateSchema = z.object({
  age: z.number().min(15).max(100),
  sex: z.enum(['male', 'female']),
  weightKg: z.number().min(30).max(300),
  heightCm: z.number().min(100).max(250),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  goal: z.enum(['fat_loss', 'maintenance', 'muscle_gain', 'recomp']),
  bodyType: z.enum(['ectomorph', 'mesomorph', 'endomorph', 'hardgainer']).optional(),
  bodyFatPercent: z.number().optional(),
  precisionMode: z.boolean().optional(),
  somatotypeTweak: z.boolean().optional(),
  locale: z.string().optional(),
});

type CalculatorInput = z.infer<typeof CalculateSchema>;

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary:    1.2,
  light:        1.375,
  moderate:     1.55,
  active:       1.725,
  very_active:  1.9,
};

function calculateBMR_Mifflin(weight: number, height: number, age: number, sex: string): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calculateMacros(data: CalculatorInput) {
  const { age, sex, weightKg: weight, heightCm: height, activityLevel, goal, bodyType, precisionMode, somatotypeTweak } = data;
  
  // Rule 4: If Precision Mode OFF -> ignore BF%
  const bodyFatPercent = precisionMode ? data.bodyFatPercent : null;

  // Step 1: FFM
  let ffm = 0;
  const heightMeters = height / 100;
  const universalIBW = 22 * (heightMeters ** 2);

  if (typeof bodyFatPercent === 'number' && bodyFatPercent > 0 && bodyFatPercent <= 70) {
    const fatDecimal = bodyFatPercent > 1 ? bodyFatPercent / 100 : bodyFatPercent;
    ffm = weight * (1 - fatDecimal);
  } else {
    const bmi = weight / (heightMeters ** 2);
    ffm = bmi >= 30 ? universalIBW : weight * 0.8;
  }
  if (ffm < 30) ffm = 30;

  // Step 2: BMR
  let bmr = 0;
  if (precisionMode && typeof bodyFatPercent === 'number' && bodyFatPercent > 0) {
    bmr = Math.round(370 + 21.6 * ffm);
  } else {
    bmr = Math.round(calculateBMR_Mifflin(weight, height, age, sex));
  }

  // Step 3: TDEE Baseline
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
  
  // Step 4: Calorie calculation
  let calorieAdjustment = 0;
  if (goal === 'fat_loss') calorieAdjustment = -0.15;
  else if (goal === 'muscle_gain') calorieAdjustment = 0.15;
  else if (goal === 'recomp' || goal === 'maintenance') calorieAdjustment = 0;

  if (precisionMode) {
    if (goal === 'fat_loss') calorieAdjustment -= 0.05;
    else if (goal === 'muscle_gain') calorieAdjustment += 0.05;
  }

  let targetCalories = Math.round(tdee * (1 + calorieAdjustment));

  // Step 5: Protein Logic
  const bmiValue = weight / ((height / 100) ** 2);
  let proteinFactor = 2.0;
  if (goal === 'fat_loss') {
    proteinFactor = 2.2;
    if (typeof bodyFatPercent === 'number') {
      if (sex === 'male' && bodyFatPercent < 12) proteinFactor = 2.4;
      if (sex === 'female' && bodyFatPercent < 20) proteinFactor = 2.4;
    }
  } else if (goal === 'maintenance') {
    proteinFactor = 1.8;
  } else if (goal === 'muscle_gain') {
    proteinFactor = 1.7;
  } else if (goal === 'recomp') {
    proteinFactor = 2.0;
  }

  let proteinGrams = 0;
  if (typeof bodyFatPercent === 'number') {
    proteinGrams = ffm * proteinFactor;
  } else if (bmiValue >= 30) {
    proteinGrams = universalIBW * proteinFactor;
  } else {
    proteinGrams = weight * proteinFactor;
  }

  // Minimum safe ranges
  let minProtein = 0;
  if (goal === 'fat_loss') minProtein = ffm * 1.95;
  else if (goal === 'maintenance') minProtein = ffm * 1.8;
  else if (goal === 'recomp') minProtein = ffm * 1.9;
  else if (goal === 'muscle_gain') minProtein = ffm * 1.9;

  if (proteinGrams < minProtein) proteinGrams = minProtein;

  const maxByFFM = ffm * 2.8;
  const maxByBW = weight * 2.4;
  proteinGrams = Math.min(proteinGrams, maxByFFM, maxByBW);

  // Step 6: Macro Distribution
  let pPct = (proteinGrams * 4 / targetCalories) * 100;
  let cPct = 0, fPct = 0;
  let carbCeilingPct = 100;
  let carbFloorPct = 0;
  let fatMinPct = 0;
  let fatMaxPct = 100;

  const remainingPct = 100 - pPct;
  if (goal === 'fat_loss') { cPct = remainingPct * 0.45; fPct = remainingPct * 0.55; }
  else if (goal === 'maintenance') { cPct = remainingPct * 0.55; fPct = remainingPct * 0.45; }
  else if (goal === 'muscle_gain') { cPct = remainingPct * 0.65; fPct = remainingPct * 0.35; }
  else if (goal === 'recomp') { cPct = remainingPct * 0.50; fPct = remainingPct * 0.50; }

  if (precisionMode) {
    if (goal === 'fat_loss') { cPct -= 10; fPct += 10; }
    else if (goal === 'recomp') { cPct -= 5; fPct += 5; }
    else if (goal === 'muscle_gain') { cPct += 10; fPct -= 10; }
  }

  if (somatotypeTweak) {
    if (bodyType === 'ectomorph' || bodyType === 'hardgainer') { cPct += 7.5; fPct -= 7.5; }
    else if (bodyType === 'mesomorph') { cPct += 2.5; fPct -= 2.5; }
    else if (bodyType === 'endomorph') { cPct -= 7.5; fPct += 7.5; }
  }

  if (bodyFatPercent) {
    if (bodyFatPercent > 25) { cPct -= 5; fPct += 5; }
    else if (bodyFatPercent < 12) { cPct += 5; fPct -= 5; }
  }

  if (activityLevel === 'active' || activityLevel === 'very_active') { cPct += 5; fPct -= 5; }
  else if (activityLevel === 'sedentary' || activityLevel === 'light') { cPct -= 5; fPct += 5; }

  if (bodyType === 'ectomorph' || bodyType === 'hardgainer') { carbCeilingPct = 55; fatMinPct = 25; }
  else if (bodyType === 'mesomorph') { carbCeilingPct = 50; carbFloorPct = 30; fatMinPct = 25; }
  else if (bodyType === 'endomorph') { carbCeilingPct = 40; fatMinPct = 30; fatMaxPct = 40; }

  let sum = pPct + cPct + fPct;
  pPct = (pPct / sum) * 100;
  cPct = (cPct / sum) * 100;
  fPct = (fPct / sum) * 100;

  let fatGrams = (targetCalories * (fPct / 100)) / 9;
  let carbGrams = (targetCalories * (cPct / 100)) / 4;

  const carbMaxGrams = (targetCalories * (carbCeilingPct / 100)) / 4;
  if (carbGrams > carbMaxGrams) {
    const diff = carbGrams - carbMaxGrams;
    carbGrams = carbMaxGrams;
    fatGrams += (diff * 4) / 9;
  }

  const carbMinGrams = (targetCalories * (carbFloorPct / 100)) / 4;
  if (carbGrams < carbMinGrams) {
    const diff = carbMinGrams - carbGrams;
    carbGrams = carbMinGrams;
    fatGrams -= (diff * 4) / 9;
  }

  const fatMinGrams = (targetCalories * (fatMinPct / 100)) / 9;
  if (fatGrams < fatMinGrams) {
    const diff = fatMinGrams - fatGrams;
    fatGrams = fatMinGrams;
    carbGrams -= (diff * 9) / 4;
  }

  const fatMaxGrams = (targetCalories * (fatMaxPct / 100)) / 9;
  if (fatGrams > fatMaxGrams) {
    const diff = fatGrams - fatMaxGrams;
    fatGrams = fatMaxGrams;
    carbGrams += (diff * 9) / 4;
  }

  // Protein Redistribution
  const origProteinGrams = proteinGrams;
  let increasePct = 0;
  if (goal === 'fat_loss') increasePct = 0.10;
  else if (goal === 'maintenance') increasePct = 0.10;
  else if (goal === 'recomp') increasePct = 0.15;
  else if (goal === 'muscle_gain') increasePct = 0.20;

  let newProteinGrams = proteinGrams * (1 + increasePct);
  newProteinGrams = Math.min(newProteinGrams, maxByFFM, maxByBW);
  const addedProteinGrams = newProteinGrams - origProteinGrams;
  
  if (addedProteinGrams > 0) {
    const caloriesToSubtract = addedProteinGrams * 4;
    const carbCalories = carbGrams * 4;
    if (carbCalories >= caloriesToSubtract) {
      carbGrams -= (caloriesToSubtract / 4);
      proteinGrams = newProteinGrams;
    } else {
      const remainingCals = caloriesToSubtract - carbCalories;
      const currentFatMinGrams = (targetCalories * (fatMinPct / 100)) / 9;
      const availableFatCalories = Math.max(0, (fatGrams - currentFatMinGrams) * 9);
      if (availableFatCalories >= remainingCals) {
        carbGrams = 0;
        fatGrams -= (remainingCals / 9);
        proteinGrams = newProteinGrams;
      } else {
        carbGrams = 0;
        fatGrams = currentFatMinGrams;
        const totalCalsTaken = carbCalories + availableFatCalories;
        proteinGrams = origProteinGrams + (totalCalsTaken / 4);
      }
    }
  }

  proteinGrams = Math.round(Math.max(0, proteinGrams));
  fatGrams = Math.round(Math.max(0, fatGrams));
  carbGrams = Math.round(Math.max(0, carbGrams));

  const fiber = Math.round(targetCalories / 1000 * 14);
  const water = parseFloat((weight * 0.033 + (activityLevel !== 'sedentary' ? 0.5 : 0)).toFixed(1));
  
  const stepsBase: Record<string, number> = { fat_loss: 10000, maintenance: 8000, muscle_gain: 7000, recomp: 9000 };
  const steps = stepsBase[goal];

  const notes: any[] = [];
  let personalizationScore = 40;

  if (precisionMode) {
    personalizationScore += 15;
    notes.push({
      category: 'Precision Targeting',
      text: 'Body-fat-adjusted, performance-grade macros.'
    });
  }

  if (somatotypeTweak) {
    personalizationScore += 10;
    notes.push({
      category: 'Nutrient Partitioning',
      text: 'Adjusted for specific energy storage assumptions.'
    });
  }

  if (typeof bodyFatPercent === 'number' && bodyFatPercent > 0) {
    personalizationScore += 20;
    notes.push({
      category: 'Metabolic Formula',
      text: `Katch-McArdle (${bodyFatPercent}% BF Adjusted)`
    });
    
    if (bodyFatPercent > 25) {
      notes.push({
        category: 'Insulin Sensitivity',
        text: 'Carbohydrates reduced to support metabolic flexibility.'
      });
    } else if (bodyFatPercent < 12) {
      notes.push({
        category: 'Metabolic Flexibility',
        text: 'Carbohydrates increased to support training fullness.'
      });
    }
  }

  if (activityLevel) {
    let activityText = '';
    if (activityLevel === 'active' || activityLevel === 'very_active') activityText = 'High-Intensity Volume Scaling';
    else if (activityLevel === 'moderate') activityText = 'Moderate Performance Scaling';
    else activityText = 'Baseline Lifestyle Scaling';

    notes.push({
      category: 'Activity Scale',
      text: activityText
    });
  }

  // Goal Logic
  const goalNames: Record<string, string> = { fat_loss: 'Cut', maintenance: 'Maintenance', muscle_gain: 'Lean Bulk', recomp: 'Recomposition' };
  
  let goalText = '';
  if (goal === 'fat_loss') goalText = '15% Cut Protocol';
  else if (goal === 'muscle_gain') goalText = '15% Lean Bulk Protocol';
  else if (goal === 'recomp') goalText = 'High-Protein Maintenance Protocol';
  else goalText = 'Standard Maintenance Protocol';

  notes.push({
    category: `Caloric ${goal === 'fat_loss' ? 'Deficit' : goal === 'muscle_gain' ? 'Surplus' : goal === 'recomp' ? 'Recomposition' : 'Maintenance'}`,
    text: goalText
  });

  personalizationScore = Math.min(100, Math.max(0, personalizationScore));

  return {
    success: true,
    deploy_id: 'meta-beta-v4-synchronized',
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetKcal: Math.round(targetCalories),
    personalizationScore,
    macros: { protein: proteinGrams, carbs: carbGrams, fats: fatGrams },
    targets: {
      calories: Math.round(targetCalories),
      protein: proteinGrams,
      carbs: carbGrams,
      fats: fatGrams,
      fiber,
      water,
      steps
    },
    notes
  };
}
