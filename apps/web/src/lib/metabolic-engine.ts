import type {
  CalculatorInput,
  CalculatorResult,
  ActivityLevel,
  Goal,
  CalculatorError,
} from '@/types/calculator';

/**
 * Harris-Benedict standard activity multipliers
 */
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary:    1.2,   // Desk job, no exercise
  light:        1.375, // 1–3 days/week light exercise
  moderate:     1.55,  // 3–5 days/week moderate exercise
  active:       1.725, // 6–7 days/week hard training
  very_active:  1.9,   // 2x/day training or physical job
};


/**
 * Mifflin-St Jeor BMR Formula
 */
function calculateBMR(
  weight: number,
  height: number,
  age: number,
  sex: 'male' | 'female'
): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

/**
 * Main Metamorfit Metabolic Engine
 * Calculates TDEE, Macros, and Wellness targets with high-precision.
 */
export function calculateMacros(input: CalculatorInput): CalculatorResult {
  const { age, weight, height, sex, activityLevel, goal, bodyType, precisionMode, somatotypeTweak } = input;
  
  // Rule 4: If Precision Mode OFF -> ignore BF%
  const bodyFatPercent = precisionMode ? input.bodyFatPercent : null;

  // Step 1: FFM (Compute first to support Katch-McArdle if needed)
  let ffm = 0;
  const heightMeters = height / 100;
  const universalIBW = 22 * (heightMeters ** 2);

  if (typeof bodyFatPercent === 'number' && bodyFatPercent > 0 && bodyFatPercent <= 70) {
    const fatDecimal = bodyFatPercent > 1 ? bodyFatPercent / 100 : bodyFatPercent;
    ffm = weight * (1 - fatDecimal);
  } else {
    // If BF% missing, estimate FFM based on BMI category to avoid inflation
    const bmi = weight / (heightMeters ** 2);
    ffm = bmi >= 30 ? universalIBW : weight * 0.8;
  }
  if (ffm < 30) ffm = 30;

  // Step 2: BMR
  let bmr = 0;
  if (precisionMode && typeof bodyFatPercent === 'number' && bodyFatPercent > 0) {
    bmr = Math.round(370 + 21.6 * ffm);
  } else {
    bmr = Math.round(calculateBMR(weight, height, age, sex));
  }

  // Step 3: TDEE Baseline
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
  // Step 4: Calorie calculation (Unified Spec)
  let calorieAdjustment = 0;
  if (goal === 'cut') calorieAdjustment = -0.15;
  else if (goal === 'bulk') calorieAdjustment = 0.15;
  else if (goal === 'recomp' || goal === 'maintain') calorieAdjustment = 0;

  // Precision Mode Calorie Modifier
  if (precisionMode) {
    if (goal === 'cut') calorieAdjustment -= 0.05;
    else if (goal === 'bulk') calorieAdjustment += 0.05;
  }

  let targetCalories = Math.round(tdee * (1 + calorieAdjustment));

  // Step 5: Protein Logic (Evidence-Based System)
  const bmi = weight / ((height / 100) ** 2);
  let proteinFactor = 2.0; // Default
  if (goal === 'cut') {
    proteinFactor = 2.2;
    if (typeof bodyFatPercent === 'number') {
      if (sex === 'male' && bodyFatPercent < 12) proteinFactor = 2.4;
      if (sex === 'female' && bodyFatPercent < 20) proteinFactor = 2.4;
    }
  } else if (goal === 'maintain') {
    proteinFactor = 1.8;
  } else if (goal === 'bulk') {
    proteinFactor = 1.7;
  } else if (goal === 'recomp') {
    proteinFactor = 2.0;
  }

  let proteinGrams = 0;
  if (typeof bodyFatPercent === 'number') {
    proteinGrams = ffm * proteinFactor;
  } else if (bmi >= 30) {
    proteinGrams = universalIBW * proteinFactor;
  } else {
    proteinGrams = weight * proteinFactor;
  }

  // Enforce minimum safe ranges per goal
  let minProtein = 0;
  if (goal === 'cut') {
    minProtein = ffm * 1.95;
  } else if (goal === 'maintain') {
    minProtein = ffm * 1.8;
  } else if (goal === 'recomp') {
    minProtein = ffm * 1.9;
  } else if (goal === 'bulk') {
    minProtein = ffm * 1.9;
  }

  if (proteinGrams < minProtein) {
    proteinGrams = minProtein;
  }

  // Universal Safety Ceilings
  const maxByFFM = ffm * 2.8;
  const maxByBW = weight * 2.4;
  proteinGrams = Math.min(proteinGrams, maxByFFM, maxByBW);

  // Step 6: Macro Calculation (Unified Engine)
  let pPct = (proteinGrams * 4 / targetCalories) * 100;
  let cPct = 0, fPct = 0;
  let carbCeilingPct = 100;
  let carbFloorPct = 0;
  let fatMinPct = 0;
  let fatMaxPct = 100;

  // 6.1 Base Macro Templates (By Goal)
  // Protein is already set (pPct), now determine C/F split from remaining calories
  const remainingPct = 100 - pPct;
  if (goal === 'cut') {
    cPct = remainingPct * 0.45; fPct = remainingPct * 0.55;
  } else if (goal === 'maintain') {
    cPct = remainingPct * 0.55; fPct = remainingPct * 0.45;
  } else if (goal === 'bulk') {
    cPct = remainingPct * 0.65; fPct = remainingPct * 0.35;
  } else if (goal === 'recomp') {
    cPct = remainingPct * 0.50; fPct = remainingPct * 0.50;
  }

  // 6.2 Precision Mode Overrides (Carbs/Fats only)
  if (precisionMode) {
    if (goal === 'cut') { cPct -= 10; fPct += 10; }
    else if (goal === 'recomp') { cPct -= 5; fPct += 5; }
    else if (goal === 'bulk') { cPct += 10; fPct -= 10; }
  }

  // 6.3 Somatotype Tweak Integration (Carbs/Fats only)
  if (somatotypeTweak) {
    if (bodyType === 'ectomorph' || bodyType === 'hardgainer') {
      cPct += 7.5; fPct -= 7.5;
    } else if (bodyType === 'mesomorph') {
      cPct += 2.5; fPct -= 2.5;
    } else if (bodyType === 'endomorph') {
      cPct -= 7.5; fPct += 7.5;
    }
  }

  // 6.4 Body Fat Modifiers (Carbs/Fats only)
  if (bodyFatPercent) {
    if (bodyFatPercent > 25) {
      cPct -= 5; fPct += 5;
    } else if (bodyFatPercent < 12) {
      cPct += 5; fPct -= 5;
    }
  }

  // 6.5 Activity Modifiers (Carbs/Fats only)
  if (activityLevel === 'active' || activityLevel === 'very_active') {
    cPct += 5; fPct -= 5;
  } else if (activityLevel === 'sedentary' || activityLevel === 'light') {
    cPct -= 5; fPct += 5;
  }

  // 6.6 Somatotype Constraints Setup
  if (bodyType === 'ectomorph' || bodyType === 'hardgainer') {
    carbCeilingPct = 55; fatMinPct = 25;
  } else if (bodyType === 'mesomorph') {
    carbCeilingPct = 50; carbFloorPct = 30; fatMinPct = 25;
  } else if (bodyType === 'endomorph') {
    carbCeilingPct = 40; fatMinPct = 30; fatMaxPct = 40;
  }

  // Step 10: Redistribution Engine
  // 10.1 Normalize to 100%
  let sum = pPct + cPct + fPct;
  pPct = (pPct / sum) * 100;
  cPct = (cPct / sum) * 100;
  fPct = (fPct / sum) * 100;

  // 10.2 & 10.3 Convert to Grams
  let fatGrams = (targetCalories * (fPct / 100)) / 9;
  let carbGrams = (targetCalories * (cPct / 100)) / 4;

  // 10.4 Enforce Floors and Ceilings
  // Protein is locked to the Step 5 calculation

  // Carb Ceiling
  const carbMaxGrams = (targetCalories * (carbCeilingPct / 100)) / 4;
  if (carbGrams > carbMaxGrams) {
    const diff = carbGrams - carbMaxGrams;
    carbGrams = carbMaxGrams;
    fatGrams += (diff * 4) / 9;
  }

  // Carb Floor (Mesomorph only)
  const carbMinGrams = (targetCalories * (carbFloorPct / 100)) / 4;
  if (carbGrams < carbMinGrams) {
    const diff = carbMinGrams - carbGrams;
    carbGrams = carbMinGrams;
    fatGrams -= (diff * 4) / 9;
  }

  // Fat Minimum
  const fatMinGrams = (targetCalories * (fatMinPct / 100)) / 9;
  if (fatGrams < fatMinGrams) {
    const diff = fatMinGrams - fatGrams;
    fatGrams = fatMinGrams;
    carbGrams -= (diff * 9) / 4;
  }

  // Fat Ceiling (Endomorph only)
  const fatMaxGrams = (targetCalories * (fatMaxPct / 100)) / 9;
  if (fatGrams > fatMaxGrams) {
    const diff = fatGrams - fatMaxGrams;
    fatGrams = fatMaxGrams;
    carbGrams += (diff * 9) / 4; // Redistribution goes to carbs, protein is locked
  }

  // --- Protein Adjustment & Carb Redistribution ---
  const origProteinGrams = proteinGrams;
  let increasePct = 0;
  if (goal === 'cut') increasePct = 0.10;
  else if (goal === 'maintain') increasePct = 0.10;
  else if (goal === 'recomp') increasePct = 0.15;
  else if (goal === 'bulk') increasePct = 0.20;

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

  // Final check to ensure total calories match target exactly
  proteinGrams = Math.max(0, proteinGrams);
  fatGrams = Math.max(0, fatGrams);
  carbGrams = Math.max(0, carbGrams);

  // Step 6: Rounding and UX
  proteinGrams = Math.round(proteinGrams);
  fatGrams = Math.round(fatGrams);
  carbGrams = Math.round(carbGrams);
  
  const proteinCalories = proteinGrams * 4;
  const fatCalories = fatGrams * 9;
  let carbCalories = carbGrams * 4;

  // DO NOT arbitrarily overwrite targetCalories with the sum. Let it remain the exact mathematical target.

  // Step 7: Optional wellness targets
  const fiber = Math.round(targetCalories / 1000 * 14); // 14g per 1000 kcal
  const water = parseFloat((weight * 0.033 + (activityLevel !== 'sedentary' ? 0.5 : 0)).toFixed(1));
  
  const stepsBase: Record<Goal, number> = { 
    cut: 10000, 
    maintain: 8000, 
    bulk: 7000,
    recomp: 9000
  };
  const steps = stepsBase[goal];

  // Step 8: Generate decision-explanation notes
  const notes: any[] = [];
  let personalizationScore = 40;
  const rulesFired: string[] = [];
  const constraintsApplied: string[] = [];

  // Track base goal
  rulesFired.push(`Goal Template: ${goal.toUpperCase()}`);

  // Precision Mode
  if (precisionMode) {
    personalizationScore += 15;
    rulesFired.push('Precision Mode Overrides');
    notes.push({
      category: 'Precision Targeting',
      text: 'Body-fat-adjusted, performance-grade macros.'
    });
  }

  // Somatotype Tweak
  if (somatotypeTweak) {
    personalizationScore += 10;
    rulesFired.push('Somatotype Tweak Adjustments');
    notes.push({
      category: 'Nutrient Partitioning',
      text: 'Adjusted for specific energy storage assumptions.'
    });
  }

  // Body Fat / BMR Pathway
  if (typeof bodyFatPercent === 'number' && bodyFatPercent > 0) {
    personalizationScore += 20;
    rulesFired.push('Body Fat Modifiers');
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

  // Goal Logic
  let goalText = '';
  if (goal === 'cut') goalText = '15% Cut Protocol';
  else if (goal === 'bulk') goalText = '15% Lean Bulk Protocol';
  else if (goal === 'recomp') goalText = 'High-Protein Maintenance Protocol';
  else goalText = 'Standard Maintenance Protocol';

  if (goal === 'cut' || goal === 'bulk') personalizationScore += 5;
  else if (goal === 'recomp') personalizationScore += 10;
  else personalizationScore += 5;

  notes.push({
    category: `Caloric ${goal === 'cut' ? 'Deficit' : goal === 'bulk' ? 'Surplus' : goal === 'recomp' ? 'Recomposition' : 'Maintenance'}`,
    text: goalText
  });

  // Activity Level
  if (activityLevel) {
    personalizationScore += 10;
    rulesFired.push('Activity Level Modifiers');
    
    let activityText = '';
    if (activityLevel === 'active' || activityLevel === 'very_active') activityText = 'High-Intensity Volume Scaling';
    else if (activityLevel === 'moderate') activityText = 'Moderate Performance Scaling';
    else activityText = 'Baseline Lifestyle Scaling';

    notes.push({
      category: 'Activity Scale',
      text: activityText
    });
  }

  // Track constraints (based on the calculation logic above)
  if (carbGrams === carbMaxGrams) constraintsApplied.push('Carb Ceiling');
  if (bodyType === 'mesomorph' && carbGrams === carbMinGrams) constraintsApplied.push('Carb Floor');
  if (fatGrams === fatMinGrams) constraintsApplied.push('Fat Minimum');
  if (bodyType === 'endomorph' && fatGrams === fatMaxGrams) constraintsApplied.push('Fat Ceiling');

  personalizationScore = Math.min(100, Math.max(0, personalizationScore));

  return {
    bmr,
    tdee,
    targets: {
      calories: targetCalories,
      protein: proteinGrams,
      carbs: carbGrams,
      fats: fatGrams,
      fiber,
      water,
      steps,
    },
    breakdown: {
      proteinCalories,
      carbCalories,
      fatCalories,
    },
    notes,
    personalizationScore,
    ruleTrace: {
      rulesFired,
      constraintsApplied,
      bfUsed: !!(precisionMode && typeof bodyFatPercent === 'number' && bodyFatPercent > 0),
      precisionMode: !!precisionMode,
      somatotype: bodyType
    }
  };
}

export function validateCalculatorInput(input: Partial<CalculatorInput>): CalculatorError[] {
  const errors: CalculatorError[] = [];

  if (!input.age || input.age < 16 || input.age > 80) {
    errors.push({ field: 'age', message: 'Age must be between 16 and 80.' });
  }

  if (!input.weight || input.weight < 40 || input.weight > 250) {
    errors.push({ field: 'weight', message: 'Weight must be between 40 and 250 kg.' });
  }

  if (!input.height || input.height < 140 || input.height > 220) {
    errors.push({ field: 'height', message: 'Height must be between 140 and 220 cm.' });
  }

  if (!input.sex || !['male', 'female'].includes(input.sex as string)) {
    errors.push({ field: 'sex', message: 'Please select a biological sex.' });
  }

  if (!input.activityLevel) {
    errors.push({ field: 'activityLevel', message: 'Please select your activity level.' });
  }

  if (!input.goal) {
    errors.push({ field: 'goal', message: 'Please select your goal.' });
  }

  return errors;
}
