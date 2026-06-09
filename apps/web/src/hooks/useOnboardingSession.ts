import { useState, useEffect } from 'react';
import type { MacroPayload } from '@/types/session';

const STORAGE_KEY = 'mm_uid';
const STORAGE_KEY_FINALIZED = 'mm_finalized';
const STORAGE_KEY_PAYLOAD = 'mm_session_payload';
const UI_SECRET = process.env.NEXT_PUBLIC_MM_UI_SECRET || 'meta_alpha_sec_a7c2e9f1b3d8k9m_42891_abc';

export function useOnboardingSession() {
  const [ledger, setLedger] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finalized, setFinalized] = useState<boolean>(false);
  const [sessionPayload, setSessionPayload] = useState<MacroPayload | null>(null);

  const workerUrl = process.env.NEXT_PUBLIC_WORKER_A_URL || 'https://metamorfit-worker-alpha.metamorfitnet.workers.dev';
  const baseUrl = (workerUrl.endsWith('/') ? workerUrl.slice(0, -1) : workerUrl) + '/api';

  const getHeaders = () => ({
    'Authorization': `Bearer ${UI_SECRET}`,
    'Content-Type': 'application/json'
  });

  // 1. Session Recovery — rehydrate all state from sessionStorage
  useEffect(() => {
    let isRecovered = false;
    // Rehydrate finalized state
    try {
      const savedFinalized = sessionStorage.getItem(STORAGE_KEY_FINALIZED);
      console.log("[useOnboardingSession] Recovered finalized:", savedFinalized);
      if (savedFinalized === 'true') {
        setFinalized(true);
        isRecovered = true;
      }

      const savedPayload = sessionStorage.getItem(STORAGE_KEY_PAYLOAD);
      console.log("[useOnboardingSession] Recovered payload exists:", !!savedPayload);
      if (savedPayload) {
        setSessionPayload(JSON.parse(savedPayload));
      }
    } catch (e) {
      console.error('Failed to rehydrate session state', e);
    }

    const userId = localStorage.getItem(STORAGE_KEY);
    if (!userId) {
      setLoading(false);
      return;
    }

    fetch(`${baseUrl}/ledger/${userId}`, { headers: getHeaders() })
      .then(res => {
        if (res.status === 404) throw new Error("SESSION_EXPIRED");
        return res.json();
      })
      .then(data => {
        setLedger(data);
        if (data.status === 'complete') {
          console.log("[useOnboardingSession] Session is complete on backend, rehydrating finalized state.");
          const transformed = mapLedgerEntryToMacroPayload(data);
          setSessionPayload(transformed);
          setFinalized(true);
        }
      })
      .catch(err => {
        if (err.message === "SESSION_EXPIRED") {
          localStorage.removeItem(STORAGE_KEY);
          setError("Session expired. Starting over.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // 2. Persist finalized & sessionPayload to sessionStorage whenever they change
  useEffect(() => {
    if (finalized) {
      sessionStorage.setItem(STORAGE_KEY_FINALIZED, 'true');
    }
  }, [finalized]);

  useEffect(() => {
    if (sessionPayload) {
      sessionStorage.setItem(STORAGE_KEY_PAYLOAD, JSON.stringify(sessionPayload));
    }
  }, [sessionPayload]);

  // 3. Initialize Session
  const initSession = async () => {
    const res = await fetch(`${baseUrl}/ledger/init`, { 
      method: 'POST', 
      headers: getHeaders() 
    });
    const data = await res.json();
    localStorage.setItem(STORAGE_KEY, data.userId);
    setLedger(data);
    return data;
  };

  // 4. Save Step
  const saveStep = async (patchData: any) => {
    const userId = localStorage.getItem(STORAGE_KEY);
    if (!userId) return;

    const res = await fetch(`${baseUrl}/ledger/${userId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(patchData)
    });
    const updated = await res.json();
    setLedger(updated);
    return updated;
  };

  // 5. Finalize — transitions to the "results" state
  const finalize = async () => {
    const userId = localStorage.getItem(STORAGE_KEY);
    if (!userId) return;

    try {
      const res = await fetch(`${baseUrl}/ledger/${userId}/finalize`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (!res.ok) {
        throw new Error(`Finalize failed with status ${res.status}`);
      }

      const entry = await res.json();
      setLedger(entry);
      
      const finalData = mapLedgerEntryToMacroPayload(entry);
      setSessionPayload(finalData);
      setFinalized(true);
      return finalData;
    } catch (err) {
      console.error('[useOnboardingSession] finalize error:', err);
      throw err;
    }
  };

  return { ledger, initSession, saveStep, finalize, loading, error, finalized, sessionPayload };
}

function mapLedgerEntryToMacroPayload(entry: any): MacroPayload {
  const metrics = entry.results?.metrics || {};
  const data = entry.data || {};
  
  const insights = (entry.personalizationCards || []).map((card: any) => ({
    category: (card.title || "PRECISION").toLowerCase(),
    text: card.description || ""
  }));

  return {
    calories: metrics.targetCalories || 0,
    protein: metrics.macros?.protein || 0,
    carbs: metrics.macros?.carbs || 0,
    fat: metrics.macros?.fats || 0,
    tdee: metrics.tdee || 0,
    bmr: metrics.bmr || 0,
    personalizationScore: 98,
    insights: insights as any,
    explanation: entry.results?.aiInsight || "Your metabolic profile is ready. Follow these targets to optimize your results.",
    somatotype: data.somatotype || 'mesomorph',
    fiber: metrics.macros?.protein ? Math.round(metrics.macros.protein * 0.2) : 30,
    water: 3.7,
    steps: 10000,
    goal: data.goal || 'maintenance',
  };
}
