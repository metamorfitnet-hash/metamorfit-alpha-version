'use client';

import { useState, useEffect } from 'react';
import type { CalculatorInput, CalculatorResult, CalculatorError } from '@/types/calculator';
import type { MacroPayload } from '@/types/session';

const STORAGE_KEY_INPUT = 'metamorfit_input';
const STORAGE_KEY_RESULT = 'metamorfit_targets';

const DEFAULT_INPUT: CalculatorInput = {
  age: 0,
  weight: 0,
  height: 0,
  sex: 'male',
  activityLevel: 'moderate',
  goal: 'maintain',
  bodyType: 'mesomorph',
  bodyFatPercent: 0,
  precisionMode: false,
  somatotypeTweak: false,
};

export function useCalculator() {
  const [input, setInput] = useState<CalculatorInput>(DEFAULT_INPUT);
  const [result, setResult] = useState<CalculatorResult | null>(null);

  // 1. Initial Load from Storage (Client-side Only)
  useEffect(() => {
    const savedInput = sessionStorage.getItem(STORAGE_KEY_INPUT);
    const savedResult = sessionStorage.getItem(STORAGE_KEY_RESULT);

    if (savedInput) {
      try {
        setInput(JSON.parse(savedInput));
      } catch (e) {
        console.error("Failed to parse saved input", e);
      }
    }

    if (savedResult) {
      try {
        setResult(JSON.parse(savedResult));
      } catch (e) {
        console.error("Failed to parse saved targets", e);
      }
    }
  }, []);

  // 2. Persist Changes to Storage
  useEffect(() => {
    if (input.age > 0 || input.weight > 0 || input.height > 0) {
      sessionStorage.setItem(STORAGE_KEY_INPUT, JSON.stringify(input));
    }
  }, [input]);

  useEffect(() => {
    if (result) {
      sessionStorage.setItem(STORAGE_KEY_RESULT, JSON.stringify(result));
    }
  }, [result]);
  const [errors, setErrors] = useState<CalculatorError[]>([]);
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof CalculatorInput>(key: K, value: CalculatorInput[K]) {
    setInput(prev => ({ ...prev, [key]: value }));
    // Clear the error for this field on change
    setErrors(prev => prev.filter(e => e.field !== key));
  }

  async function submit() {
    setLoading(true);
    setErrors([]);

    try {
      const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_A_URL || "https://metamorfit-worker-beta.metamorfitnet.workers.dev";
      const baseUrl = WORKER_URL.endsWith('/') ? WORKER_URL.slice(0, -1) : WORKER_URL;

      // Map frontend fields to Worker's expected schema
      const mappedGoal = {
        'cut': 'fat_loss',
        'maintain': 'maintenance',
        'bulk': 'muscle_gain',
        'recomp': 'recomp'
      }[input.goal] || 'maintenance';

      const payload = {
        age: input.age,
        sex: input.sex,
        weightKg: input.weight,
        weight: input.weight, // Alternative name
        heightCm: input.height,
        height: input.height, // Alternative name
        activityLevel: input.activityLevel,
        goal: mappedGoal,
        bodyType: input.bodyType,
        bodyFatPercent: input.bodyFatPercent,
        bodyFatPct: input.bodyFatPercent, // Alternative name
        precisionMode: input.precisionMode,
        somatotypeTweak: input.somatotypeTweak,
        locale: typeof window !== 'undefined' ? (localStorage.getItem('i18nextLng') || 'en').substring(0, 2) : 'en'
      };



      const response = await fetch(`${baseUrl}/api/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[useCalculator] Worker error (${response.status}):`, errorText);
        throw new Error(`Worker returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("DEBUG_FULL_RESPONSE:", data);


      // Mapping Layer: Ensure the frontend gets exactly what it expects
      const processedResult = {
        ...data,
        targets: {
          calories: data.targets?.calories || data.targetKcal || 0,
          protein: data.targets?.protein || data.macros?.protein || 0,
          carbs: data.targets?.carbs || data.macros?.carbs || 0,
          fats: data.targets?.fats || data.macros?.fats || 0,
          fiber: data.targets?.fiber || 0,
          water: data.targets?.water || 0,
          steps: data.targets?.steps || 0
        },
        notes: data.notes || data.insights || data.intelligenceNotes || [],
        personalizationScore: Number(data.personalizationScore) || 0
      };



      setResult(processedResult);

    } catch (error: any) {
      console.error('Metabolic Engine Worker Error:', error);
      setErrors([{
        field: 'general',
        message: `Connection error: ${error.message || 'Worker unavailable'}`
      }]);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setInput(DEFAULT_INPUT);
    setResult(null);
    setErrors([]);
    sessionStorage.removeItem(STORAGE_KEY_INPUT);
    sessionStorage.removeItem(STORAGE_KEY_RESULT);
  }

  async function finalizeSession(userId: string): Promise<MacroPayload | null> {
    try {
      const workerUrl = process.env.NEXT_PUBLIC_WORKER_A_URL || 'https://metamorfit-worker-beta.metamorfitnet.workers.dev';
      const baseUrl = (workerUrl.endsWith('/') ? workerUrl.slice(0, -1) : workerUrl) + '/api';
      
      const response = await fetch(`${baseUrl}/ledger/${userId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: Date.now() }),
      });

      if (!response.ok) {
        throw new Error(`Failed to finalize session: ${response.statusText}`);
      }

      const data: MacroPayload = await response.json();
      return data;
    } catch (error) {
      console.error('Error finalizing session:', error);
      return null;
    }
  }

  return {
    input,
    result,
    errors,
    loading,
    updateField,
    submit,
    reset,
    setInput,
    finalizeSession
  };
}
