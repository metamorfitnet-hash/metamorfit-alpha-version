// ─── Shared API Types ───────────────────────────────────────────────────────

export interface UserInput {
  name: string;
  email: string;
  planData: PlanData;
}

export interface PlanData {
  identity: {
    name?: string;
    age?: number;
    weightKg?: number;
    heightCm?: number;
    bodyFatPct?: number;
    goal?: string;
    bodyType?: string;
    [key: string]: unknown;
  };
  metabolicProfile: {
    proteinGrams: number;
    carbsGrams: number;
    fatsGrams: number;
    targetKcal?: number;
    tdee?: number;
    [key: string]: unknown;
  };
  personalization?: {
    personalizationScore?: number;
    [key: string]: unknown;
  };
  intelligenceNotes?: any[];
  meals?: any[];
  explanation?: string;
  personalizationScore?: number;
}

export interface ApiResponse {
  success: boolean;
  error?: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

/**
 * The Fly.io Worker endpoint that generates the PDF and sends it via Brevo.
 * Controlled by the NEXT_PUBLIC_FLY_PDF_URL env var.
 * 
 * Hard constraint fallback: https://metamorfit-pdf.fly.dev/api/send
 */
const FLY_PDF_URL =
  process.env.NEXT_PUBLIC_FLY_PDF_URL ??
  'https://metamorfit-pdf.fly.dev/api/send';

// ─── Result Type ─────────────────────────────────────────────────────────────

export type SendPlanResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Sends a plan request directly to the Fly.io Worker.
 *
 * The worker generates the PDF and emails it via Brevo.
 *
 * @param input - { name, email, planData }
 * @returns    SendPlanResult — discriminated union, check `.ok` before use
 */
export async function sendPlanRequest(input: UserInput): Promise<SendPlanResult> {
  const body: UserInput = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    planData: input.planData,
  };

  let response: Response;

  try {
    response = await fetch(FLY_PDF_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (networkErr: any) {
    return {
      ok: false,
      status: 0,
      error: networkErr?.message ?? 'Network error: could not reach the server',
    };
  }

  let data: ApiResponse;

  try {
    data = (await response.json()) as ApiResponse;
  } catch {
    return {
      ok: false,
      status: response.status,
      error: `Server returned a non-JSON response (HTTP ${response.status})`,
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: data.error ?? `Request failed with status ${response.status}`,
    };
  }

  return { ok: true };
}
