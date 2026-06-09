/**
 * Client helper to estimate macros via the Cloudflare Worker.
 * Can be used directly from client components or imported by API routes.
 */

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_A_URL || "https://metamorfit-worker-alpha.metamorfitnet.workers.dev";

export interface MacroEstimate {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fats_g?: number; // alias — some prompts return fat_g, others fats_g
}

/**
 * Sends a meal description to the Cloudflare Worker and returns
 * an estimated macro breakdown.
 *
 * @param description - e.g. "3 scrambled eggs and avocado toast"
 * @returns MacroEstimate
 */
export async function estimateMacros(
  description: string
): Promise<MacroEstimate> {
  if (!description.trim()) {
    throw new Error("Meal description cannot be empty.");
  }

  const response = await fetch(`${WORKER_URL}/api/estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Worker returned ${response.status}: ${errorBody}`
    );
  }

  const data: MacroEstimate = await response.json();

  // Normalise: ensure fats_g is always available (some prompts use fat_g)
  if (data.fat_g !== undefined && data.fats_g === undefined) {
    data.fats_g = data.fat_g;
  }

  return data;
}
