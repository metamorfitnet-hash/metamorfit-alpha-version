# Metabolic Engine Technical Specification

This document serves as the strict technical specification for our metabolic logic and meal planning engine, ensuring future AI sessions do not hallucinate or break our calculation rules.

## 1. CORE DETERMINISTIC FORMULAS

The core engine relies strictly on deterministic formulas to calculate Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE). 

**Basal Metabolic Rate (BMR):**
- **Default:** Mifflin-St Jeor Formula
  - Base: `10 * weight(kg) + 6.25 * height(cm) - 5 * age(years)`
  - Male: `Base + 5`
  - Female: `Base - 161`
- **Precision Mode (with body fat % provided):** Katch-McArdle Formula
  - `370 + 21.6 * Fat-Free Mass (kg)`

**Total Daily Energy Expenditure (TDEE):**
Calculated by multiplying the BMR by hardcoded activity multipliers:
- Sedentary: `1.2`
- Light: `1.375`
- Moderate: `1.55`
- Active: `1.725`
- Very Active: `1.9`

**Goal-Based Caloric Offsets:**
- Fat Loss: `-15%` (additional `-5%` in Precision Mode)
- Muscle Gain: `+15%` (additional `+5%` in Precision Mode)
- Recomp / Maintenance: `0%`

## 2. MACRONUTRIENT SPLIT LOGIC

The macronutrient breakdown is strictly calculated from the target calories, starting with protein and distributing the remainder to carbohydrates and fats.

**Protein Logic:**
- **Fat Loss:** 2.2 g/kg (Increases to 2.4 g/kg if very lean: <12% body fat for males, <20% for females)
- **Maintenance:** 1.8 g/kg
- **Recomp:** 2.0 g/kg
- **Muscle Gain:** 1.7 g/kg

*Note: Protein is calculated against Fat-Free Mass (FFM) if body fat percentage is known, Universal Ideal Body Weight (IBW) if BMI >= 30, or Total Body Weight otherwise.*

**Carbohydrate & Fat Logic (Calculated from remaining calories):**
- **Fat Loss:** 45% Carbs / 55% Fat
- **Maintenance:** 55% Carbs / 45% Fat
- **Muscle Gain:** 65% Carbs / 35% Fat
- **Recomp:** 50% Carbs / 50% Fat

Modifiers are strictly applied to Carb/Fat ratios based on Precision Mode, somatotype (Ectomorph, Mesomorph, Endomorph), body fat percentage, and activity level. Calorie redistribution rules ensure minimum safe intakes for protein and fats.

## 3. STRUCTURED AI MEAL PLAN SCHEMA

The AI engine supplements the metabolic formulas by providing personalized, contextual explanations. The AI is restricted to outputting a perfectly structured JSON object conforming to the following schema:

```json
{
  "paragraph1": "string (Focus on their specific body type, goal, and metabolic rate)",
  "paragraph2": "string (Focus on how the protein and energy balance supports them)",
  "paragraph3": "string (Focus on adherence and a supportive closing)"
}
```
*Note: The AI's job is to EXPLAIN the deterministic results. It is never permitted to modify or guess macro/calorie targets.*

## 4. EXECUTION CONSTRAINTS

> [!CAUTION]
> **STRICT REQUIREMENT:** All core metabolic calculations (Calories, Macros, TDEE, BMR) MUST remain strictly deterministic (math-driven). These calculations must NEVER be replaced by arbitrary AI-generated guesses or logic. The AI generation is strictly constrained to the structured explanation schema above.
